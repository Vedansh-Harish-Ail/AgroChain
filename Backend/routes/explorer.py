from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
from models import db, Transaction, User, Farmer, Investment, Rating

explorer_bp = Blueprint('explorer', __name__)

@explorer_bp.route('/log-tx', methods=['POST'])
def log_transaction():
    data = request.get_json() or {}
    
    tx_hash = data.get('tx_hash')
    block_number = data.get('block_number')
    from_address = data.get('from_address')
    to_address = data.get('to_address')
    amount = data.get('amount', 0)
    method_name = data.get('method_name')
    event_data = data.get('event_data', '')
    
    if not tx_hash or not block_number or not from_address:
        return jsonify({'message': 'Missing required transaction fields'}), 400
        
    try:
        block_number = int(block_number)
        amount = int(amount)
    except ValueError:
        return jsonify({'message': 'Invalid numeric parameters'}), 400
        
    # Check if transaction is already logged
    existing_tx = Transaction.query.filter_by(tx_hash=tx_hash).first()
    if existing_tx:
        return jsonify({'message': 'Transaction already logged', 'tx': existing_tx.to_dict()}), 200

    new_tx = Transaction(
        tx_hash=tx_hash.lower(),
        block_number=block_number,
        from_address=from_address.lower(),
        to_address=to_address.lower() if to_address else None,
        amount=amount,
        method_name=method_name,
        event_data=event_data,
        timestamp=datetime.now(timezone.utc)
    )
    
    db.session.add(new_tx)
    db.session.commit()
    
    return jsonify({
        'message': 'Transaction logged successfully in explorer index!',
        'tx': new_tx.to_dict()
    }), 201


@explorer_bp.route('/transactions', methods=['GET'])
def get_transactions():
    limit = request.args.get('limit', 20, type=int)
    txs = Transaction.query.order_by(Transaction.timestamp.desc()).limit(limit).all()
    return jsonify([tx.to_dict() for tx in txs]), 200


@explorer_bp.route('/tx/<string:tx_hash>', methods=['GET'])
def get_tx_details(tx_hash):
    tx = Transaction.query.filter_by(tx_hash=tx_hash.lower()).first()
    if not tx:
        return jsonify({'message': 'Transaction not found in index'}), 404
    return jsonify(tx.to_dict()), 200


@explorer_bp.route('/summary', methods=['GET'])
def get_explorer_summary():
    total_txs = Transaction.query.count()
    
    # Get highest block number
    latest_block = db.session.query(db.func.max(Transaction.block_number)).scalar() or 0
    
    # Get unique wallets
    from_wallets = db.session.query(Transaction.from_address).distinct().all()
    to_wallets = db.session.query(Transaction.to_address).filter(Transaction.to_address.isnot(None)).distinct().all()
    
    unique_wallets = len(set([w[0].lower() for w in from_wallets] + [w[0].lower() for w in to_wallets]))
    
    # Get latest 5 transactions
    recent_txs = Transaction.query.order_by(Transaction.timestamp.desc()).limit(5).all()
    
    return jsonify({
        'total_transactions': total_txs,
        'latest_block': latest_block,
        'unique_wallets_active': unique_wallets,
        'recent_transactions': [tx.to_dict() for tx in recent_txs]
    }), 200


@explorer_bp.route('/public-stats', methods=['GET'])
def get_public_stats():
    # 1. Harvests Funded: Sum of accepted investments + baseline of 4,200,000 Rs
    accepted_investments_sum = db.session.query(db.func.sum(Investment.amount)).filter(Investment.status == 'ACCEPTED').scalar() or 0
    total_funding_rs = 4200000 + accepted_investments_sum
    
    # 2. Crops Traced: Sum of expected_yield of all crops in kg, converted to tons + baseline of 1200 Tons
    total_yield_kg = db.session.query(db.func.sum(Farmer.expected_yield)).scalar() or 0
    total_crops_traced_tons = 1200.0 + (total_yield_kg / 1000.0)
    
    # 3. Partner Laboratories: Count of users with role='TESTER' + baseline of 17
    tester_count = User.query.filter_by(role='TESTER').count()
    partner_labs = 17 + tester_count
    
    # 4. Batch Trust Rating: Calculate average rating from ratings + baseline of 99.8%
    avg_scores = db.session.query(
        db.func.avg(Rating.reliability),
        db.func.avg(Rating.product_quality),
        db.func.avg(Rating.delivery_satisfaction)
    ).first()
    
    if avg_scores and any(score is not None for score in avg_scores):
        valid_scores = [score for score in avg_scores if score is not None]
        avg_out_of_5 = sum(valid_scores) / len(valid_scores)
        db_rating_pct = (avg_out_of_5 / 5.0) * 100
        batch_trust_rating = round(db_rating_pct, 1)
    else:
        batch_trust_rating = 99.8

    return jsonify({
        'harvests_funded': int(total_funding_rs),
        'crops_traced_tons': float(round(total_crops_traced_tons, 1)),
        'partner_laboratories': int(partner_labs),
        'batch_trust_rating': float(batch_trust_rating)
    }), 200


@explorer_bp.route('/server-ip', methods=['GET'])
def get_server_ip():
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Doesn't need to be reachable, just triggers OS local IP lookup
        s.connect(('8.8.8.8', 1))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return jsonify({'ip': ip}), 200

