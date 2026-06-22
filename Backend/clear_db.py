from app import create_app
from models import db, User

def clear_database():
    app = create_app()
    with app.app_context():
        print("Dropping all database tables...")
        db.drop_all()
        print("Recreating database tables...")
        db.create_all()
        
        print("Creating default system administrator account...")
        admin = User(
            name="System Administrator", 
            email="admin@gmail.com", 
            phone_number="+10000000001", 
            role="ADMIN", 
            is_approved=True
        )
        admin.set_password("test@123")
        db.session.add(admin)
        db.session.commit()
        print("Success: Database cleared! Fresh database ready with System Admin (admin@gmail.com / test@123).")

if __name__ == '__main__':
    clear_database()
