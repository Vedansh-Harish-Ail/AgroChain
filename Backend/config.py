import os

class Config:
    # Get absolute path to the directory where config.py is located (Backend folder)
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    
    SECRET_KEY = os.environ.get('SECRET_KEY', 'agrochain-super-secret-key-1234')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-agrochain-secret-key-5678')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Force absolute path for SQLite
    DATABASE_PATH = os.path.join(BASE_DIR, 'agrochain.db')
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DATABASE_PATH}"
