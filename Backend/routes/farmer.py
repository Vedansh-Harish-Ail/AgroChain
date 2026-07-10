from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from models import db, Farmer, AuditLog, User
from utils.auth import roles_allowed

farmer_bp = Blueprint('farmer', __name__)

NEIGHBOR_DISTRICTS = {
    "Thiruvananthapuram": ["Kollam", "Pathanamthitta"],
    "Kollam": ["Thiruvananthapuram", "Pathanamthitta", "Alappuzha"],
    "Pathanamthitta": ["Kollam", "Alappuzha", "Kottayam", "Idukki"],
    "Alappuzha": ["Kottayam", "Kollam", "Pathanamthitta", "Ernakulam"],
    "Kottayam": ["Alappuzha", "Idukki", "Pathanamthitta", "Ernakulam"],
    "Idukki": ["Kottayam", "Ernakulam", "Pathanamthitta", "Thrissur"],
    "Ernakulam": ["Kottayam", "Alappuzha", "Idukki", "Thrissur"],
    "Thrissur": ["Ernakulam", "Palakkad", "Malappuram", "Idukki"],
    "Palakkad": ["Thrissur", "Malappuram"],
    "Malappuram": ["Kozhikode", "Palakkad", "Thrissur", "Wayanad"],
    "Kozhikode": ["Malappuram", "Wayanad", "Kannur"],
    "Wayanad": ["Kozhikode", "Kannur", "Malappuram"],
    "Kannur": ["Kasaragod", "Kozhikode", "Wayanad"],
    "Kasaragod": ["Kannur"]
}


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
        
    # Prevent future cultivation start dates
    if cultivation_date.date() > datetime.utcnow().date():
        return jsonify({'message': 'Cultivation Start Date cannot be in the future'}), 400
        
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
    
    # Priority 1: SUB_DISTRICT-level Inspector in the SAME Sub-District
    if sub_district:
        inspector = User.query.filter_by(
            role='INSPECTOR',
            sub_district=sub_district,
            coverage_level='SUB_DISTRICT',
            status='ACTIVE'
        ).first()

    # Priority 2: DISTRICT-level Inspector in the SAME District
    if not inspector and district:
        inspector = User.query.filter_by(
            role='INSPECTOR',
            district=district,
            coverage_level='DISTRICT',
            status='ACTIVE'
        ).first()

    # Priority 3: Any Inspector in the SAME District (regardless of coverage_level)
    if not inspector and district:
        inspector = User.query.filter_by(
            role='INSPECTOR',
            district=district,
            status='ACTIVE'
        ).first()

    # Priority 4: Inspector in nearby districts
    if not inspector and district and district in NEIGHBOR_DISTRICTS:
        for neighbor in NEIGHBOR_DISTRICTS[district]:
            inspector = User.query.filter_by(
                role='INSPECTOR',
                district=neighbor,
                status='ACTIVE'
            ).first()
            if inspector:
                break

    # Fallback: Any ACTIVE inspector in the system (no district match possible)
    if not inspector:
        inspector = User.query.filter_by(
            role='INSPECTOR',
            status='ACTIVE'
        ).first()

    # Tester location-based matching hierarchy
    tester = None
    # Priority 1: Tester in same Sub-District
    if sub_district:
        tester = User.query.filter_by(
            role='TESTER',
            status='ACTIVE',
            sub_district=sub_district,
            district=district
        ).first()
    
    # Priority 2: Tester in same District
    if not tester and district:
        tester = User.query.filter_by(
            role='TESTER',
            status='ACTIVE',
            district=district
        ).first()

    # Priority 3: Tester in nearby districts
    if not tester and district and district in NEIGHBOR_DISTRICTS:
        for neighbor in NEIGHBOR_DISTRICTS[district]:
            tester = User.query.filter_by(
                role='TESTER',
                status='ACTIVE',
                district=neighbor
            ).first()
            if tester:
                break

    # Fallback: Any active tester
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


@farmer_bp.route('/notify-delay/<int:crop_id>', methods=['POST'])
@roles_allowed('FARMER', 'ADMIN')
def notify_delay(current_user, crop_id):
    from datetime import datetime, timezone
    from utils.email import send_email, get_html_template
    
    crop = Farmer.query.get(crop_id)
    if not crop:
        return jsonify({'message': 'Crop not found'}), 404
        
    if crop.user_id != current_user.id and current_user.role != 'ADMIN':
        return jsonify({'message': 'Unauthorized'}), 403
        
    # Check what action is pending
    if crop.verification_status == 'PENDING':
        # Pending Inspector action
        inspector = crop.assigned_inspector
        if not inspector:
            return jsonify({'message': 'No inspector assigned to this crop yet.'}), 400
            
        # Send nudge email to inspector
        subject = f"Delay Nudge: Crop ID {crop.id} Inspection Pending - AgroChain"
        text_body = f"Hello {inspector.name},\n\nFarmer {current_user.name} has sent a nudge regarding crop ID {crop.id} ({crop.crop_type}) which has been pending inspection for more than 14 days. Please review and take action."
        html_body = get_html_template(
            title="Inspection Pending Delay Alert",
            body_text=f"<p>Hello <strong>{inspector.name}</strong>,</p><p>Farmer <strong>{current_user.name}</strong> has sent you a nudge regarding <strong>Crop ID {crop.id} ({crop.crop_type})</strong>.</p><p>This crop was registered on {crop.created_at.strftime('%Y-%m-%d')} and has been pending inspection for more than 14 days. Please complete the inspection or update the notes.</p>",
            cta_text="View Pending Inspections",
            cta_url=f"{current_app.config['FRONTEND_URL']}/dashboard"
        )
        try:
            send_email(subject, inspector.email, text_body, html_body)
        except Exception as e:
            print(f"Error sending nudge email to inspector: {e}")
            
        # Add audit log
        audit = AuditLog(
            user_id=current_user.id,
            action='FARMER_NUDGED_INSPECTOR',
            details=f"Farmer {current_user.name} sent a delay nudge to Inspector {inspector.name} for crop ID {crop.id}."
        )
        db.session.add(audit)
        db.session.commit()
        
        return jsonify({'message': f'Nudge sent to Inspector {inspector.name} successfully!'}), 200
        
    elif crop.verification_status == 'VERIFIED' and crop.timeline_status == 'TESTER_APPROVED':
        # Pending Tester action
        tester = crop.assigned_tester
        if not tester:
            return jsonify({'message': 'No quality tester assigned to this crop yet.'}), 400
            
        # Send nudge email to tester
        subject = f"Delay Nudge: Crop ID {crop.id} Quality Testing Pending - AgroChain"
        text_body = f"Hello {tester.name},\n\nFarmer {current_user.name} has sent a nudge regarding crop ID {crop.id} ({crop.crop_type}) which has been pending quality certification for more than 14 days. Please review and take action."
        html_body = get_html_template(
            title="Quality Testing Pending Delay Alert",
            body_text=f"<p>Hello <strong>{tester.name}</strong>,</p><p>Farmer <strong>{current_user.name}</strong> has sent you a nudge regarding <strong>Crop ID {crop.id} ({crop.crop_type})</strong>.</p><p>This crop was approved by the inspector on {crop.verification_date.strftime('%Y-%m-%d') if crop.verification_date else 'N/A'} and has been pending certification for more than 14 days. Please complete the quality test registration.</p>",
            cta_text="View Ready Crops",
            cta_url=f"{current_app.config['FRONTEND_URL']}/dashboard"
        )
        try:
            send_email(subject, tester.email, text_body, html_body)
        except Exception as e:
            print(f"Error sending nudge email to tester: {e}")
            
        # Add audit log
        audit = AuditLog(
            user_id=current_user.id,
            action='FARMER_NUDGED_TESTER',
            details=f"Farmer {current_user.name} sent a delay nudge to Quality Tester {tester.name} for crop ID {crop.id}."
        )
        db.session.add(audit)
        db.session.commit()
        
        return jsonify({'message': f'Nudge sent to Quality Tester {tester.name} successfully!'}), 200
        
    else:
        return jsonify({'message': 'Crop is not in a pending action state.'}), 400

