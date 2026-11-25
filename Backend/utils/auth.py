import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import request, jsonify, current_app
from models import User

def generate_token(user_id, role, is_test=False, email=None, name=None):
    try:
        payload = {
            'exp': datetime.now(timezone.utc) + timedelta(days=1),
            'iat': datetime.now(timezone.utc),
            'sub': user_id,
            'role': role,
            'is_test': is_test,
            'email': email,
            'name': name
        }
        return jwt.encode(
            payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm='HS256'
        )
    except Exception as e:
        return str(e)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'message': 'Invalid token format (Bearer <token> expected)'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            if data.get('is_test'):
                class VirtualTestUser:
                    def __init__(self, d):
                        self.id = d.get('sub', 9999)
                        self.name = d.get('name', 'Test Account')
                        self.email = d.get('email', 'test@gmail.com')
                        self.role = d.get('role', 'FARMER')
                        self.wallet_address = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
                        self.wallet_type = 'METAMASK'
                        self.is_approved = True
                        self.onboarding_complete = True
                        self.is_verified_farmer = True
                        self.district = 'Ernakulam'
                        self.sub_district = 'Kochi'
                        self.pin_code = '682022'
                        self.status = 'ACTIVE'
                        self.must_change_password = False
                        self.is_test = True
                    def to_dict(self):
                        return {
                            'id': self.id,
                            'name': self.name,
                            'email': self.email,
                            'role': self.role,
                            'wallet_address': self.wallet_address,
                            'wallet_type': self.wallet_type,
                            'is_approved': self.is_approved,
                            'onboarding_complete': self.onboarding_complete,
                            'is_verified_farmer': self.is_verified_farmer,
                            'district': self.district,
                            'sub_district': self.sub_district,
                            'pin_code': self.pin_code,
                            'status': self.status,
                            'must_change_password': self.must_change_password,
                            'is_test': True
                        }
                return f(VirtualTestUser(data), *args, **kwargs)

            current_user = User.query.filter_by(id=data['sub']).first()
            if not current_user:
                return jsonify({'message': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token is invalid'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

def roles_allowed(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if current_user.role not in roles:
                return jsonify({'message': f'Access denied. Required roles: {", ".join(roles)}'}), 403
            return f(current_user, *args, **kwargs)
        return token_required(decorated)
    return decorator
