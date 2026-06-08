import sys
from datetime import datetime, timedelta, timezone
from app import create_app
from models import db, Farmer, AuditLog

def create_crop():
    app = create_app()
    with app.app_context():
        # Create a crop that is ready to harvest and assigned to Dr. Anita Sharma (Tester, ID 4)
        new_crop = Farmer(
            user_id=2, # Rajesh Patel
            farm_location="Solapur, Maharashtra",
            district="Solapur",
            pin_code="413001",
            farm_size="4 Hectares",
            farming_type="Organic",
            crop_type="Organic Wheat",
            expected_yield=2200,
            cultivation_date=datetime.now(timezone.utc) - timedelta(days=35),
            tx_hash="0x8f87b8b4081c7e9976378baea28db3f7b98d1a1b1c7e9976378baea28db3f7b99c",
            block_number=18,
            blockchain_status="VERIFIED",
            is_approved=True, # Cultivation approved by Inspector
            timeline_status="READY_TO_HARVEST", # Marked as ready to harvest
            land_survey_no="SUR-WHT-2026-905",
            gps_latitude=17.6599,
            gps_longitude=75.9064,
            evidence_photos='["https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=600&q=80"]',
            verification_status="VERIFIED",
            tester_remarks="Inspector Rajiv Kumar checked the organic compliance. Verified.",
            assigned_inspector_id=3,
            assigned_tester_id=4, # Dr. Anita Sharma
            verification_date=datetime.now(timezone.utc) - timedelta(days=30)
        )
        db.session.add(new_crop)
        db.session.commit()

        # Add Audit log
        audit = AuditLog(
            user_id=3, # Inspector
            action="FARMER_CROP_APPROVED",
            details=f"Agricultural Inspector Rajiv Kumar verified and approved crop Organic Wheat (ID: {new_crop.id})."
        )
        db.session.add(audit)
        db.session.commit()

        print(f"SUCCESS: Created Crop ID {new_crop.id} (Organic Wheat, READY_TO_HARVEST) assigned to Tester ID 4.")

if __name__ == '__main__':
    create_crop()
