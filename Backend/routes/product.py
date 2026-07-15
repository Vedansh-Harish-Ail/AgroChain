from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from models import db, Product, Farmer, AuditLog
from utils.auth import roles_allowed

product_bp = Blueprint('product', __name__)

@product_bp.route('/register', methods=['POST'])
@roles_allowed('TESTER', 'ADMIN')
def register_product(current_user):
    data = request.get_json() or {}
    
    lot_number = data.get('lot_number')
    farmer_id = data.get('farmer_id')
    crop_name = data.get('crop_name')
    quality_grade = data.get('quality_grade')
    price = data.get('price')
    test_date_str = data.get('test_date')
    expiry_date_str = data.get('expiry_date')
    tx_hash = data.get('tx_hash')
    block_number = data.get('block_number')
    
    if not lot_number or not farmer_id or not crop_name or not quality_grade or price is None or not test_date_str or not expiry_date_str:
        return jsonify({'message': 'Missing required fields'}), 400
        
    # Derive status automatically: if grade is C, reject the lot.
    norm_grade = quality_grade.replace('Grade ', '').strip()
    if norm_grade == 'C':
        certification_status = 'REJECTED'
    else:
        certification_status = 'APPROVED'
        
    # Check if lot already exists
    if Product.query.get(lot_number):
        return jsonify({'message': f'Product batch with Lot Number {lot_number} already registered'}), 400
        
    # Check if farmer crop project is approved
    farmer_project = Farmer.query.get(farmer_id)
    if not farmer_project:
        return jsonify({'message': 'Farmer crop project not found'}), 404
    if not farmer_project.is_approved:
        return jsonify({'message': 'Farmer cultivation must be approved by Agricultural Inspector first'}), 400
        
    if current_user.role != 'ADMIN' and farmer_project.assigned_tester_id != current_user.id:
        return jsonify({'message': 'Unauthorized. You are not assigned to test this crop batch.'}), 403
        
    try:
        test_date = datetime.fromisoformat(test_date_str.replace('Z', ''))
        expiry_date = datetime.fromisoformat(expiry_date_str.replace('Z', ''))
        price = int(price)
        lot_number = int(lot_number)
    except ValueError:
        return jsonify({'message': 'Invalid format for numeric or date fields'}), 400

    new_product = Product(
        lot_number=lot_number,
        farmer_id=farmer_id,
        crop_name=crop_name,
        quality_grade=quality_grade,
        price=price,
        test_date=test_date,
        expiry_date=expiry_date,
        certification_status=certification_status,
        tx_hash=tx_hash,
        block_number=block_number
    )
    
    if certification_status == 'APPROVED':
        farmer_project.timeline_status = 'PRODUCT_AVAILABLE'
    elif certification_status == 'REJECTED':
        farmer_project.timeline_status = 'REJECTED'
        farmer_project.is_approved = False

    db.session.add(new_product)
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='PRODUCT_LOT_CREATED',
        details=f"Certified product Lot {lot_number} for farmer ID {farmer_id}."
    )
    db.session.add(audit)
    db.session.commit()
    
    # Notify Farmer via email
    from utils.email import send_email, get_html_template
    farmer_user = farmer_project.user
    if farmer_user and farmer_user.email:
        if certification_status == 'APPROVED':
            subject = f"Crop Lot Certified ({quality_grade}) - AgroChain"
            text_body = f"Hello {farmer_user.name},\n\nYour crop lot for '{crop_name}' has been certified by the Quality Lab with Grade '{quality_grade}' (Lot Number: {lot_number}).\n\nYou can now view and print your Certificate & Batch QR code from your dashboard."
            html_body = get_html_template(
                title="Crop Lot Certified!",
                body_text=f"<p>Hello <strong>{farmer_user.name}</strong>,</p><p>We are excited to inform you that Quality Lab Tester <strong>{current_user.name}</strong> has tested and certified your crop batch.</p><table style='width: 100%; margin: 20px 0; border-collapse: collapse; border: 1px solid #e5e7eb;'><tr style='background-color: #f9fafb;'><td style='padding: 10px; font-weight: bold; border-bottom: 1px solid #e5e7eb;'>Crop Name:</td><td style='padding: 10px; border-bottom: 1px solid #e5e7eb;'>{crop_name}</td></tr><tr><td style='padding: 10px; font-weight: bold; border-bottom: 1px solid #e5e7eb;'>Certified Quality Grade:</td><td style='padding: 10px; border-bottom: 1px solid #e5e7eb; color: #059669; font-weight: bold;'>{quality_grade}</td></tr><tr style='background-color: #f9fafb;'><td style='padding: 10px; font-weight: bold;'>Lot Number:</td><td style='padding: 10px;'>{lot_number}</td></tr></table><p>You can now view, download, or print your gold-bordered Batch Quality Certificate and dynamic QR packaging labels directly from your AgroChain Document Center.</p>",
                cta_text="Go to Document Center",
                cta_url=f"{current_app.config['FRONTEND_URL']}/dashboard"
            )
        else:
            subject = f"Crop Lot Quality Test Failed - AgroChain"
            text_body = f"Hello {farmer_user.name},\n\nWe regret to inform you that your crop lot for '{crop_name}' (Lot Number: {lot_number}) did not pass the Quality Lab certification testing and has been REJECTED."
            html_body = get_html_template(
                title="Crop Lot Quality Certification Rejected",
                body_text=f"<p>Hello <strong>{farmer_user.name}</strong>,</p><p>We regret to inform you that Quality Lab Tester <strong>{current_user.name}</strong> has tested your crop batch and rejected its quality certification.</p><table style='width: 100%; margin: 20px 0; border-collapse: collapse; border: 1px solid #e5e7eb;'><tr style='background-color: #f9fafb;'><td style='padding: 10px; font-weight: bold; border-bottom: 1px solid #e5e7eb;'>Crop Name:</td><td style='padding: 10px; border-bottom: 1px solid #e5e7eb;'>{crop_name}</td></tr><tr><td style='padding: 10px; font-weight: bold; border-bottom: 1px solid #e5e7eb;'>Certification Status:</td><td style='padding: 10px; border-bottom: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;'>REJECTED</td></tr><tr style='background-color: #f9fafb;'><td style='padding: 10px; font-weight: bold;'>Lot Number:</td><td style='padding: 10px;'>{lot_number}</td></tr></table><p>Please log in to your dashboard to review details or contact the Quality Lab for further information.</p>",
                cta_text="Go to Dashboard",
                cta_url=f"{current_app.config['FRONTEND_URL']}/dashboard"
            )
        try:
            send_email(subject, farmer_user.email, text_body, html_body)
        except Exception as e:
            print(f"Error sending certification email: {e}")
            
    return jsonify({
        'message': 'Product Lot certified and registered successfully!',
        'product': new_product.to_dict()
    }), 201



@product_bp.route('/all', methods=['GET'])
def get_all_products():
    products = Product.query.all()
    return jsonify([p.to_dict() for p in products]), 200


@product_bp.route('/<int:lot_number>', methods=['GET'])
def get_product_details(lot_number):
    product = Product.query.get(lot_number)
    if not product:
        return jsonify({'message': 'Product lot not found'}), 404
    return jsonify(product.to_dict()), 200
