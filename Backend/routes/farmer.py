from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db, Farmer, AuditLog
from utils.auth import roles_allowed

farmer_bp = Blueprint('farmer', __name__)

@farmer_bp.route('/register', methods=['POST'])
@roles_allowed('FARMER', 'ADMIN')
def register_crop(current_user):
    data = request.get_json() or {}
    
    farm_location = data.get('farm_location')
    farm_size = data.get('farm_size')
    farming_type = data.get('farming_type') # organic / non-organic
    crop_type = data.get('crop_type')
    expected_yield = data.get('expected_yield')
    cultivation_date_str = data.get('cultivation_date')
    tx_hash = data.get('tx_hash')
    block_number = data.get('block_number')
    
    if not farm_location or not farm_size or not farming_type or not crop_type or not expected_yield or not cultivation_date_str:
        return jsonify({'message': 'Missing required fields'}), 400
        
    try:
        cultivation_date = datetime.fromisoformat(cultivation_date_str.replace('Z', ''))
    except ValueError:
        return jsonify({'message': 'Invalid date format (ISO format expected)'}), 400
        
    try:
        expected_yield = int(expected_yield)
    except ValueError:
        return jsonify({'message': 'expected_yield must be an integer'}), 400

    new_farmer_project = Farmer(
        user_id=current_user.id,
        farm_location=farm_location,
        farm_size=farm_size,
        farming_type=farming_type,
        crop_type=crop_type,
        expected_yield=expected_yield,
        cultivation_date=cultivation_date,
        tx_hash=tx_hash,
        block_number=block_number,
        is_approved=False # Pending Quality Tester approval
    )
    
    db.session.add(new_farmer_project)
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='FARMER_CROP_REGISTERED',
        details=f"Farmer {current_user.name} registered crop {crop_type} (ID: {new_farmer_project.id})."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Crop registered successfully in the system!',
        'crop': new_farmer_project.to_dict()
    }), 201


@farmer_bp.route('/my-crops', methods=['GET'])
@roles_allowed('FARMER', 'ADMIN')
def get_my_crops(current_user):
    crops = Farmer.query.filter_by(user_id=current_user.id).all()
    return jsonify([crop.to_dict() for crop in crops]), 200


@farmer_bp.route('/all-crops', methods=['GET'])
def get_all_crops():
    # Anyone can view the list of crops
    crops = Farmer.query.all()
    return jsonify([crop.to_dict() for crop in crops]), 200


@farmer_bp.route('/<int:crop_id>', methods=['GET'])
def get_crop_details(crop_id):
    crop = Farmer.query.get(crop_id)
    if not crop:
        return jsonify({'message': 'Crop not found'}), 404
    return jsonify(crop.to_dict()), 200


@farmer_bp.route('/profiles', methods=['GET'])
def get_farmer_profiles():
    from models import User
    farmers = User.query.filter_by(role='FARMER').all()
    profiles = []
    for f in farmers:
        crop_count = Farmer.query.filter_by(user_id=f.id).count()
        first_crop = Farmer.query.filter_by(user_id=f.id).first()
        location = first_crop.farm_location if first_crop else "Location pending"
        farming_type = first_crop.farming_type if first_crop else "Organic"
        
        profiles.append({
            'id': f.id,
            'name': f.name,
            'email': f.email,
            'wallet_address': f.wallet_address,
            'crop_count': crop_count,
            'location': location,
            'farming_type': farming_type,
            'is_approved': f.is_approved
        })
    return jsonify(profiles), 200


@farmer_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_farmer_profile_details(user_id):
    from models import User
    farmer_user = User.query.get(user_id)
    if not farmer_user or farmer_user.role != 'FARMER':
        return jsonify({'message': 'Farmer profile not found'}), 404
        
    crops = Farmer.query.filter_by(user_id=user_id).all()
    crop_list = [c.to_dict() for c in crops]
    
    location = crops[0].farm_location if crops else "Location pending"
    farming_type = crops[0].farming_type if crops else "Organic"
    
    return jsonify({
        'profile': {
            'id': farmer_user.id,
            'name': farmer_user.name,
            'email': farmer_user.email,
            'wallet_address': farmer_user.wallet_address,
            'is_approved': farmer_user.is_approved,
            'location': location,
            'farming_type': farming_type,
            'crop_count': len(crops)
        },
        'crops': crop_list
    }), 200


@farmer_bp.route('/crop-updates/<int:crop_id>', methods=['GET'])
def get_crop_updates(crop_id):
    from models import CropUpdate
    updates = CropUpdate.query.filter_by(farmer_id=crop_id).order_by(CropUpdate.day_count.asc()).all()
    return jsonify([u.to_dict() for u in updates]), 200

