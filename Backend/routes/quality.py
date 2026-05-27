from flask import Blueprint, request, jsonify
from models import db, Farmer, AuditLog
from utils.auth import roles_allowed

quality_bp = Blueprint('quality', __name__)

@quality_bp.route('/approve/<int:crop_id>', methods=['POST'])
@roles_allowed('TESTER', 'ADMIN')
def approve_crop(current_user, crop_id):
    crop = Farmer.query.get(crop_id)
    if not crop:
        return jsonify({'message': 'Crop registration not found'}), 404
        
    data = request.get_json() or {}
    tx_hash = data.get('tx_hash')
    block_number = data.get('block_number')
    
    crop.is_approved = True
    if tx_hash:
        crop.tx_hash = tx_hash
    if block_number:
        crop.block_number = block_number
        
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='FARMER_CROP_APPROVED',
        details=f"Quality Authority {current_user.name} approved crop ID {crop_id}."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Crop registration approved successfully!',
        'crop': crop.to_dict()
    }), 200


@quality_bp.route('/reject/<int:crop_id>', methods=['POST'])
@roles_allowed('TESTER', 'ADMIN')
def reject_crop(current_user, crop_id):
    crop = Farmer.query.get(crop_id)
    if not crop:
        return jsonify({'message': 'Crop registration not found'}), 404
        
    crop.is_approved = False
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='FARMER_CROP_REJECTED',
        details=f"Quality Authority {current_user.name} rejected crop ID {crop_id}."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Crop registration rejected.',
        'crop': crop.to_dict()
    }), 200


@quality_bp.route('/pending', methods=['GET'])
@roles_allowed('TESTER', 'ADMIN')
def get_pending_crops(current_user):
    crops = Farmer.query.filter_by(is_approved=False).all()
    return jsonify([crop.to_dict() for crop in crops]), 200
