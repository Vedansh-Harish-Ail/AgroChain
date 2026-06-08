from flask import Blueprint, request, jsonify
from models import db, Investment, Product, Farmer, AuditLog
from utils.auth import token_required, roles_allowed

finance_bp = Blueprint('finance', __name__)

@finance_bp.route('/invest', methods=['POST'])
@roles_allowed('INVESTOR')
def make_investment(current_user):
    data = request.get_json() or {}
    
    farmer_id = data.get('farmer_id')
    lot_number = data.get('lot_number')
    amount = data.get('amount')
    profit_percentage = data.get('profit_percentage', 10)
    terms = data.get('terms', '')
    message = data.get('message', '')
    
    if not farmer_id or not lot_number or not amount:
        return jsonify({'message': 'Missing required fields'}), 400
        
    # Verify Farmer exists and is approved
    farmer = Farmer.query.get(farmer_id)
    if not farmer:
        return jsonify({'message': 'Farmer project not found'}), 404
    if not farmer.is_approved:
        return jsonify({'message': 'Farmer cultivation must be verified first'}), 400
        
    # Verify Lot exists
    product = Product.query.get(lot_number)
    if not product:
        return jsonify({'message': 'Product lot not found'}), 404
        
    try:
        amount = int(amount)
        profit_percentage = int(profit_percentage)
    except ValueError:
        return jsonify({'message': 'Amount and profit percentage must be numeric'}), 400

    new_investment = Investment(
        investor_id=current_user.id,
        farmer_id=farmer_id,
        lot_number=lot_number,
        amount=amount,
        profit_percentage=profit_percentage,
        terms=terms,
        message=message,
        status='PENDING'
    )
    
    db.session.add(new_investment)
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='PROPOSAL_SUBMITTED',
        details=f"Investor {current_user.name} submitted a funding proposal for Farmer {farmer_id} Lot {lot_number} with Rs. {amount}."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Proposal submitted successfully!',
        'investment': new_investment.to_dict()
    }), 201


@finance_bp.route('/my-investments', methods=['GET'])
@roles_allowed('INVESTOR')
def get_my_investments(current_user):
    investments = Investment.query.filter_by(investor_id=current_user.id).all()
    return jsonify([inv.to_dict() for inv in investments]), 200


@finance_bp.route('/farmer-investments/<int:farmer_id>', methods=['GET'])
def get_farmer_investments(farmer_id):
    investments = Investment.query.filter_by(farmer_id=farmer_id).all()
    return jsonify([inv.to_dict() for inv in investments]), 200


@finance_bp.route('/received-proposals', methods=['GET'])
@roles_allowed('FARMER')
def get_received_proposals(current_user):
    crops = Farmer.query.filter_by(user_id=current_user.id).all()
    if not crops:
        return jsonify([]), 200
    
    crop_ids = [crop.id for crop in crops]
    proposals = Investment.query.filter(Investment.farmer_id.in_(crop_ids)).all()
    return jsonify([prop.to_dict() for prop in proposals]), 200


@finance_bp.route('/all', methods=['GET'])
@roles_allowed('ADMIN')
def get_all_investments(current_user):
    investments = Investment.query.all()
    return jsonify([inv.to_dict() for inv in investments]), 200


@finance_bp.route('/update-status/<int:investment_id>', methods=['POST'])
@token_required
def update_investment_status(current_user, investment_id):
    investment = Investment.query.get(investment_id)
    if not investment:
        return jsonify({'message': 'Investment record not found'}), 404
        
    data = request.get_json() or {}
    status = data.get('status')
    
    if status not in ['PENDING', 'ACCEPTED', 'DECLINED']:
        return jsonify({'message': 'Invalid status'}), 400
        
    # Verify authorization (only Admin or the Farmer who received the investment can mark it accepted/declined)
    farmer_user_id = investment.farmer.user_id
    if current_user.id != farmer_user_id and current_user.role != 'ADMIN':
        return jsonify({'message': 'Unauthorized to modify this investment status'}), 403
        
    investment.status = status
    if status == 'ACCEPTED':
        investment.farmer.timeline_status = 'FUNDING_COMPLETED'
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='INVESTMENT_STATUS_UPDATED',
        details=f"Investment ID {investment_id} status changed to {status} by {current_user.name}."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': f'Investment status updated to {status}!',
        'investment': investment.to_dict()
    }), 200
