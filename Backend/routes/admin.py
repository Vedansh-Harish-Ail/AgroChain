from flask import Blueprint, jsonify, request
from models import db, User, Farmer, Product, Investment, AuditLog
from utils.auth import roles_allowed

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/users', methods=['GET'])
@roles_allowed('ADMIN')
def get_all_users(current_user):
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users]), 200


@admin_bp.route('/approve-user/<int:user_id>', methods=['POST'])
@roles_allowed('ADMIN')
def approve_user(current_user, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    user.is_approved = True
    is_tester = (user.role == 'TESTER')
    if is_tester:
        user.status = 'ACTIVE'
    db.session.commit()
    
    # Send email notification if user is a Quality Lab
    if is_tester and user.email:
        try:
            from utils.email import send_email, get_html_template
            subject = "Quality Lab Application Approved - AgroBlock"
            text_body = (
                f"Hello {user.name},\n\n"
                f"We are pleased to inform you that your Quality Lab application for '{user.lab_name or 'Your Lab'}' has been reviewed and approved by the System Administrator.\n\n"
                f"Your account is now ACTIVE. You can log into the platform at https://agroblock.in/login using the email ({user.email}) and password credentials you specified during registration.\n\n"
                f"Best regards,\n"
                f"AgroBlock Administration"
            )
            html_body = get_html_template(
                title="Quality Lab Approved!",
                body_text=(
                    f"<p>Hello <strong>{user.name}</strong>,</p>"
                    f"<p>We are pleased to inform you that your Quality Lab application for <strong>{user.lab_name or 'Your Lab'}</strong> has been verified and approved by the System Administrator.</p>"
                    f"<p>Your account status has been updated to <strong>ACTIVE</strong>.</p>"
                    f"<p>You can now log into the platform and access your laboratory testing queue using the email (<strong>{user.email}</strong>) and password credentials you used when creating the account.</p>"
                ),
                cta_text="Log In to AgroBlock",
                cta_url="http://localhost:5173/login"
            )
            send_email(subject, user.email, text_body, html_body)
        except Exception as e:
            print(f"[EMAIL ERROR] Failed to send Quality Lab approval notification: {e}")

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='USER_APPROVED_BY_ADMIN',
        details=f"Admin {current_user.name} approved user {user.name} (Role: {user.role})."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': f'User {user.name} approved successfully!',
        'user': user.to_dict()
    }), 200


@admin_bp.route('/verify-farmer/<int:user_id>', methods=['POST'])
@roles_allowed('ADMIN')
def verify_farmer(current_user, user_id):
    user = User.query.get(user_id)
    if not user or user.role != 'FARMER':
        return jsonify({'message': 'Farmer not found'}), 404
        
    data = request.get_json() or {}
    verify = data.get('verify', True)
    
    user.is_verified_farmer = verify
    db.session.commit()
    
    # Audit log
    action = 'FARMER_PROFILE_VERIFIED' if verify else 'FARMER_PROFILE_UNVERIFIED'
    audit = AuditLog(
        user_id=current_user.id,
        action=action,
        details=f"Admin {current_user.name} set verification status for farmer {user.name} to {verify}."
    )
    db.session.add(audit)
    db.session.commit()
    
    return jsonify({
        'message': f"Farmer profile {'verified' if verify else 'unverified'} successfully!",
        'user': user.to_dict()
    }), 200


@admin_bp.route('/audit-logs', methods=['GET'])
@roles_allowed('ADMIN')
def get_audit_logs(current_user):
    limit = request.args.get('limit', 50, type=int)
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return jsonify([log.to_dict() for log in logs]), 200


@admin_bp.route('/analytics', methods=['GET'])
@roles_allowed('ADMIN')
def get_analytics(current_user):
    # Counts
    farmer_count = User.query.filter_by(role='FARMER').count()
    tester_count = User.query.filter_by(role='TESTER').count()
    inspector_count = User.query.filter_by(role='INSPECTOR').count()
    consumer_count = User.query.filter_by(role='CONSUMER').count()
    investor_count = User.query.filter_by(role='INVESTOR').count()
    
    # Funding Volume
    total_funding = db.session.query(db.func.sum(Investment.amount)).scalar() or 0
    
    # Crop category counts
    crop_counts = db.session.query(
        Farmer.crop_type, db.func.count(Farmer.id)
    ).group_by(Farmer.crop_type).all()
    crop_categories = {crop[0]: crop[1] for crop in crop_counts}
    
    # Quality approvals count
    approved_products = Product.query.filter_by(certification_status='APPROVED').count()
    rejected_products = Product.query.filter_by(certification_status='REJECTED').count()
    
    # System health/fraud alerts (mock rules e.g., investments on unapproved lots or mismatching wallets)
    fraud_warnings = []
    suspicious_investments = Investment.query.join(Product).filter(
        Product.certification_status == 'REJECTED'
    ).all()
    for inv in suspicious_investments:
        fraud_warnings.append({
            'type': 'CRITICAL_SUSPICION',
            'details': f"Investment ID {inv.id} made on a REJECTED product Lot {inv.lot_number}."
        })
        
    return jsonify({
        'user_counts': {
            'farmers': farmer_count,
            'testers': tester_count,
            'inspectors': inspector_count,
            'consumers': consumer_count,
            'investors': investor_count
        },
        'total_funding_wei': total_funding,
        'crop_categories': crop_categories,
        'quality_stats': {
            'approved': approved_products,
            'rejected': rejected_products
        },
        'fraud_warnings': fraud_warnings
    }), 200


@admin_bp.route('/create-inspector', methods=['POST'])
@roles_allowed('ADMIN')
def create_inspector(current_user):
    import random
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    district = data.get('district')
    sub_district = data.get('sub_district')
    coverage_level = data.get('coverage_level')
    phone_number = data.get('phone_number')

    if not name or not email or not district or not sub_district or not coverage_level or not phone_number:
        return jsonify({'message': 'Missing required fields'}), 400

    email = email.strip().lower()
    phone_number = phone_number.strip()

    if coverage_level not in ['SUB_DISTRICT', 'DISTRICT']:
        return jsonify({'message': 'Invalid coverage level'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email address already registered'}), 400

    if User.query.filter_by(phone_number=phone_number).first():
        return jsonify({'message': 'Phone number already registered'}), 400

    # System automatically generates a temporary password (e.g. Temp@1234 or Temp@<4 random digits>)
    temp_password = f"Temp@{random.randint(1000, 9999)}"
    
    new_user = User(
        name=name,
        email=email,
        phone_number=phone_number,
        role='INSPECTOR',
        district=district,
        sub_district=sub_district,
        coverage_level=coverage_level,
        must_change_password=True,
        status='PENDING_SETUP',
        is_approved=True # Automatically approved by admin
    )
    new_user.set_password(temp_password)
    db.session.add(new_user)
    db.session.commit()

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action='INSPECTOR_CREATED_BY_ADMIN',
        details=f"Admin {current_user.name} created Inspector {name} (Email: {email}, District: {district}, Taluk: {sub_district}, Coverage: {coverage_level})."
    )
    db.session.add(audit)
    db.session.commit()

    # Notify Inspector via email about account creation and temporary password
    from utils.email import send_email, get_html_template
    subject = "AgroChain Inspector Account Created"
    text_body = f"Hello {name},\n\nAn Agricultural Inspector account has been created for you by the Admin.\n\nOfficial Email: {email}\nTemporary Password: {temp_password}\n\nYou must change your password on your first login."
    html_body = get_html_template(
        title="Inspector Account Created",
        body_text=f"<p>Hello <strong>{name}</strong>,</p>"
                  f"<p>An Agricultural Inspector account has been created for you on the AgroChain platform by the System Administrator.</p>"
                  f"<p><strong>Your credentials:</strong></p>"
                  f"<ul>"
                  f"<li><strong>Email:</strong> {email}</li>"
                  f"<li><strong>Temporary Password:</strong> {temp_password}</li>"
                  f"</ul>"
                  f"<p>You are assigned to cover the district of <strong>{district}</strong> (Taluk: <strong>{sub_district}</strong>, Level: <strong>{coverage_level}</strong>).</p>"
                  f"<p><strong>Note:</strong> You must change your password on your first login to activate your account.</p>",
        cta_text="Login to AgroChain",
        cta_url="http://localhost:5173/login"
    )
    try:
        send_email(subject, email, text_body, html_body)
    except Exception as e:
        print(f"Error sending inspector creation email: {e}")

    return jsonify({
        'message': 'Inspector account created successfully!',
        'temp_password': temp_password,
        'user': new_user.to_dict()
    }), 201
