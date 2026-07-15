from flask import Blueprint, request, jsonify
from models import db, Rating, Farmer, Product, AuditLog
from utils.auth import roles_allowed

rating_bp = Blueprint('rating', __name__)

@rating_bp.route('/add', methods=['POST'])
@roles_allowed('CONSUMER', 'INVESTOR', 'ADMIN')
def add_rating(current_user):
    data = request.get_json() or {}
    
    farmer_id = data.get('farmer_id')
    lot_number = data.get('lot_number')
    reliability = data.get('reliability')
    product_quality = data.get('product_quality')
    delivery_satisfaction = data.get('delivery_satisfaction')
    comment = data.get('comment', '')
    tx_hash = data.get('tx_hash')
    block_number = data.get('block_number')
    
    if not farmer_id or not lot_number or reliability is None or product_quality is None or delivery_satisfaction is None:
        return jsonify({'message': 'Missing required rating metrics'}), 400
        
    try:
        reliability = int(reliability)
        product_quality = int(product_quality)
        delivery_satisfaction = int(delivery_satisfaction)
        farmer_id = int(farmer_id)
        lot_number = int(lot_number)
    except ValueError:
        return jsonify({'message': 'Ratings must be integers'}), 400
        
    if not (1 <= reliability <= 5 and 1 <= product_quality <= 5 and 1 <= delivery_satisfaction <= 5):
        return jsonify({'message': 'Ratings must be between 1 and 5'}), 400
        
    # Check if Farmer and Lot exist
    farmer = Farmer.query.get(farmer_id)
    if not farmer:
        return jsonify({'message': 'Farmer project not found'}), 404
    product = Product.query.get(lot_number)
    if not product:
        return jsonify({'message': 'Product lot not found'}), 404

    blockchain_status = 'VERIFIED' if tx_hash else 'DB_ONLY'

    # Create Rating
    new_rating = Rating(
        consumer_id=current_user.id,
        farmer_id=farmer_id,
        lot_number=lot_number,
        reliability=reliability,
        product_quality=product_quality,
        delivery_satisfaction=delivery_satisfaction,
        comment=comment,
        tx_hash=tx_hash,
        block_number=block_number,
        blockchain_status=blockchain_status
    )
    
    db.session.add(new_rating)
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='RATING_SUBMITTED',
        details=f"Consumer {current_user.name} rated Farmer {farmer_id} Lot {lot_number}."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Rating and review submitted successfully!',
        'rating': new_rating.to_dict()
    }), 201


@rating_bp.route('/farmer/<int:farmer_id>', methods=['GET'])
def get_farmer_credibility(farmer_id):
    ratings = Rating.query.filter_by(farmer_id=farmer_id).all()
    count = len(ratings)
    
    if count == 0:
        return jsonify({
            'farmer_id': farmer_id,
            'average_rating': 0,
            'reliability_avg': 0,
            'quality_avg': 0,
            'delivery_avg': 0,
            'rating_count': 0,
            'trust_badge': 'Standard',
            'badge_color': 'gray'
        }), 200
        
    reliability_sum = sum([r.reliability for r in ratings])
    quality_sum = sum([r.product_quality for r in ratings])
    delivery_sum = sum([r.delivery_satisfaction for r in ratings])
    
    reliability_avg = round(reliability_sum / count, 1)
    quality_avg = round(quality_sum / count, 1)
    delivery_avg = round(delivery_sum / count, 1)
    
    overall_avg = round((reliability_avg + quality_avg + delivery_avg) / 3, 1)
    
    # Trust Badge mapping
    if overall_avg >= 4.5:
        trust_badge = 'Gold Premium Certified'
        badge_color = 'emerald'
    elif overall_avg >= 4.0:
        trust_badge = 'Silver High Credibility'
        badge_color = 'indigo'
    elif overall_avg >= 3.0:
        trust_badge = 'Bronze Verified'
        badge_color = 'amber'
    else:
        trust_badge = 'Standard'
        badge_color = 'slate'
        
    return jsonify({
        'farmer_id': farmer_id,
        'average_rating': overall_avg,
        'reliability_avg': reliability_avg,
        'quality_avg': quality_avg,
        'delivery_avg': delivery_avg,
        'rating_count': count,
        'trust_badge': trust_badge,
        'badge_color': badge_color
    }), 200


@rating_bp.route('/farmer/<int:farmer_id>/reviews', methods=['GET'])
def get_farmer_reviews(farmer_id):
    ratings = Rating.query.filter_by(farmer_id=farmer_id).order_by(Rating.timestamp.desc()).all()
    return jsonify([r.to_dict() for r in ratings]), 200
