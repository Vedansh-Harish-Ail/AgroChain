from flask import Blueprint, request, jsonify, current_app
from models import db, Farmer, AuditLog
from utils.auth import roles_allowed

quality_bp = Blueprint('quality', __name__)

@quality_bp.route('/crop/<string:crop_id>', methods=['GET'])
@roles_allowed('TESTER', 'ADMIN')
def get_crop_for_certification(current_user, crop_id):
    """Fetch crop details for the quality tester certification form (auto-fill on Crop ID entry)."""
    val = crop_id.strip()
    if val.upper().startswith('CRP-2026-'):
        try:
            numeric_id = int(val.upper().replace('CRP-2026-', ''))
        except ValueError:
            return jsonify({'message': 'Invalid Crop ID format.'}), 400
    else:
        try:
            numeric_id = int(val)
        except ValueError:
            return jsonify({'message': 'Invalid Crop ID format.'}), 400
            
    crop = Farmer.query.filter_by(id=numeric_id, is_approved=True).first()
    if not crop:
        return jsonify({'message': 'No approved crop found with this ID.'}), 404
    return jsonify({'crop': crop.to_dict()}), 200


@quality_bp.route('/approve/<int:crop_id>', methods=['POST'])
@roles_allowed('INSPECTOR', 'ADMIN')
def approve_crop(current_user, crop_id):
    from datetime import datetime, timezone
    crop = Farmer.query.get(crop_id)
    if not crop:
        return jsonify({'message': 'Crop registration not found'}), 404
        
    if current_user.role != 'ADMIN' and crop.assigned_inspector_id != current_user.id:
        # Allow inspectors to claim and act on crops in their district/sub-district
        can_claim = False
        if current_user.district:
            if current_user.coverage_level == 'DISTRICT' and crop.district == current_user.district:
                can_claim = True
            elif current_user.coverage_level == 'SUB_DISTRICT' and crop.sub_district == current_user.sub_district and crop.district == current_user.district:
                can_claim = True
            elif crop.district == current_user.district:
                can_claim = True
        if not can_claim:
            return jsonify({'message': 'Unauthorized. Crop is in a different district.'}), 403
        # Auto-assign this crop to the inspector
        crop.assigned_inspector_id = current_user.id
        
    data = request.get_json() or {}
    tx_hash = data.get('tx_hash')
    block_number = data.get('block_number')
    tester_remarks = data.get('tester_remarks')
    inspection_notes = data.get('inspection_notes') or tester_remarks
    inspection_method = data.get('inspection_method') or 'PHYSICAL_VISIT'
    
    crop.is_approved = True
    crop.verification_status = 'VERIFIED'
    crop.tester_remarks = inspection_notes
    crop.tester_id = current_user.id
    crop.verification_date = datetime.now(timezone.utc)
    crop.inspection_date = datetime.now(timezone.utc)
    crop.inspection_notes = inspection_notes
    crop.inspection_method = inspection_method
    crop.timeline_status = 'TESTER_APPROVED'
    crop.investment_start_date = datetime.now(timezone.utc)
    
    if tx_hash:
        crop.tx_hash = tx_hash
        crop.blockchain_status = 'VERIFIED'
    if block_number:
        crop.block_number = block_number
        
    db.session.commit()

    # Automatically create a PENDING Product record so investors can view and fund it in the marketplace
    from models import Product
    import random
    from datetime import timedelta
    
    existing_product = Product.query.filter_by(farmer_id=crop.id).first()
    if not existing_product:
        # Generate a unique 4-digit lot number
        lot_number = random.randint(1000, 9999)
        while Product.query.get(lot_number) is not None:
            lot_number = random.randint(1000, 9999)
            
        pending_product = Product(
            lot_number=lot_number,
            farmer_id=crop.id,
            crop_name=crop.crop_type,
            quality_grade='Grade Pending',
            price=1000000000000000000,
            test_date=datetime.now(timezone.utc),
            expiry_date=crop.expected_harvest_date or (datetime.now(timezone.utc) + timedelta(days=180)),
            certification_status='PENDING'
        )
        db.session.add(pending_product)
        db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='FARMER_CROP_APPROVED',
        details=f"Verified and approved crop ID {crop_id} with remarks: {inspection_notes}."
    )
    db.session.add(audit)
    db.session.commit()
    
    # Notify Farmer via email
    from utils.email import send_email, get_html_template
    farmer_user = crop.user
    if farmer_user and farmer_user.email:
        subject = "Crop Registration Approved - AgroChain"
        text_body = f"Hello {farmer_user.name},\n\nYour crop registration for {crop.crop_type} (ID: {crop_id}) has been approved by Inspector {current_user.name}.\n\nRemarks: {inspection_notes}"
        html_body = get_html_template(
            title="Crop Registration Approved!",
            body_text=f"<p>Hello <strong>{farmer_user.name}</strong>,</p><p>We are pleased to inform you that Agricultural Inspector <strong>{current_user.name}</strong> has verified and approved your crop registration for <strong>{crop.crop_type} (ID: {crop_id})</strong>.</p><p><strong>Inspector Remarks:</strong><br>{inspection_notes or 'No remarks provided.'}</p><p>You can now update your crop status or prepare for testing.</p>",
            cta_text="View Crop History",
            cta_url=f"{current_app.config['FRONTEND_URL']}/dashboard"
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
        # Allow inspectors to claim and act on crops in their district/sub-district
        can_claim = False
        if current_user.district:
            if current_user.coverage_level == 'DISTRICT' and crop.district == current_user.district:
                can_claim = True
            elif current_user.coverage_level == 'SUB_DISTRICT' and crop.sub_district == current_user.sub_district and crop.district == current_user.district:
                can_claim = True
            elif crop.district == current_user.district:
                can_claim = True
        if not can_claim:
            return jsonify({'message': 'Unauthorized. Crop is in a different district.'}), 403
        # Auto-assign this crop to the inspector
        crop.assigned_inspector_id = current_user.id
        
    data = request.get_json() or {}
    tester_remarks = data.get('tester_remarks')
    inspection_notes = data.get('inspection_notes') or tester_remarks
    inspection_method = data.get('inspection_method') or 'PHYSICAL_VISIT'
    
    crop.is_approved = False
    crop.verification_status = 'REJECTED'
    crop.tester_remarks = inspection_notes
    crop.tester_id = current_user.id
    crop.verification_date = datetime.now(timezone.utc)
    crop.inspection_date = datetime.now(timezone.utc)
    crop.inspection_notes = inspection_notes
    crop.inspection_method = inspection_method
    
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='FARMER_CROP_REJECTED',
        details=f"Rejected crop ID {crop_id} with remarks: {inspection_notes}."
    )
    db.session.add(audit)
    db.session.commit()
    
    # Notify Farmer via email
    from utils.email import send_email, get_html_template
    farmer_user = crop.user
    if farmer_user and farmer_user.email:
        subject = "Crop Registration Rejected - AgroChain"
        text_body = f"Hello {farmer_user.name},\n\nYour crop registration for {crop.crop_type} (ID: {crop_id}) has been rejected by Inspector {current_user.name}.\n\nRemarks: {inspection_notes}"
        html_body = get_html_template(
            title="Crop Registration Rejected",
            body_text=f"<p>Hello <strong>{farmer_user.name}</strong>,</p><p>We regret to inform you that Agricultural Inspector <strong>{current_user.name}</strong> has rejected your crop registration for <strong>{crop.crop_type} (ID: {crop_id})</strong>.</p><p><strong>Inspector Remarks:</strong><br>{inspection_notes or 'No remarks provided.'}</p><p>Please review the remarks and resubmit if necessary.</p>",
            cta_text="Go to Dashboard",
            cta_url=f"{current_app.config['FRONTEND_URL']}/dashboard"
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
        from sqlalchemy import or_
        # Show crops explicitly assigned to this inspector
        # PLUS unassigned pending crops in the inspector's district/sub-district
        filters = [
            (Farmer.assigned_inspector_id == current_user.id) &
            (Farmer.is_approved == False) &
            (Farmer.verification_status == 'PENDING')
        ]
        
        if current_user.coverage_level == 'DISTRICT' and current_user.district:
            # District-level inspectors see all pending crops in their district
            filters.append(
                (Farmer.district == current_user.district) &
                (Farmer.is_approved == False) &
                (Farmer.verification_status == 'PENDING')
            )
        elif current_user.coverage_level == 'SUB_DISTRICT' and current_user.sub_district:
            # Sub-district-level inspectors see pending crops in their sub-district
            filters.append(
                (Farmer.sub_district == current_user.sub_district) &
                (Farmer.district == current_user.district) &
                (Farmer.is_approved == False) &
                (Farmer.verification_status == 'PENDING')
            )
        elif current_user.district:
            # Fallback: match by district
            filters.append(
                (Farmer.district == current_user.district) &
                (Farmer.is_approved == False) &
                (Farmer.verification_status == 'PENDING')
            )
        
        crops = Farmer.query.filter(or_(*filters)).all()
    elif current_user.role == 'TESTER':
        all_crops = Farmer.query.filter(
            Farmer.is_approved == True,
            Farmer.assigned_tester_id == current_user.id,
            Farmer.timeline_status.in_(['READY_TO_HARVEST', 'HARVEST_COMPLETED'])
        ).all()
        from models import Product
        crops = []
        for crop in all_crops:
            product = Product.query.filter_by(farmer_id=crop.id).first()
            if not product or product.certification_status == 'PENDING':
                crops.append(crop)
    else:
        crops = []
    return jsonify([crop.to_dict() for crop in crops]), 200


@quality_bp.route('/save-notes/<int:crop_id>', methods=['POST'])
@roles_allowed('INSPECTOR', 'ADMIN')
def save_notes(current_user, crop_id):
    from datetime import datetime, timezone
    crop = Farmer.query.get(crop_id)
    if not crop:
        return jsonify({'message': 'Crop registration not found'}), 404
        
    if current_user.role != 'ADMIN' and crop.assigned_inspector_id != current_user.id:
        # Allow inspectors to claim and act on crops in their district/sub-district
        can_claim = False
        if current_user.district:
            if current_user.coverage_level == 'DISTRICT' and crop.district == current_user.district:
                can_claim = True
            elif current_user.coverage_level == 'SUB_DISTRICT' and crop.sub_district == current_user.sub_district and crop.district == current_user.district:
                can_claim = True
            elif crop.district == current_user.district:
                can_claim = True
        if not can_claim:
            return jsonify({'message': 'Unauthorized. Crop is in a different district.'}), 403
        # Auto-assign this crop to the inspector
        crop.assigned_inspector_id = current_user.id
        
    data = request.get_json() or {}
    inspection_notes = data.get('inspection_notes')
    inspection_method = data.get('inspection_method')
    
    if not inspection_notes or not inspection_method:
        return jsonify({'message': 'Missing inspection notes or method'}), 400
        
    if inspection_method not in ['PHYSICAL_VISIT', 'PHOTO_REVIEW', 'HYBRID']:
        return jsonify({'message': 'Invalid inspection method'}), 400
        
    crop.tester_remarks = inspection_notes
    crop.inspection_notes = inspection_notes
    crop.inspection_method = inspection_method
    crop.inspection_date = datetime.now(timezone.utc)
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='INSPECTOR_SAVED_NOTES',
        details=f"Uploaded inspection notes for crop ID {crop_id}."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Inspection notes saved successfully!',
        'crop': crop.to_dict()
    }), 200
