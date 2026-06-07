from flask import Blueprint, request, jsonify
from models import db, Farmer, AuditLog
from utils.auth import roles_allowed

quality_bp = Blueprint('quality', __name__)

@quality_bp.route('/approve/<int:crop_id>', methods=['POST'])
@roles_allowed('INSPECTOR', 'ADMIN')
def approve_crop(current_user, crop_id):
    from datetime import datetime, timezone
    crop = Farmer.query.get(crop_id)
    if not crop:
        return jsonify({'message': 'Crop registration not found'}), 404
        
    if current_user.role != 'ADMIN' and crop.assigned_inspector_id != current_user.id:
        return jsonify({'message': 'Unauthorized. Crop is not assigned to you.'}), 403
        
    data = request.get_json() or {}
    tx_hash = data.get('tx_hash')
    block_number = data.get('block_number')
    tester_remarks = data.get('tester_remarks')
    
    crop.is_approved = True
    crop.verification_status = 'VERIFIED'
    crop.tester_remarks = tester_remarks
    crop.tester_id = current_user.id
    crop.verification_date = datetime.now(timezone.utc)
    crop.timeline_status = 'TESTER_APPROVED'
    
    if tx_hash:
        crop.tx_hash = tx_hash
        crop.blockchain_status = 'VERIFIED'
    if block_number:
        crop.block_number = block_number
        
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='FARMER_CROP_APPROVED',
        details=f"Agricultural Inspector {current_user.name} verified and approved crop ID {crop_id} with remarks: {tester_remarks}."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Crop registration approved successfully!',
        'crop': crop.to_dict()
    }), 200


@quality_bp.route('/reject/<int:crop_id>', methods=['POST'])
@roles_allowed('INSPECTOR', 'ADMIN')
def reject_crop(current_user, crop_id):
    from datetime import datetime, timezone
    crop = Farmer.query.get(crop_id)
    if not crop:
        return jsonify({'message': 'Crop registration not found'}), 404
        
    if current_user.role != 'ADMIN' and crop.assigned_inspector_id != current_user.id:
        return jsonify({'message': 'Unauthorized. Crop is not assigned to you.'}), 403
        
    data = request.get_json() or {}
    tester_remarks = data.get('tester_remarks')
    
    crop.is_approved = False
    crop.verification_status = 'REJECTED'
    crop.tester_remarks = tester_remarks
    crop.tester_id = current_user.id
    crop.verification_date = datetime.now(timezone.utc)
    
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='FARMER_CROP_REJECTED',
        details=f"Agricultural Inspector {current_user.name} rejected crop ID {crop_id} with remarks: {tester_remarks}."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Crop registration rejected.',
        'crop': crop.to_dict()
    }), 200


@quality_bp.route('/pending', methods=['GET'])
@roles_allowed('INSPECTOR', 'ADMIN')
def get_pending_crops(current_user):
    if current_user.role == 'ADMIN':
        crops = Farmer.query.filter_by(is_approved=False).all()
    else:
        crops = Farmer.query.filter_by(is_approved=False, assigned_inspector_id=current_user.id).all()
    return jsonify([crop.to_dict() for crop in crops]), 200
