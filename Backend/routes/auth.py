from flask import Blueprint, request, jsonify, current_app
from models import db, User, AuditLog, OTPVerification
from utils.auth import generate_token, token_required
import random
import json
import base64
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone
from eth_account import Account
from eth_account.messages import encode_defunct

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json() or {}
    raw_phone = data.get('phone_number', '')

    if not raw_phone:
        return jsonify({'message': 'Phone number is required'}), 400

    # --- Normalise phone number ---
    # Strip everything except digits and leading +
    digits_only = "".join(c for c in raw_phone.strip() if c.isdigit())
    # If user typed +919895154388 or 919895154388, keep last 10 digits
    if len(digits_only) == 12 and digits_only.startswith('91'):
        digits_only = digits_only[2:]
    if len(digits_only) != 10 or not digits_only.isdigit():
        return jsonify({'message': f'Invalid phone number. Please enter a valid 10-digit Indian mobile number.'}), 400

    phone_number = digits_only   # store clean 10-digit number in DB

    # Check if user already exists with this phone number
    if User.query.filter_by(phone_number=phone_number).first():
        return jsonify({'message': 'Phone number already registered'}), 400

    # Generate 6-digit OTP code
    otp_code = f"{random.randint(100000, 999999)}"

    # Save OTP to database (Upsert)
    existing_otp = OTPVerification.query.filter_by(phone_number=phone_number).first()
    if existing_otp:
        db.session.delete(existing_otp)
        db.session.commit()

    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=5)
    new_otp = OTPVerification(phone_number=phone_number, otp_code=otp_code, expires_at=expires_at)
    db.session.add(new_otp)
    db.session.commit()

    sms_enabled = current_app.config.get('SMS_ENABLED', False)
    sms_url     = current_app.config.get('SMS_GATEWAY_URL')
    sms_user    = current_app.config.get('SMS_GATEWAY_USER')
    sms_pass    = current_app.config.get('SMS_GATEWAY_PASSWORD')

    sms_sent  = False
    error_msg = None

    if sms_enabled and sms_url:
        try:
            # SMS Gate Android app confirmed-working format: phone number wrapped in {} e.g. {9895154388}
            gateway_phone = f"{{{phone_number}}}"

            payload = {
                "textMessage": {
                    "text": f"Your AgroChain OTP is: {otp_code}. Valid for 5 minutes. Do not share."
                },
                "phoneNumbers": [gateway_phone]
            }
            data_bytes = json.dumps(payload).encode('utf-8')

            # Log request
            print(f"\n=== [SMS GATEWAY REQUEST] ===")
            print(f"URL:     {sms_url}")
            print(f"To:      {gateway_phone}")
            print(f"OTP:     {otp_code}")
            print(f"Payload: {json.dumps(payload)}")
            print(f"=============================\n")

            req = urllib.request.Request(sms_url, data=data_bytes, method='POST')
            req.add_header('Content-Type', 'application/json')
            if sms_user and sms_pass:
                auth_str     = f"{sms_user}:{sms_pass}"
                auth_encoded = base64.b64encode(auth_str.encode('utf-8')).decode('utf-8')
                req.add_header('Authorization', f'Basic {auth_encoded}')

            with urllib.request.urlopen(req, timeout=8) as response:
                resp_status = response.status
                resp_body   = response.read().decode('utf-8')

            if resp_status in (200, 202):
                sms_sent = True
                print(f"=== [SMS GATEWAY SUCCESS] ===")
                print(f"Status: {resp_status}  Body: {resp_body}")
                print(f"=============================\n")
            else:
                error_msg = f"Gateway returned HTTP {resp_status}: {resp_body}"
                print(f"!!! [SMS GATEWAY FAILURE] status={resp_status} body={resp_body}")

        except Exception as e:
            error_msg = str(e)
            print(f"!!! [SMS EXCEPTION] {error_msg}")
    else:
        error_msg = "SMS Gateway is disabled or not configured in .env"

    if sms_sent:
        return jsonify({
            'message': 'OTP sent successfully via SMS.',
            'phone_number': phone_number
        }), 200
    else:
        # Developer fallback — OTP still works, printed to terminal
        print(f"\n--- [SMS DEV FALLBACK] OTP for {phone_number} = {otp_code}  Error: {error_msg} ---\n")
        return jsonify({
            'message': 'OTP generated (Developer Mode Fallback).',
            'phone_number': phone_number,
            'warning': f'SMS delivery failed. Reason: {error_msg}'
        }), 200


@auth_bp.route('/send-email-otp', methods=['POST'])
def send_email_otp():
    data = request.get_json() or {}
    email = data.get('email')
    
    if not email:
        return jsonify({'message': 'Email address is required'}), 400
        
    email = email.strip().lower()
    
    # Check if user already exists with this email
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email address already registered'}), 400
        
    # Generate 6-digit OTP code
    otp_code = f"{random.randint(100000, 999999)}"
    
    # Save OTP to database (Upsert: delete existing for this email first)
    existing_otp = OTPVerification.query.filter_by(email=email).first()
    if existing_otp:
        db.session.delete(existing_otp)
        db.session.commit()
        
    # sqlite timezone safety
    expires_at = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=5)
    new_otp = OTPVerification(
        email=email,
        otp_code=otp_code,
        expires_at=expires_at
    )
    db.session.add(new_otp)
    db.session.commit()
    
    # Send email using our async utility
    from utils.email import send_email, get_html_template
    
    subject = "AgroChain Account Verification Code"
    text_body = f"Your AgroChain verification code is: {otp_code}. Valid for 5 minutes."
    html_body = get_html_template(
        title="Verify Your Account",
        body_text=f"<p>Thank you for signing up with AgroChain. Please use the following code to complete your registration:</p><div style='font-size: 28px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0; color: #059669;'>{otp_code}</div><p>This code is valid for 5 minutes. If you did not request this code, please ignore this email.</p>"
    )
    
    try:
        send_email(subject, email, text_body, html_body)
    except Exception as e:
        print(f"\n--- [EMAIL DEV FALLBACK] ---")
        print(f"To: {email}")
        print(f"OTP Code: {otp_code}")
        print(f"SMTP Error: {str(e)}")
        print(f"--------------------------\n")
        
    return jsonify({
        'message': 'Verification code sent to your email.',
        'email': email
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
    email_otp = data.get('email_otp')
    sms_otp = data.get('sms_otp')
    
    # Optional location fields
    district = data.get('district')
    pin_code = data.get('pin_code')
    coverage_pins = data.get('coverage_pins')
    sub_district = data.get('sub_district')
    
    # Quality Lab specific fields
    lab_name = data.get('lab_name')
    authorized_person = data.get('authorized_person')
    lab_license_number = data.get('lab_license_number')
    accreditation_number = data.get('accreditation_number')
    gov_reg_number = data.get('gov_reg_number')
    lab_certificates = data.get('lab_certificates')
    supporting_documents = data.get('supporting_documents')
    
    if not name or not email or not password or not role or not phone_number or not email_otp or not sms_otp:
        return jsonify({'message': 'Missing required fields, including email OTP and SMS OTP'}), 400
        
    email = email.strip().lower()
    # Sanitize phone number (remove spaces, hyphens, parentheses, preserve curly braces/plus signs)
    phone_number = "".join(c for c in phone_number.strip() if c.isdigit() or c in '+{}')
        
    if role not in ['FARMER', 'TESTER', 'CONSUMER', 'INVESTOR', 'ADMIN']:
        return jsonify({'message': 'Invalid role specified'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email address already registered'}), 400
        
    if User.query.filter_by(phone_number=phone_number).first():
        return jsonify({'message': 'Phone number already registered'}), 400
        
    if wallet_address and User.query.filter_by(wallet_address=wallet_address).first():
        return jsonify({'message': 'Wallet address already linked to another account'}), 400
        
    # Verify Email OTP
    email_verification = OTPVerification.query.filter_by(email=email).first()
    if not email_verification or email_verification.otp_code != str(email_otp):
        return jsonify({'message': 'Invalid Email OTP code'}), 400
        
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if now > email_verification.expires_at:
        return jsonify({'message': 'Email OTP has expired. Please request a new one.'}), 400
        
    # Verify SMS OTP (Allow mock bypass 123456 as SMS is integrated later)
    sms_verification = OTPVerification.query.filter_by(phone_number=phone_number).first()
    if str(sms_otp) != "123456":
        if not sms_verification or sms_verification.otp_code != str(sms_otp):
            return jsonify({'message': 'Invalid SMS OTP code'}), 400
        if now > sms_verification.expires_at:
            return jsonify({'message': 'SMS OTP has expired. Please request a new one.'}), 400
            
    # Clean up OTP records on success
    db.session.delete(email_verification)
    if sms_verification:
        db.session.delete(sms_verification)
    db.session.commit()
    
    # Create new user
    
    # Handle list to JSON string conversion for documents if needed
    lab_certs_str = json.dumps(lab_certificates) if isinstance(lab_certificates, list) else lab_certificates
    supp_docs_str = json.dumps(supporting_documents) if isinstance(supporting_documents, list) else supporting_documents

    new_user = User(
        name=name,
        email=email,
        phone_number=phone_number,
        role=role,
        wallet_address=wallet_address.lower() if wallet_address else None,
        district=district,
        pin_code=pin_code,
        coverage_pins=coverage_pins,
        sub_district=sub_district,
        # Admin and Farmers are auto-approved, others approved by default or admin
        is_approved=(role in ['CONSUMER', 'INVESTOR', 'ADMIN', 'FARMER']),
        # Lab-specific fields
        lab_name=lab_name if role == 'TESTER' else None,
        authorized_person=authorized_person if role == 'TESTER' else None,
        lab_license_number=lab_license_number if role == 'TESTER' else None,
        accreditation_number=accreditation_number if role == 'TESTER' else None,
        gov_reg_number=gov_reg_number if role == 'TESTER' else None,
        lab_certificates=lab_certs_str if role == 'TESTER' else None,
        supporting_documents=supp_docs_str if role == 'TESTER' else None,
        status='PENDING_APPROVAL' if role == 'TESTER' else 'ACTIVE'
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
        
    email = email.strip().lower()
    password = password.strip()
    
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


@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    data = request.get_json() or {}
    new_password = data.get('new_password')
    
    if not new_password:
        return jsonify({'message': 'New password is required'}), 400
        
    current_user.set_password(new_password)
    current_user.must_change_password = False
    db.session.commit()
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='USER_PASSWORD_CHANGED',
        details=f"User {current_user.name} changed their password."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Password changed successfully!',
        'user': current_user.to_dict()
    }), 200


@auth_bp.route('/link-wallet', methods=['POST'])
@token_required
def link_wallet(current_user):
    data = request.get_json() or {}
    wallet_address = data.get('wallet_address')
    message = data.get('message')
    signature = data.get('signature')
    
    if not wallet_address:
        return jsonify({'message': 'Missing wallet address'}), 400
        
    wallet_address = wallet_address.lower()
    
    # Check if address already taken
    existing_user = User.query.filter_by(wallet_address=wallet_address).first()
    if existing_user and existing_user.id != current_user.id:
        return jsonify({'message': 'Wallet address already linked to another account'}), 400
        
    # Enforce MetaMask signature ownership verification
    if current_user.role in ['INSPECTOR', 'TESTER']:
        if not message or not signature:
            return jsonify({'message': f'Message and signature are required for {current_user.role.lower().replace("_", " ")} wallet verification'}), 400
            
    if message and signature:
        try:
            encoded_message = encode_defunct(text=message)
            recovered_address = Account.recover_message(encoded_message, signature=signature).lower()
            if recovered_address != wallet_address:
                return jsonify({'message': 'Signature verification failed. Recovered address does not match provided address.'}), 400
        except Exception as e:
            return jsonify({'message': f'Signature verification error: {str(e)}'}), 400
            
    current_user.wallet_address = wallet_address
    if current_user.role in ['INSPECTOR', 'TESTER']:
        current_user.status = 'ACTIVE'
        
    db.session.commit()
    
    # Auto-grant blockchain role for INSPECTOR and TESTER
    if current_user.role in ['INSPECTOR', 'TESTER']:
        import subprocess
        import os
        import threading

        def run_onchain_grant(addr, role):
            try:
                env = os.environ.copy()
                env['WALLET_ADDRESS'] = addr
                env['ROLE_TYPE'] = role
                
                # Hardhat path setup
                blockchain_dir = r"c:\MY PROJECTS\AgroChain-Morden\Blockchain"
                cmd = ["npx", "hardhat", "run", "scripts/grant-role.js", "--network", "localhost"]
                
                print(f"\n[AUTO-GRANT] Launching background thread to grant {role} to {addr}...")
                # Run the command
                res = subprocess.run(cmd, cwd=blockchain_dir, env=env, capture_output=True, text=True, shell=True)
                
                if res.returncode == 0:
                    print(f"[AUTO-GRANT SUCCESS] Granted {role} to {addr} on-chain.\nLogs:\n{res.stdout}")
                else:
                    print(f"[AUTO-GRANT FAILED] returncode={res.returncode}\nStdout: {res.stdout}\nStderr: {res.stderr}")
            except Exception as ex:
                print(f"[AUTO-GRANT EXCEPTION] Failed to grant role: {str(ex)}")

        # Run in background so we don't block the API response
        threading.Thread(
            target=run_onchain_grant, 
            args=(wallet_address, current_user.role),
            daemon=True
        ).start()
        
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='WALLET_LINKED',
        details=f"Wallet {wallet_address} linked to user (Role: {current_user.role})."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': 'Wallet address linked successfully',
        'user': current_user.to_dict()
    }), 200

@auth_bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    
    import os
    from werkzeug.utils import secure_filename
    import uuid
    
    filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}_{filename}"
    
    # Store uploads in a folder under the project base directory
    upload_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)
        
    file.save(os.path.join(upload_folder, unique_filename))
    
    return jsonify({
        'success': True,
        'url': f"/api/auth/uploads/{unique_filename}"
    }), 200

@auth_bp.route('/uploads/<filename>', methods=['GET'])
def get_upload(filename):
    import os
    from flask import send_from_directory
    upload_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
    return send_from_directory(upload_folder, filename)
