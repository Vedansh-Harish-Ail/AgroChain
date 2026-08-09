# Database Design Table

| Table Name | Entity Description | Primary Key | Foreign Key Linkages |
| :--- | :--- | :--- | :--- |
| `users` | Unified registry for all actors (Admin, Farmer, Inspector, Tester, Consumer, Investor) | `id` | None |
| `farmers` | Core crop listings and physical farm profiles (managed by farmers) | `id` | `user_id` -> `users.id`, `assigned_inspector_id` -> `users.id`, `assigned_tester_id` -> `users.id`, `tester_id` -> `users.id` |
| `products` | Harvested crop batches with scientific lab certification grades | `lot_number` | `farmer_id` -> `farmers.id` |
| `investments` | Letter of Intent (LOI) proposals and funding commitments | `id` | `investor_id` -> `users.id`, `farmer_id` -> `farmers.id`, `lot_number` -> `products.lot_number` |
| `ratings` | Trustworthiness reviews submitted by Consumers for Farmer batches | `id` | `consumer_id` -> `users.id`, `farmer_id` -> `farmers.id`, `lot_number` -> `products.lot_number` |
| `crop_updates` | Timeline progression log for active crop growth cycles | `id` | `farmer_id` -> `farmers.id` |
| `otp_verifications` | Two-factor verification records (SMS & Email) | `id` | None |
| `transactions` | Cached on-chain EVM transaction logs and parameters | `id` | None |
| `audit_logs` | Chronological platform operations log for accountability | `id` | `user_id` -> `users.id` |

# Agriculture Inspector Table

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique inspector user identifier |
| `name` | VARCHAR(100) | NOT NULL | Inspector's full name |
| `email` | VARCHAR(120) | UNIQUE, NOT NULL | Primary email address |
| `phone_number` | VARCHAR(20) | UNIQUE, NULLABLE | Contact phone number |
| `password_hash` | VARCHAR(256) | NOT NULL | Bcrypt hashed password |
| `role` | VARCHAR(50) | NOT NULL | Role classification (`INSPECTOR`) |
| `wallet_address` | VARCHAR(42) | UNIQUE, NULLABLE | Linked Ethereum MetaMask address (must hold `AGRICULTURE_ROLE` on-chain) |
| `wallet_type` | VARCHAR(50) | DEFAULT 'NONE' | Web3 wallet source (`METAMASK`, `NONE`) |
| `district` | VARCHAR(100) | NULLABLE | Administrative District base (e.g. Ernakulam) |
| `sub_district` | VARCHAR(100) | NULLABLE | Administrative Sub-district / Taluk (e.g. Aluva) |
| `pin_code` | VARCHAR(20) | NULLABLE | Base postal PIN code |
| `coverage_pins` | TEXT | NULLABLE | JSON list of assigned service PIN codes (e.g. `["683112", "683108"]`) |
| `coverage_level` | VARCHAR(50) | NULLABLE | Scope of operations (`DISTRICT`, `SUB_DISTRICT`) |
| `must_change_password`| BOOLEAN | DEFAULT FALSE | Forces password reset on first login |
| `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | Lifecycle state (`PENDING_SETUP`, `ACTIVE`, `INACTIVE`) |
| `created_at` | DATETIME | DEFAULT current_timestamp | Account registration timestamp |

# Quality Tester Table

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique tester user identifier |
| `name` | VARCHAR(100) | NOT NULL | Tester's full name |
| `email` | VARCHAR(120) | UNIQUE, NOT NULL | Primary email address |
| `phone_number` | VARCHAR(20) | UNIQUE, NULLABLE | Contact phone number |
| `password_hash` | VARCHAR(256) | NOT NULL | Bcrypt hashed password |
| `role` | VARCHAR(50) | NOT NULL | Role classification (`TESTER`) |
| `wallet_address` | VARCHAR(42) | UNIQUE, NULLABLE | Linked Ethereum MetaMask address (must hold `QUALITY_TESTOR_ROLE` on-chain) |
| `district` | VARCHAR(100) | NULLABLE | Administrative District of operation |
| `pin_code` | VARCHAR(20) | NULLABLE | Lab postal PIN code |
| `must_change_password`| BOOLEAN | DEFAULT FALSE | Forces password reset on first login |
| `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | Account state (`PENDING_SETUP`, `ACTIVE`) |
| `lab_name` | VARCHAR(150) | NULLABLE | Certified Laboratory Name (e.g., NABL Lab) |
| `authorized_person` | VARCHAR(100) | NULLABLE | Authorized testing personnel name |
| `lab_license_number` | VARCHAR(100) | NULLABLE | Government-issued laboratory license number |
| `accreditation_number`| VARCHAR(100) | NULLABLE | NABL accreditation identifier |
| `gov_reg_number` | VARCHAR(100) | NULLABLE | Government registry tracking code |
| `lab_certificates` | TEXT | NULLABLE | JSON list of accredited certificate URLs |
| `supporting_documents`| TEXT | NULLABLE | JSON list of legal laboratory document URLs |
| `created_at` | DATETIME | DEFAULT current_timestamp | Account registration timestamp |

# Admin Table

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique administrator identifier |
| `name` | VARCHAR(100) | NOT NULL | Administrator's full name |
| `email` | VARCHAR(120) | UNIQUE, NOT NULL | Primary login email (`admin@gmail.com`) |
| `phone_number` | VARCHAR(20) | UNIQUE, NULLABLE | Contact phone number |
| `password_hash` | VARCHAR(256) | NOT NULL | Bcrypt hashed password |
| `role` | VARCHAR(50) | NOT NULL | Role classification (`ADMIN`) |
| `is_approved` | BOOLEAN | DEFAULT FALSE | Approval flag (hardcoded to `TRUE` for admin) |
| `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | Account lifecycle status |
| `created_at` | DATETIME | DEFAULT current_timestamp | Account registration timestamp |

# Normal User Table (Farmer)

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique farmer user identifier |
| `name` | VARCHAR(100) | NOT NULL | Farmer's full name |
| `email` | VARCHAR(120) | UNIQUE, NOT NULL | Primary email address |
| `phone_number` | VARCHAR(20) | UNIQUE, NULLABLE | Phone number |
| `password_hash` | VARCHAR(256) | NOT NULL | Bcrypt hashed password |
| `role` | VARCHAR(50) | NOT NULL | Role classification (`FARMER`) |
| `wallet_address` | VARCHAR(42) | UNIQUE, NULLABLE | Linked Ethereum MetaMask address |
| `wallet_type` | VARCHAR(50) | DEFAULT 'NONE' | Wallet provider type (`METAMASK`, `NONE`) |
| `onboarding_complete` | BOOLEAN | DEFAULT FALSE | Profile registration checklist state |
| `government_id` | VARCHAR(100) | NULLABLE | Aadhaar/Government ID identifier |
| `ownership_proof_url` | VARCHAR(255) | NULLABLE | Cloud URL to land deeds/tax receipts PDF |
| `is_verified_farmer` | BOOLEAN | DEFAULT FALSE | Boolean flag marking profile verification |
| `district` | VARCHAR(100) | NULLABLE | Farmer administrative District |
| `sub_district` | VARCHAR(100) | NULLABLE | Farmer Taluk |
| `pin_code` | VARCHAR(20) | NULLABLE | Farmer home postal PIN code |
| `created_at` | DATETIME | DEFAULT current_timestamp | Registration date |

# Consumer Table

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique consumer user identifier |
| `name` | VARCHAR(100) | NOT NULL | Consumer's full name |
| `email` | VARCHAR(120) | UNIQUE, NOT NULL | Primary email address |
| `phone_number` | VARCHAR(20) | UNIQUE, NULLABLE | Contact phone number |
| `password_hash` | VARCHAR(256) | NOT NULL | Bcrypt hashed password |
| `role` | VARCHAR(50) | NOT NULL | Role classification (`CONSUMER`) |
| `wallet_address` | VARCHAR(42) | UNIQUE, NULLABLE | Optional linked Ethereum wallet |
| `created_at` | DATETIME | DEFAULT current_timestamp | Account registration timestamp |
