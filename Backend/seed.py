from app import create_app
from models import db, User, Farmer, Product, Investment, Rating, Transaction, AuditLog, CropUpdate
from datetime import datetime, timedelta

def seed_database(reset=False):
    app = create_app()
    with app.app_context():
        if reset:
            print("Clearing database...")
            db.drop_all()
            db.create_all()
        else:
            db.create_all()
            # Skip seeding if database already contains users/data to preserve existing registrations
            if User.query.first() is not None:
                print("Database already contains users. Skipping database seeding to preserve existing accounts.")
                print("To reset the database, run: py seed.py --reset")
                return

        print("Seeding users...")
        
        # Admin
        admin = User(name="System Administrator", email="admin@gmail.com", role="ADMIN", is_approved=True)
        admin.set_password("test@123")
        db.session.add(admin)
        
        # Farmer
        farmer = User(
            name="Rajesh Patel", 
            email="farmer@gmail.com", 
            role="FARMER", 
            is_approved=True,
            wallet_address="0x70997970c51812dc3a010c7d01b50e0d17dc79c8", # Hardhat Account #1
            wallet_type="METAMASK",
            onboarding_complete=True
        )
        farmer.set_password("test@123")
        db.session.add(farmer)
        
        # Tester
        tester = User(
            name="Dr. Anita Sharma (Quality Inspector)", 
            email="tester@gmail.com", role="TESTER", 
            is_approved=True,
            wallet_address="0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266" # Hardhat Account #0 (Deployer)
        )
        tester.set_password("test@123")
        db.session.add(tester)
        
        # Consumer
        consumer = User(
            name="Amit Kumar (Retail Investor)", 
            email="consumer@gmail.com", 
            role="CONSUMER", 
            is_approved=True,
            wallet_address="0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc" # Hardhat Account #2
        )
        consumer.set_password("test@123")
        db.session.add(consumer)
        
        db.session.commit()
        print("Users seeded successfully!")
        
        # Seed crop projects
        print("Seeding crop projects...")
        crop1 = Farmer(
            user_id=farmer.id,
            farm_location="Pune, Maharashtra",
            farm_size="5 Hectares",
            farming_type="Organic",
            crop_type="Basmati Rice",
            expected_yield=2500,
            cultivation_date=datetime.utcnow() - timedelta(days=45),
            tx_hash="0x5f87b8b4081c7e9976378baea28db3f7b98d1a1b1c7e9976378baea28db3f7b98d",
            block_number=12,
            blockchain_status="VERIFIED",
            is_approved=True
        )
        db.session.add(crop1)
        
        crop2 = Farmer(
            user_id=farmer.id,
            farm_location="Nashik, Maharashtra",
            farm_size="3 Hectares",
            farming_type="Organic",
            crop_type="Alphonso Mango",
            expected_yield=1200,
            cultivation_date=datetime.utcnow() - timedelta(days=60),
            tx_hash="0xa9b8c7d6e5f43210123456789abcdef0123456789abcdef0123456789abcdef0",
            block_number=15,
            blockchain_status="VERIFIED",
            is_approved=True
        )
        db.session.add(crop2)
        
        # This one is DB_ONLY (Lazy Wallet demonstration)
        crop3 = Farmer(
            user_id=farmer.id,
            farm_location="Nagpur, Maharashtra",
            farm_size="4 Hectares",
            farming_type="Non-Organic",
            crop_type="Organic Cotton",
            expected_yield=1800,
            cultivation_date=datetime.utcnow() - timedelta(days=10),
            tx_hash=None,
            block_number=None,
            blockchain_status="DB_ONLY",
            is_approved=False # Pending review
        )
        db.session.add(crop3)
        
        db.session.commit()
        
        # Seed products (Certified lots)
        print("Seeding certified products...")
        product1 = Product(
            lot_number=1001,
            farmer_id=crop1.id,
            crop_name="Basmati Rice",
            quality_grade="Grade A+",
            price=1500000000000000000, # 1.5 ETH in Wei
            test_date=datetime.utcnow() - timedelta(days=10),
            expiry_date=datetime.utcnow() + timedelta(days=365),
            certification_status="APPROVED",
            tx_hash="0xbc9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f43210123456789abcdef0123456789ab",
            block_number=20
        )
        db.session.add(product1)
        
        product2 = Product(
            lot_number=1002,
            farmer_id=crop2.id,
            crop_name="Alphonso Mango",
            quality_grade="Grade A",
            price=3000000000000000000, # 3.0 ETH in Wei
            test_date=datetime.utcnow() - timedelta(days=5),
            expiry_date=datetime.utcnow() + timedelta(days=30),
            certification_status="APPROVED",
            tx_hash="0xcd8e7f6a5b4c3d2e1f0a9b8c7d6e5f43210123456789abcdef0123456789abcde",
            block_number=22
        )
        db.session.add(product2)
        db.session.commit()
        
        # Seed investments
        print("Seeding investments...")
        investment1 = Investment(
            investor_id=consumer.id,
            farmer_id=crop1.id,
            lot_number=product1.lot_number,
            amount=500000000000000000, # 0.5 ETH in Wei
            tx_hash="0xdef102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
            block_number=25,
            profit_percentage=12,
            status="ACTIVE"
        )
        db.session.add(investment1)
        db.session.commit()
        
        # Seed ratings
        print("Seeding ratings...")
        rating1 = Rating(
            consumer_id=consumer.id,
            farmer_id=crop1.id,
            lot_number=product1.lot_number,
            reliability=5,
            product_quality=5,
            delivery_satisfaction=4,
            comment="Excellent high-quality grain! Transparent blockchain records are verified. Highly recommend Rajesh.",
            tx_hash="0xeef0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1",
            block_number=30
        )
        db.session.add(rating1)
        db.session.commit()
        
        # Seed audit and transactions
        print("Seeding explorer records...")
        tx_list = [
            Transaction(
                tx_hash="0x5f87b8b4081c7e9976378baea28db3f7b98d1a1b1c7e9976378baea28db3f7b98d",
                block_number=12,
                from_address=farmer.wallet_address,
                to_address="0x0000000000000000000000000000000000000000",
                amount=0,
                method_name="registerFarmer",
                event_data='{"farmerId": 1, "name": "Rajesh Patel"}'
            ),
            Transaction(
                tx_hash="0xbc9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f43210123456789abcdef0123456789ab",
                block_number=20,
                from_address=tester.wallet_address,
                to_address="0x0000000000000000000000000000000000000000",
                amount=0,
                method_name="registerProduct",
                event_data='{"lotNumber": 1001, "farmerId": 1, "qualityGrade": "Grade A+"}'
            ),
            Transaction(
                tx_hash="0xdef102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
                block_number=25,
                from_address=consumer.wallet_address,
                to_address=farmer.wallet_address,
                amount=500000000000000000,
                method_name="invest",
                event_data='{"investmentId": 0, "investor": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", "amount": 500000000000000000}'
            )
        ]
        db.session.add_all(tx_list)
        
        audit_list = [
            AuditLog(user_id=admin.id, action="SYSTEM_INIT", details="System database seeded and initialized."),
            AuditLog(user_id=farmer.id, action="FARMER_CROP_REGISTERED", details="Farmer Rajesh Patel listed Basmati Rice."),
            AuditLog(user_id=tester.id, action="FARMER_CROP_APPROVED", details="Verifier Anita Sharma approved Basmati Rice."),
            AuditLog(user_id=tester.id, action="PRODUCT_LOT_CREATED", details="Verifier Anita Sharma created Lot 1001."),
            AuditLog(user_id=consumer.id, action="INVESTMENT_MADE", details="Consumer Amit Kumar invested 0.5 ETH in Lot 1001.")
        ]
        db.session.add_all(audit_list)
        db.session.commit()
        
        # Seed crop updates (progress tracking milestones)
        print("Seeding crop progress updates...")
        updates = [
            # For Crop 1 (Basmati Rice, expected yield 2500)
            CropUpdate(
                farmer_id=crop1.id,
                title="Seeds Planted & Soil Prep",
                description="Traditional Basmati seeds sown after machine-tilling soil and incorporating green manure.",
                day_count=1
            ),
            CropUpdate(
                farmer_id=crop1.id,
                title="Irrigation & Transplanting Completed",
                description="Saplings transplanted into flooded fields. Natural water management protocols established.",
                day_count=20
            ),
            CropUpdate(
                farmer_id=crop1.id,
                title="Organic Fertilization Cycle 1",
                description="Applied bio-fertilizer and vermicompost to boost nitrogen absorption and root depth.",
                day_count=45
            ),
            CropUpdate(
                farmer_id=crop1.id,
                title="Quality Lab Inspection Approved",
                description="Auditor verified absence of pesticide residues. Crop certified Grade A+ organic.",
                day_count=75
            ),
            CropUpdate(
                farmer_id=crop1.id,
                title="Harvesting & Yield Recording",
                description="Manual harvesting completed. Grains weighed and registered at 2,500 kg yield.",
                day_count=90
            ),
            # For Crop 2 (Alphonso Mango, expected yield 1200)
            CropUpdate(
                farmer_id=crop2.id,
                title="Orchard Pruning & Manuring",
                description="Organic manure application completed under mango trees to prepare for winter flowering.",
                day_count=1
            ),
            CropUpdate(
                farmer_id=crop2.id,
                title="Flowering & Biological Pest Control",
                description="Flowering phase monitored. Introduced natural predators to handle aphids without chemical spray.",
                day_count=30
            ),
            CropUpdate(
                farmer_id=crop2.id,
                title="Fruit Setting & Organic Inspection",
                description="Inspection confirmed pure organic compliance. Yield estimated at 1,200 kg.",
                day_count=60
            )
        ]
        db.session.add_all(updates)
        db.session.commit()
        
        print("Database seeded with sample records successfully!")

if __name__ == '__main__':
    import sys
    reset_db = '--reset' in sys.argv or '--force' in sys.argv
    seed_database(reset=reset_db)
