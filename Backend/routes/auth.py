from flask import Blueprint, request, jsonify
from models import db, User, AuditLog
from utils.auth import generate_token, token_required

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    wallet_address = data.get('wallet_address')
    
    if not name or not email or not password or not role:
        return jsonify({'message': 'Missing required fields'}), 400
        
    if role not in ['FARMER', 'TESTER', 'CONSUMER', 'ADMIN']:
        return jsonify({'message': 'Invalid role specified'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email address already registered'}), 400
        
    if wallet_address and User.query.filter_by(wallet_address=wallet_address).first():
        return jsonify({'message': 'Wallet address already linked to another account'}), 400
        
    # Create new user
    new_user = User(
        name=name,
        email=email,
        role=role,
        wallet_address=wallet_address.lower() if wallet_address else None,
        # Admin is auto-approved, others approved by default or admin
        is_approved=(role in ['CONSUMER', 'ADMIN'])
    )
    new_user.set_password(password)
    
    db.session.add(new_user)
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=new_user.id,
        action='USER_REGISTERED',
        details=f"User {name} registered with role {role}."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'User registered successfully!',
        'user': new_user.to_dict()
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Missing email or password'}), 400
        
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid credentials'}), 401
        
    token = generate_token(user.id, user.role)
    
    # Audit log
    audit = AuditLog(
        user_id=user.id,
        action='USER_LOGIN',
        details=f"User {user.name} logged in."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify(current_user.to_dict()), 200


@auth_bp.route('/link-wallet', methods=['POST'])
@token_required
def link_wallet(current_user):
    data = request.get_json() or {}
    wallet_address = data.get('wallet_address')
    
    if not wallet_address:
        return jsonify({'message': 'Missing wallet address'}), 400
        
    wallet_address = wallet_address.lower()
    
    # Check if address already taken
    existing_user = User.query.filter_by(wallet_address=wallet_address).first()
    if existing_user and existing_user.id != current_user.id:
        return jsonify({'message': 'Wallet address already linked to another account'}), 400
        
    current_user.wallet_address = wallet_address
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='WALLET_LINKED',
        details=f"Wallet {wallet_address} linked to user."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Wallet address linked successfully',
        'user': current_user.to_dict()
    }), 200
