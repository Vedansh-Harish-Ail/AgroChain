from flask import Blueprint, jsonify, request
from models import db, User, Farmer, Product, Investment, AuditLog
from utils.auth import roles_allowed

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@roles_allowed('ADMIN')
def get_all_users(current_user):
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@admin_bp.route('/approve-user/<int:user_id>', methods=['POST'])
@roles_allowed('ADMIN')
def approve_user(current_user, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    user.is_approved = True
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='USER_APPROVED_BY_ADMIN',
        details=f"Admin {current_user.name} approved user {user.name} (Role: {user.role})."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': f'User {user.name} approved successfully!',
        'user': user.to_dict()
    }), 200


@admin_bp.route('/verify-farmer/<int:user_id>', methods=['POST'])
@roles_allowed('ADMIN')
def verify_farmer(current_user, user_id):
    user = User.query.get(user_id)
    if not user or user.role != 'FARMER':
        return jsonify({'message': 'Farmer not found'}), 404
        
    data = request.get_json() or {}
    verify = data.get('verify', True)
    
    user.is_verified_farmer = verify
    db.session.commit()
    
    # Audit log
    action = 'FARMER_PROFILE_VERIFIED' if verify else 'FARMER_PROFILE_UNVERIFIED'
    audit = AuditLog(
        user_id=current_user.id,
        action=action,
        details=f"Admin {current_user.name} set verification status for farmer {user.name} to {verify}."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': f"Farmer profile {'verified' if verify else 'unverified'} successfully!",
        'user': user.to_dict()
    }), 200


@admin_bp.route('/audit-logs', methods=['GET'])
@roles_allowed('ADMIN')
def get_audit_logs(current_user):
    limit = request.args.get('limit', 50, type=int)
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return jsonify([log.to_dict() for log in logs]), 200


@admin_bp.route('/analytics', methods=['GET'])
@roles_allowed('ADMIN')
def get_analytics(current_user):
    # Counts
    farmer_count = User.query.filter_by(role='FARMER').count()
    tester_count = User.query.filter_by(role='TESTER').count()
    consumer_count = User.query.filter_by(role='CONSUMER').count()
    investor_count = User.query.filter_by(role='INVESTOR').count()
    
    # Funding Volume
    total_funding = db.session.query(db.func.sum(Investment.amount)).scalar() or 0
    
    # Crop category counts
    crop_counts = db.session.query(
        Farmer.crop_type, db.func.count(Farmer.id)
    ).group_by(Farmer.crop_type).all()
    crop_categories = {crop[0]: crop[1] for crop in crop_counts}
    
    # Quality approvals count
    approved_products = Product.query.filter_by(certification_status='APPROVED').count()
    rejected_products = Product.query.filter_by(certification_status='REJECTED').count()
    
    # System health/fraud alerts (mock rules e.g., investments on unapproved lots or mismatching wallets)
    fraud_warnings = []
    suspicious_investments = Investment.query.join(Product).filter(
        Product.certification_status == 'REJECTED'
    ).all()
    for inv in suspicious_investments:
        fraud_warnings.append({
            'type': 'CRITICAL_SUSPICION',
            'details': f"Investment ID {inv.id} made on a REJECTED product Lot {inv.lot_number}."
        })
        
    return jsonify({
        'user_counts': {
            'farmers': farmer_count,
            'testers': tester_count,
            'consumers': consumer_count,
            'investors': investor_count
        },
        'total_funding_wei': total_funding,
        'crop_categories': crop_categories,
        'quality_stats': {
            'approved': approved_products,
            'rejected': rejected_products
        },
        'fraud_warnings': fraud_warnings
    }), 200
