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
    
    # Notify Farmer via email
    from utils.email import send_email, get_html_template
    farmer_user = crop.user
    if farmer_user and farmer_user.email:
        subject = "Crop Registration Approved - AgroChain"
        text_body = f"Hello {farmer_user.name},\n\nYour crop registration for {crop.crop_type} (ID: {crop_id}) has been approved by Inspector {current_user.name}.\n\nRemarks: {tester_remarks}"
        html_body = get_html_template(
            title="Crop Registration Approved!",
            body_text=f"<p>Hello <strong>{farmer_user.name}</strong>,</p><p>We are pleased to inform you that Agricultural Inspector <strong>{current_user.name}</strong> has verified and approved your crop registration for <strong>{crop.crop_type} (ID: {crop_id})</strong>.</p><p><strong>Inspector Remarks:</strong><br>{tester_remarks or 'No remarks provided.'}</p><p>You can now update your crop status or prepare for testing.</p>",
            cta_text="View Crop History",
            cta_url="http://localhost:5173/dashboard"
        )
        try:
            send_email(subject, farmer_user.email, text_body, html_body)
        except Exception as e:
            print(f"Error sending crop approval email: {e}")
            
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
    
    # Notify Farmer via email
    from utils.email import send_email, get_html_template
    farmer_user = crop.user
    if farmer_user and farmer_user.email:
        subject = "Crop Registration Rejected - AgroChain"
        text_body = f"Hello {farmer_user.name},\n\nYour crop registration for {crop.crop_type} (ID: {crop_id}) has been rejected by Inspector {current_user.name}.\n\nRemarks: {tester_remarks}"
        html_body = get_html_template(
            title="Crop Registration Rejected",
            body_text=f"<p>Hello <strong>{farmer_user.name}</strong>,</p><p>We regret to inform you that Agricultural Inspector <strong>{current_user.name}</strong> has rejected your crop registration for <strong>{crop.crop_type} (ID: {crop_id})</strong>.</p><p><strong>Inspector Remarks:</strong><br>{tester_remarks or 'No remarks provided.'}</p><p>Please review the remarks and resubmit if necessary.</p>",
            cta_text="Go to Dashboard",
            cta_url="http://localhost:5173/dashboard"
        )
        try:
            send_email(subject, farmer_user.email, text_body, html_body)
        except Exception as e:
            print(f"Error sending crop rejection email: {e}")
            
    return jsonify({
        'message': 'Crop registration rejected.',
        'crop': crop.to_dict()
    }), 200


@quality_bp.route('/pending', methods=['GET'])
@roles_allowed('INSPECTOR', 'TESTER', 'ADMIN')
def get_pending_crops(current_user):
    if current_user.role == 'ADMIN':
        crops = Farmer.query.all()
    elif current_user.role == 'INSPECTOR':
        crops = Farmer.query.filter_by(is_approved=False, assigned_inspector_id=current_user.id).all()
    elif current_user.role == 'TESTER':
        crops = Farmer.query.filter(
            Farmer.is_approved == True,
            Farmer.assigned_tester_id == current_user.id,
            Farmer.timeline_status.in_(['READY_TO_HARVEST', 'HARVEST_COMPLETED', 'PRODUCT_AVAILABLE'])
        ).all()
    else:
        crops = []
    return jsonify([crop.to_dict() for crop in crops]), 200
