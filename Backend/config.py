import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:

    # Get absolute path to the directory where config.py is located (Backend folder)
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    
    SECRET_KEY = os.environ.get('SECRET_KEY', 'agrochain-super-secret-key-1234')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-agrochain-secret-key-5678')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Force absolute path for SQLite
    DATABASE_PATH = os.path.join(BASE_DIR, 'agrochain.db')
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{DATABASE_PATH}"

    # SMS Gateway Configurations
    SMS_ENABLED = os.environ.get('SMS_ENABLED', 'False').lower() == 'true'
    SMS_GATEWAY_URL = os.environ.get('SMS_GATEWAY_URL', '')
    SMS_GATEWAY_USER = os.environ.get('SMS_GATEWAY_USER', '')
    SMS_GATEWAY_PASSWORD = os.environ.get('SMS_GATEWAY_PASSWORD', '')

    # Mail / Gmail SMTP Configurations
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME', '')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD', '')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', '')


