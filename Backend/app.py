from flask import Flask, jsonify   
from flask_cors import CORS
from config import Config
from models import db

# Import blueprints
from routes.auth import auth_bp
from routes.farmer import farmer_bp
from routes.quality import quality_bp
from routes.product import product_bp
from routes.finance import finance_bp
from routes.rating import rating_bp
from routes.explorer import explorer_bp
from routes.admin import admin_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize DB
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(farmer_bp, url_prefix='/api/farmer')
    app.register_blueprint(quality_bp, url_prefix='/api/quality')
    app.register_blueprint(product_bp, url_prefix='/api/product')
    app.register_blueprint(finance_bp, url_prefix='/api/finance')
    app.register_blueprint(rating_bp, url_prefix='/api/rating')
    app.register_blueprint(explorer_bp, url_prefix='/api/explorer')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Global error handler
    @app.errorhandler(Exception)
    def handle_error(e):
        return jsonify({
            'message': 'An unexpected error occurred.',
            'error': str(e)
        }), 500
        
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({'status': 'healthy', 'message': 'AgroChain Backend API is online.'}), 200
        
    with app.app_context():
        db.create_all()
        
    return app

if __name__ == '__main__':
    app = create_app()
    # Read port from environment or default to 5000
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
