from flask import Blueprint, request, jsonify, current_app
from models import db, User, AuditLog, OTPVerification
from utils.auth import generate_token, token_required
import random
import json
import base64
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json() or {}
    phone_number = data.get('phone_number')
    
    if not phone_number:
        return jsonify({'message': 'Phone number is required'}), 400
        
    phone_number = phone_number.strip()
    
    # Check if user already exists with this phone number
    if User.query.filter_by(phone_number=phone_number).first():
        return jsonify({'message': 'Phone number already registered'}), 400
        
    # Generate 6-digit OTP code
    otp_code = f"{random.randint(100000, 999999)}"
    
    # Save OTP to database (Upsert: delete existing for this phone number first)
    existing_otp = OTPVerification.query.filter_by(phone_number=phone_number).first()
    if existing_otp:
        db.session.delete(existing_otp)
        db.session.commit()
        
    # sqlite timezone safety
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=5)
    new_otp = OTPVerification(
        phone_number=phone_number,
        otp_code=otp_code,
        expires_at=expires_at
    )
    db.session.add(new_otp)
    db.session.commit()
    
    sms_enabled = current_app.config.get('SMS_ENABLED', False)
    sms_url = current_app.config.get('SMS_GATEWAY_URL')
    sms_user = current_app.config.get('SMS_GATEWAY_USER')
    sms_pass = current_app.config.get('SMS_GATEWAY_PASSWORD')
    
    sms_sent = False
    error_msg = None
    
    if sms_enabled and sms_url:
        try:
            # Build payload matching the SMS Gate format
            payload = {
                "textMessage": {
                    "text": f"Your AgroChain registration OTP is: {otp_code}. Valid for 5 minutes."
                },
                "phoneNumbers": [phone_number]
            }
            data_bytes = json.dumps(payload).encode('utf-8')
            
            # Create request
            req = urllib.request.Request(sms_url, data=data_bytes, method='POST')
            req.add_header('Content-Type', 'application/json')
            
            # Basic Authentication
            if sms_user and sms_pass:
                auth_str = f"{sms_user}:{sms_pass}"
                auth_encoded = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
                req.add_header('Authorization', f'Basic {auth_encoded}')
                
            # Perform network request to the local device gateway
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    sms_sent = True
                else:
                    error_msg = f"Gateway returned status {response.status}"
        except urllib.error.URLError as e:
            error_msg = f"URL Error connecting to gateway: {e.reason}"
        except Exception as e:
            error_msg = f"Unexpected error sending SMS: {str(e)}"
    else:
        error_msg = "SMS Gateway is disabled or not configured."
        
    if sms_sent:
        return jsonify({
            'message': 'OTP sent successfully via SMS.',
            'phone_number': phone_number
        }), 200
    else:
        # Fallback to dev mode so local testing isn't blocked
        print(f"\n--- [SMS DEV FALLBACK] ---")
        print(f"To: {phone_number}")
        print(f"OTP Code: {otp_code}")
        print(f"Gateway Error: {error_msg}")
        print(f"--------------------------\n")
        return jsonify({
            'message': 'OTP generated (Developer Mode Fallback).',
            'phone_number': phone_number,
            'dev_otp': otp_code,
            'warning': f'SMS delivery failed/disabled. Details: {error_msg}'
        }), 200


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    wallet_address = data.get('wallet_address')
    phone_number = data.get('phone_number')
    otp_code = data.get('otp_code')
    
    if not name or not email or not password or not role or not phone_number or not otp_code:
        return jsonify({'message': 'Missing required fields, including phone number and OTP'}), 400
        
    if role not in ['FARMER', 'TESTER', 'CONSUMER', 'ADMIN']:
        return jsonify({'message': 'Invalid role specified'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email address already registered'}), 400
        
    if User.query.filter_by(phone_number=phone_number).first():
        return jsonify({'message': 'Phone number already registered'}), 400
        
    if wallet_address and User.query.filter_by(wallet_address=wallet_address).first():
        return jsonify({'message': 'Wallet address already linked to another account'}), 400
        
    # Verify OTP
    verification = OTPVerification.query.filter_by(phone_number=phone_number).first()
    if not verification or verification.otp_code != str(otp_code):
        return jsonify({'message': 'Invalid OTP code'}), 400
        
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if now > verification.expires_at:
        return jsonify({'message': 'OTP has expired. Please request a new one.'}), 400
        
    # Clean up OTP record on success
    db.session.delete(verification)
    
    # Create new user
    new_user = User(
        name=name,
        email=email,
        phone_number=phone_number,
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
        details=f"User {name} registered with role {role} and phone {phone_number}."
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
