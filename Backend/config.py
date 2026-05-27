import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'agrochain-super-secret-key-1234')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-agrochain-secret-key-5678')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Defaults to SQLite local file, but can be overridden by PostgreSQL URL
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 
        'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'agrochain.db')
    )
