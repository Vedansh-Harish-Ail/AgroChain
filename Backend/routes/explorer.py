from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db, Transaction

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
        timestamp=datetime.utcnow()
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
