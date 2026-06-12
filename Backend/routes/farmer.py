from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db, Farmer, AuditLog, User
from utils.auth import roles_allowed

farmer_bp = Blueprint('farmer', __name__)

@farmer_bp.route('/register', methods=['POST'])
@roles_allowed('FARMER', 'ADMIN')
def register_crop(current_user):
    import json
    data = request.get_json() or {}
    
    farm_location = data.get('farm_location')
    farm_address = data.get('farm_address') or farm_location # support both
    farm_size = data.get('farm_size')
    farming_type = data.get('farming_type') # organic / non-organic
    crop_type = data.get('crop_type')
    expected_yield = data.get('expected_yield')
    cultivation_date_str = data.get('cultivation_date')
    tx_hash = data.get('tx_hash')
    block_number = data.get('block_number')
    
    # New fields
    land_survey_no = data.get('land_survey_no')
    gps_latitude = data.get('gps_latitude')
    gps_longitude = data.get('gps_longitude')
    evidence_photos_raw = data.get('evidence_photos')
    evidence_documents_raw = data.get('evidence_documents')

    district = data.get('district')
    sub_district = data.get('sub_district')
    village = data.get('village')
    pin_code = data.get('pin_code')
    
    if not farm_location or not farm_size or not farming_type or not crop_type or not expected_yield or not cultivation_date_str or not land_survey_no or not district or not sub_district or not village:
        return jsonify({'message': 'Missing required fields, including district, sub-district, and village'}), 400
        
    try:
        cultivation_date = datetime.fromisoformat(cultivation_date_str.replace('Z', ''))
    except ValueError:
        return jsonify({'message': 'Invalid date format (ISO format expected)'}), 400
        
    try:
        expected_yield = int(expected_yield)
    except ValueError:
        return jsonify({'message': 'expected_yield must be an integer'}), 400

    if gps_latitude and gps_longitude:
        try:
            gps_latitude = float(gps_latitude)
            gps_longitude = float(gps_longitude)
        except (ValueError, TypeError):
            return jsonify({'message': 'Invalid GPS coordinates format'}), 400
    else:
        gps_latitude = None
        gps_longitude = None

    # Serialize evidence photos
    evidence_photos = None
    if evidence_photos_raw:
        if isinstance(evidence_photos_raw, list):
            evidence_photos = json.dumps(evidence_photos_raw)
        else:
            evidence_photos = str(evidence_photos_raw)

    # Serialize evidence documents
    evidence_documents = None
    if evidence_documents_raw:
        if isinstance(evidence_documents_raw, list):
            evidence_documents = json.dumps(evidence_documents_raw)
        else:
            evidence_documents = str(evidence_documents_raw)

    # Determine blockchain status
    blockchain_status = 'VERIFIED' if tx_hash else 'DB_ONLY'

    # Kerala-Based Inspector Assignment Logic
    inspector = None
    
    # Priority 1: Same Sub-District ACTIVE Inspector
    if sub_district:
        inspector = User.query.filter_by(
            role='INSPECTOR',
            sub_district=sub_district,
            status='ACTIVE'
        ).first()

    # Priority 2: Same District ACTIVE Inspector
    if not inspector and district:
        inspector = User.query.filter_by(
            role='INSPECTOR',
            district=district,
            status='ACTIVE'
        ).first()

    # Priority 3: Any available ACTIVE DISTRICT-level Inspector
    if not inspector:
        inspector = User.query.filter_by(
            role='INSPECTOR',
            coverage_level='DISTRICT',
            status='ACTIVE'
        ).first()

    # Fallback to any ACTIVE inspector in the DB
    if not inspector:
        inspector = User.query.filter_by(
            role='INSPECTOR',
            status='ACTIVE'
        ).first()

    # Tester location-based matching: same district, fallback to any tester
    tester = None
    if district:
        tester = User.query.filter_by(role='TESTER', status='ACTIVE', district=district).first()
    if not tester:
        tester = User.query.filter_by(role='TESTER', status='ACTIVE').first()

    new_farmer_project = Farmer(
        user_id=current_user.id,
        farm_location=farm_location,
        farm_address=farm_address,
        district=district,
        sub_district=sub_district,
        village=village,
        pin_code=pin_code,
        farm_size=farm_size,
        farming_type=farming_type,
        crop_type=crop_type,
        expected_yield=expected_yield,
        cultivation_date=cultivation_date,
        tx_hash=tx_hash,
        block_number=block_number,
        blockchain_status=blockchain_status,
        is_approved=False, # Pending Quality Inspector approval
        land_survey_no=land_survey_no,
        gps_latitude=gps_latitude,
        gps_longitude=gps_longitude,
        evidence_photos=evidence_photos,
        evidence_documents=evidence_documents,
        verification_status='PENDING',
        assigned_inspector_id=inspector.id if inspector else None,
        assigned_tester_id=tester.id if tester else None
    )
    
    db.session.add(new_farmer_project)
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='FARMER_CROP_REGISTERED',
        details=f"Farmer {current_user.name} registered crop {crop_type} (ID: {new_farmer_project.id}, Status: {blockchain_status}, Survey No: {land_survey_no})."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Crop registered successfully in the system!',
        'crop': new_farmer_project.to_dict()
    }), 201


@farmer_bp.route('/update-blockchain-status/<int:crop_id>', methods=['POST'])
@roles_allowed('FARMER', 'ADMIN')
def update_blockchain_status(current_user, crop_id):
    data = request.get_json() or {}
    tx_hash = data.get('tx_hash')
    block_number = data.get('block_number')
    
    if not tx_hash:
        return jsonify({'message': 'Missing transaction hash'}), 400
        
    crop = Farmer.query.get(crop_id)
    if not crop:
        return jsonify({'message': 'Crop not found'}), 404
        
    if crop.user_id != current_user.id and current_user.role != 'ADMIN':
        return jsonify({'message': 'Unauthorized'}), 403
        
    crop.tx_hash = tx_hash
    crop.block_number = block_number
    crop.blockchain_status = 'VERIFIED'
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='CROP_BLOCKCHAIN_VERIFIED',
        details=f"Crop {crop.id} verified on blockchain with hash {tx_hash}."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Blockchain status updated successfully!',
        'crop': crop.to_dict()
    }), 200


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
    from models import User, Rating
    farmers = User.query.filter_by(role='FARMER').all()
    profiles = []
    for f in farmers:
        crops = Farmer.query.filter_by(user_id=f.id).all()
        crop_count = len(crops)
        first_crop = crops[0] if crops else None
        location = first_crop.farm_location if first_crop else "Location pending"
        farming_type = first_crop.farming_type if first_crop else "Organic"
        
        # Calculate overall farmer rating across all their crops
        crop_ids = [c.id for c in crops]
        ratings = Rating.query.filter(Rating.farmer_id.in_(crop_ids)).all() if crop_ids else []
        if ratings:
            reliability_avg = sum([r.reliability for r in ratings]) / len(ratings)
            quality_avg = sum([r.product_quality for r in ratings]) / len(ratings)
            delivery_avg = sum([r.delivery_satisfaction for r in ratings]) / len(ratings)
            overall_avg = round((reliability_avg + quality_avg + delivery_avg) / 3, 1)
            rating_count = len(ratings)
        else:
            overall_avg = 0.0
            rating_count = 0
        
        profiles.append({
            'id': f.id,
            'name': f.name,
            'email': f.email,
            'wallet_address': f.wallet_address,
            'crop_count': crop_count,
            'location': location,
            'farming_type': farming_type,
            'is_approved': f.is_approved,
            'average_rating': overall_avg,
            'rating_count': rating_count
        })
    return jsonify(profiles), 200


@farmer_bp.route('/profile/<int:user_id>', methods=['GET'])
def get_farmer_profile_details(user_id):
    from models import User, Rating
    farmer_user = User.query.get(user_id)
    if not farmer_user or farmer_user.role != 'FARMER':
        return jsonify({'message': 'Farmer profile not found'}), 404
        
    crops = Farmer.query.filter_by(user_id=user_id).all()
    crop_list = [c.to_dict() for c in crops]
    
    location = crops[0].farm_location if crops else "Location pending"
    farming_type = crops[0].farming_type if crops else "Organic"
    
    # Calculate overall farmer rating across all their crops
    crop_ids = [c.id for c in crops]
    ratings = Rating.query.filter(Rating.farmer_id.in_(crop_ids)).all() if crop_ids else []
    if ratings:
        reliability_avg = sum([r.reliability for r in ratings]) / len(ratings)
        quality_avg = sum([r.product_quality for r in ratings]) / len(ratings)
        delivery_avg = sum([r.delivery_satisfaction for r in ratings]) / len(ratings)
        overall_avg = round((reliability_avg + quality_avg + delivery_avg) / 3, 1)
        rating_count = len(ratings)
    else:
        overall_avg = 0.0
        rating_count = 0
    
    return jsonify({
        'profile': {
            'id': farmer_user.id,
            'name': farmer_user.name,
            'email': farmer_user.email,
            'wallet_address': farmer_user.wallet_address,
            'is_approved': farmer_user.is_approved,
            'location': location,
            'farming_type': farming_type,
            'crop_count': len(crops),
            'average_rating': overall_avg,
            'rating_count': rating_count
        },
        'crops': crop_list
    }), 200


@farmer_bp.route('/crop-updates/<int:crop_id>', methods=['GET'])
def get_crop_updates(crop_id):
    from models import CropUpdate
    updates = CropUpdate.query.filter_by(farmer_id=crop_id).order_by(CropUpdate.day_count.asc()).all()
    return jsonify([u.to_dict() for u in updates]), 200


@farmer_bp.route('/update-timeline/<int:crop_id>', methods=['POST'])
@roles_allowed('FARMER', 'ADMIN')
def update_timeline_status(current_user, crop_id):
    data = request.get_json() or {}
    timeline_status = data.get('timeline_status')
    
    VALID_STATUSES = [
        'CROP_REGISTERED', 
        'QUALITY_TESTED', 
        'TESTER_APPROVED', 
        'FUNDING_COMPLETED', 
        'READY_TO_HARVEST',
        'HARVEST_COMPLETED', 
        'PRODUCT_AVAILABLE'
    ]
    
    if not timeline_status or timeline_status not in VALID_STATUSES:
        return jsonify({'message': 'Invalid timeline status'}), 400
        
    crop = Farmer.query.get(crop_id)
    if not crop:
        return jsonify({'message': 'Crop not found'}), 404
        
    if crop.user_id != current_user.id and current_user.role != 'ADMIN':
        return jsonify({'message': 'Unauthorized'}), 403
        
    crop.timeline_status = timeline_status
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='CROP_TIMELINE_UPDATED',
        details=f"Crop {crop.id} timeline status updated to {timeline_status} by {current_user.name}."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Timeline status updated successfully!',
        'crop': crop.to_dict()
    }), 200

