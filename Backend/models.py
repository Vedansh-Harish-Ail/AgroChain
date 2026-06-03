from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone_number = db.Column(db.String(20), unique=True, nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(50), nullable=False) # FARMER, TESTER, CONSUMER, ADMIN
    wallet_address = db.Column(db.String(42), unique=True, nullable=True) # Linked Metamask Address
    wallet_type = db.Column(db.String(50), default='NONE') # NONE, METAMASK
    onboarding_complete = db.Column(db.Boolean, default=False)
    is_approved = db.Column(db.Boolean, default=False) # For farmers/testers approval
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relationships
    farmer_profile = db.relationship('Farmer', backref='user', uselist=False, cascade="all, delete-orphan")
    audit_logs = db.relationship('AuditLog', backref='user', lazy=True)
    investments = db.relationship('Investment', backref='investor', lazy=True)
    ratings = db.relationship('Rating', backref='consumer', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone_number': self.phone_number,
            'role': self.role,
            'wallet_address': self.wallet_address,
            'wallet_type': self.wallet_type,
            'onboarding_complete': self.onboarding_complete,
            'is_approved': self.is_approved,
            'created_at': self.created_at.isoformat()
        }


class OTPVerification(db.Model):
    __tablename__ = 'otp_verifications'
    
    id = db.Column(db.Integer, primary_key=True)
    phone_number = db.Column(db.String(20), unique=True, nullable=False)
    otp_code = db.Column(db.String(6), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'phone_number': self.phone_number,
            'otp_code': self.otp_code,
            'expires_at': self.expires_at.isoformat(),
            'created_at': self.created_at.isoformat()
        }



class Farmer(db.Model):
    __tablename__ = 'farmers'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    farm_location = db.Column(db.String(255), nullable=False)
    farm_size = db.Column(db.String(100), nullable=False)
    farming_type = db.Column(db.String(100), nullable=False) # organic / non-organic
    crop_type = db.Column(db.String(100), nullable=False)
    expected_yield = db.Column(db.Integer, nullable=False)
    cultivation_date = db.Column(db.DateTime, nullable=False)
    tx_hash = db.Column(db.String(66), nullable=True) # Blockchain Transaction Hash
    block_number = db.Column(db.Integer, nullable=True)
    blockchain_status = db.Column(db.String(50), default='DB_ONLY') # DB_ONLY, PENDING, VERIFIED
    is_approved = db.Column(db.Boolean, default=False) # Quality Tester approved cultivation
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    products = db.relationship('Product', backref='farmer', lazy=True, cascade="all, delete-orphan")
    investments = db.relationship('Investment', backref='farmer', lazy=True)
    ratings = db.relationship('Rating', backref='farmer', lazy=True)
    crop_updates = db.relationship('CropUpdate', backref='farmer', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'farmer_name': self.user.name if self.user else None,
            'farm_location': self.farm_location,
            'farm_size': self.farm_size,
            'farming_type': self.farming_type,
            'crop_type': self.crop_type,
            'expected_yield': self.expected_yield,
            'cultivation_date': self.cultivation_date.isoformat(),
            'tx_hash': self.tx_hash,
            'block_number': self.block_number,
            'blockchain_status': self.blockchain_status,
            'is_approved': self.is_approved,
            'wallet_address': self.user.wallet_address if self.user else None,
            'created_at': self.created_at.isoformat()
        }


class Product(db.Model):
    __tablename__ = 'products'
    
    lot_number = db.Column(db.Integer, primary_key=True) # Lot Number acts as PK
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmers.id', ondelete='CASCADE'), nullable=False)
    crop_name = db.Column(db.String(100), nullable=False)
    quality_grade = db.Column(db.String(50), nullable=False)
    price = db.Column(db.BigInteger, nullable=False) # Price in Wei
    test_date = db.Column(db.DateTime, nullable=False)
    expiry_date = db.Column(db.DateTime, nullable=False)
    certification_status = db.Column(db.String(50), nullable=False) # APPROVED, REJECTED
    tx_hash = db.Column(db.String(66), nullable=True)
    block_number = db.Column(db.Integer, nullable=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    investments = db.relationship('Investment', backref='product', lazy=True)
    ratings = db.relationship('Rating', backref='product', lazy=True)

    def to_dict(self):
        return {
            'lot_number': self.lot_number,
            'farmer_id': self.farmer_id,
            'farmer_name': self.farmer.user.name if self.farmer and self.farmer.user else None,
            'crop_name': self.crop_name,
            'quality_grade': self.quality_grade,
            'price': self.price,
            'test_date': self.test_date.isoformat(),
            'expiry_date': self.expiry_date.isoformat(),
            'certification_status': self.certification_status,
            'tx_hash': self.tx_hash,
            'block_number': self.block_number,
            'timestamp': self.timestamp.isoformat(),
            'created_at': self.created_at.isoformat()
        }


class Investment(db.Model):
    __tablename__ = 'investments'
    
    id = db.Column(db.Integer, primary_key=True)
    investor_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmers.id', ondelete='CASCADE'), nullable=False)
    lot_number = db.Column(db.Integer, db.ForeignKey('products.lot_number', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.BigInteger, nullable=False) # Amount in Wei
    tx_hash = db.Column(db.String(66), nullable=True)
    block_number = db.Column(db.Integer, nullable=True)
    profit_percentage = db.Column(db.Integer, default=10) # expected profit rate
    status = db.Column(db.String(50), default='ACTIVE') # ACTIVE, COMPLETED, REFUNDED
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'investor_id': self.investor_id,
            'investor_name': self.investor.name if self.investor else None,
            'farmer_id': self.farmer_id,
            'farmer_name': self.farmer.user.name if self.farmer and self.farmer.user else None,
            'lot_number': self.lot_number,
            'amount': self.amount,
            'tx_hash': self.tx_hash,
            'block_number': self.block_number,
            'profit_percentage': self.profit_percentage,
            'status': self.status,
            'timestamp': self.timestamp.isoformat(),
            'created_at': self.created_at.isoformat()
        }


class Rating(db.Model):
    __tablename__ = 'ratings'
    
    id = db.Column(db.Integer, primary_key=True)
    consumer_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmers.id', ondelete='CASCADE'), nullable=False)
    lot_number = db.Column(db.Integer, db.ForeignKey('products.lot_number', ondelete='CASCADE'), nullable=False)
    reliability = db.Column(db.Integer, nullable=False) # 1 to 5
    product_quality = db.Column(db.Integer, nullable=False) # 1 to 5
    delivery_satisfaction = db.Column(db.Integer, nullable=False) # 1 to 5
    comment = db.Column(db.Text, nullable=True)
    tx_hash = db.Column(db.String(66), nullable=True)
    block_number = db.Column(db.Integer, nullable=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'consumer_id': self.consumer_id,
            'consumer_name': self.consumer.name if self.consumer else None,
            'farmer_id': self.farmer_id,
            'farmer_name': self.farmer.user.name if self.farmer and self.farmer.user else None,
            'lot_number': self.lot_number,
            'reliability': self.reliability,
            'product_quality': self.product_quality,
            'delivery_satisfaction': self.delivery_satisfaction,
            'comment': self.comment,
            'tx_hash': self.tx_hash,
            'block_number': self.block_number,
            'timestamp': self.timestamp.isoformat()
        }


class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    tx_hash = db.Column(db.String(66), unique=True, nullable=False)
    block_number = db.Column(db.Integer, nullable=False)
    from_address = db.Column(db.String(42), nullable=False)
    to_address = db.Column(db.String(42), nullable=True)
    amount = db.Column(db.BigInteger, default=0) # Value sent in Wei
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    method_name = db.Column(db.String(100), nullable=True)
    event_data = db.Column(db.Text, nullable=True) # Serialized event logs JSON

    def to_dict(self):
        return {
            'id': self.id,
            'tx_hash': self.tx_hash,
            'block_number': self.block_number,
            'from_address': self.from_address,
            'to_address': self.to_address,
            'amount': self.amount,
            'timestamp': self.timestamp.isoformat(),
            'method_name': self.method_name,
            'event_data': self.event_data
        }


class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = db.Column(db.String(100), nullable=False) # e.g. LOGIN, USER_APPROVED, CROP_REGISTERED
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else 'System',
            'action': self.action,
            'details': self.details,
            'timestamp': self.timestamp.isoformat()
        }


class CropUpdate(db.Model):
    __tablename__ = 'crop_updates'
    
    id = db.Column(db.Integer, primary_key=True)
    farmer_id = db.Column(db.Integer, db.ForeignKey('farmers.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    day_count = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'farmer_id': self.farmer_id,
            'title': self.title,
            'description': self.description,
            'day_count': self.day_count,
            'timestamp': self.timestamp.isoformat()
        }
