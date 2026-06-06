from flask import Blueprint, request, jsonify
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
    certification_status = data.get('certification_status') # APPROVED / REJECTED
    tx_hash = data.get('tx_hash')
    block_number = data.get('block_number')
    
    if not lot_number or not farmer_id or not crop_name or not quality_grade or not price or not test_date_str or not expiry_date_str or not certification_status:
        return jsonify({'message': 'Missing required fields'}), 400
        
    # Check if lot already exists
    if Product.query.get(lot_number):
        return jsonify({'message': f'Product batch with Lot Number {lot_number} already registered'}), 400
        
    # Check if farmer crop project is approved
    farmer_project = Farmer.query.get(farmer_id)
    if not farmer_project:
        return jsonify({'message': 'Farmer crop project not found'}), 404
    if not farmer_project.is_approved:
        return jsonify({'message': 'Farmer cultivation must be approved by tester first'}), 400
        
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

    db.session.add(new_product)
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='PRODUCT_LOT_CREATED',
        details=f"Quality Authority {current_user.name} certified product Lot {lot_number} for farmer ID {farmer_id}."
    )
    db.session.add(audit)
    db.session.commit()
    
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
