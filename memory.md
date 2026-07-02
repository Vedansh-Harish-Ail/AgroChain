# AgroChain (Modernized) — Complete Project Memory

**Last Updated:** *July 1, 2026, 02:30 PM IST (UTC+5:30)*

This document is the master documentation of the **AgroChain** (Modernized) project. It contains a detailed breakdown of the project’s purpose, features, security models, data structures, backend routes, contract details, frontend screens, and step-by-step developer checklists.
................
---

## 1. What the Project is About (The "Why")

### Core Problems Addressed
1. **The Trust Deficit in Agriculture**: Consumers buying premium crops (e.g., "Organic Basmati Rice") have no way of verifying whether they are truly organic or where they were grown. Labels can easily be forged or tampered with.
2. **Exploitative Financing & Middlemen**: Small-scale farmers struggle to secure low-interest loans from traditional banks. They are forced to rely on local money lenders charging high rates (30-40% interest) or sell through multiple intermediaries, reducing their margins.
3. **Database Centralization Vulnerability**: In a standard SQL-based application, any system administrator or database hacker can change a crop status from "Rejected" to "Approved" with a simple `UPDATE` query. There is no permanent audit trail.

### The AgroChain Solution
AgroChain bridges the gap between farmers, quality inspectors, consumers, and micro-finance investors using a hybrid architecture:
* **The Blockchain (Ledger of Truth)**: A decentralized network of smart contracts that registers crop ownership, records certified quality inspections, processes micro-investments, and locks ratings. Once written, these records are **immutable** and **non-repudiable**.
* **The Backend (State Cache & Identity Management)**: A Flask API that manages fast user profile lookups, handles SMS-based OTP phone verification, manages roles, and caches blockchain transaction histories for fast searching.
* **The Frontend (Responsive Interface)**: A React/Vite single-page application integrating Tailwind CSS (with light/dark theme toggles) and MetaMask.

---

## 2. Platform Core Features (The "What")

### A. Role-Based Stakeholder Workflows
The platform implements strict Role-Based Access Control (RBAC) across five separate user roles:

1. **System Administrator (`ADMIN`)** *(Updated: June 7, 2026, 11:28 PM)*:
   - Oversees the entire ecosystem, approves pending user registration accounts, and monitors the overall system health.
   - Features the **System Audit Trail** showing all backend operations, with auto-parsed transaction hashes and crop/lot IDs that link directly to the lookup explorer.
   - Displays system analytics (total farmers, testers, consumers, dedicated investors, crop category distributions, and fraud alerts).

2. **Farmer (`FARMER`)** *(Updated: June 8, 2026, 06:35 PM)*:
   - Registers crop cultivations by entering expected yields, locations, farm sizes, crop types, land survey numbers, GPS coordinates, and uploading evidence photos.
   - Manages crop lifecycles through a restricted timeline status.
   - Reviews Letters of Intent (proposals) submitted by investors and accepts/declines them.
   - Accesses the **Farmer Document Center** to view and print official crop approval letters and certified batch certificates containing dynamic QR codes.

3. **Agricultural Inspector (`INSPECTOR`)** *(Updated: June 11, 2026, 01:00 AM)*:
   - Private signup disabled. Accounts created only by the Admin with an auto-generated temporary password.
   - Forced to change password on first login (blocks dashboard interaction).
   - Must connect their MetaMask wallet and sign a verification message (`personal_sign`) to prove ownership. Upon backend signature verification, the wallet is stored and status changes from `PENDING_SETUP` to `ACTIVE`.
   - Only `ACTIVE` inspectors receive crop assignments.
   - Assigned crops based on the Kerala-based hierarchy: Priority 1 (Same Taluk/Sub-District), Priority 2 (Same District), Priority 3 (Any active DISTRICT-level Inspector).
   - Inspects registrations by viewing deeds and coordinates, adding remarks and an inspection method (`PHYSICAL_VISIT`, `PHOTO_REVIEW`, `HYBRID`). Can save notes in the DB without MetaMask, or sign final verifications on-chain.

4. **Quality Tester / Lab (`TESTER`)** *(Updated: June 12, 2026, 05:00 PM)*:
   - Self-registers. Requires: Lab Name, Authorized Person, Email, Phone, District, Sub-District, Lab License Number, Accreditation Number, Government Registration Number, Lab Certificates, and Supporting Documents.
   - On self-registration, their account status is set to `PENDING_APPROVAL` with `is_approved = False`. In this state, they cannot access testing services or receive assignments.
   - The System Administrator reviews their credentials using a dedicated modal on the Admin Dashboard and activates them to `ACTIVE` status (`is_approved = True`).
   - Only active, approved Quality Labs are matched to crops (based on geographic location: district and pin code) and can receive assignments.
   - MetaMask is NOT required to log in. It is only required to sign the final on-chain product certificates. A warning card is displayed on their dashboard if their MetaMask wallet is unlinked.

5. **Dedicated Investor (`INVESTOR`)** *(Updated: June 8, 2026, 06:35 PM)*:
   - Logs in to explore verified, active crop listings seeking funding.
   - Submits formal micro-finance proposals (proposing funding amounts in Rupees, return yield margins, and terms).
   - Locks and transfers funds (test ETH) directly to the farmer's MetaMask wallet using the `MicroFinance.sol` smart contract escrow mechanism.

6. **Consumer / Retail Buyer (`CONSUMER` / Legacy Role)** *(Updated: June 7, 2026, 11:28 PM)*:
   - Explores the public agricultural supply chain directory without needing to log in.
   - Traces crop provenance (GPS coordinates, map links, testing dates, and timeline steps).
   - Logs in to submit reviews and trust ratings (evaluating reliability, quality, and delivery satisfaction). Supports walletless Web2 interactions, where ratings are logged in the database if a MetaMask wallet is not connected, but verified on-chain if connected.

### B. High-Fidelity Lookup Portal & QR Link *(Updated: June 8, 2026, 06:35 PM)*
* **Explorer Redesign (`/explorer`)**: Replaced raw, tech-heavy blockchain transaction indexes with a dual-tab lookup interface (Crop Cultivation ID vs. Product Lot Number) displaying clean certificates.
* **Redirection query parsing**: The explorer parses browser search query parameters on mount (e.g., `?lot=1001` or `?crop=2`). 
* **Physical Packaging QR Code**: Testers generate a Product Lot Number that is encoded into a QR Code. When printed and stuck on a crop bag, scanning the QR code redirects the consumer directly to the explorer page, auto-filling and loading the lot details.

### C. Printable Modals & Printer CSS *(Updated: June 8, 2026, 06:35 PM)*
* **Crop Verification Approval Letter**: A formal letterhead issued by "AgroChain Transparency Labs" detailing passed soil chemistry parameters, survey numbers, coordinates, and signatures.
* **Batch Quality Certificate**: A gold-and-green styled border certificate displaying the grade badge, price, dates, and the scannable QR Code.
* **Print CSS Rules**: Custom `@media print` rules hide sidebars, buttons, headers, and backgrounds, formatting only the certificate document cleanly on standard paper sizes.

---

## 3. Smart Contract Details (The "How - Blockchain")

Deployed on Hardhat local network at `http://127.0.0.1:8545` using `ethers.js` (v6).

### A. `FarmerRegistry.sol`
Responsible for crop registration, verifier assignment, and crop status validation.
* **Roles**: `TESTER_ROLE`, `ADMIN_ROLE` (configured via OpenZeppelin `AccessControl`).
* **Data Structures**:
  ```solidity
  struct Farmer {
      uint256 farmerId;
      string farmerName;
      string farmLocation;
      string farmSize;
      string farmingType; // organic / non-organic
      string cropType;
      uint256 expectedYield;
      uint256 cultivationDate;
      address walletAddress;
      bool isRegistered;
      bool isApproved;
  }
  ```
* **Functions**:
  - `registerFarmer(...)`: Emits `FarmerRegistered`. Logs a crop off-chain and locks it on-chain.
  - `approveFarmer(uint256 _farmerId)`: Sets `isApproved = true`. Emits `FarmerApproved`.
  - `rejectFarmer(uint256 _farmerId)`: Marks `isRegistered = false`, blocking approvals. Emits `FarmerRejected`.
  - Getters: `getFarmer()`, `getFarmerCount()`, `isFarmerApproved()`.

### B. `ProductRegistry.sol`
Handles batch quality certification, quality grades, and pricing setup.
* **Contract Linkage**: Instantiated with the address of `FarmerRegistry` to check if a crop has been approved before allowing certification.
* **Data Structures**:
  ```solidity
  struct Product {
      uint256 lotNumber;
      uint256 farmerId;
      string cropName;
      string qualityGrade;
      uint256 price; // Price in Wei
      uint256 testDate;
      uint256 expiryDate;
      string certificationStatus; // APPROVED / REJECTED
      address testerAddress;
      bool exists;
  }
  ```
* **Functions**:
  - `registerProduct(...)`: Tester locks certified quality grade, price, test dates, and status on-chain. Emits `ProductRegistered`.
  - Getters: `getProduct()`, `isProductExists()`, `getProductCount()`.

### C. `MicroFinance.sol`
Facilitates trustless peer-to-peer micro-finance using Ethereum.
* **Data Structures**:
  ```solidity
  struct Investment {
      uint256 investmentId;
      address investor;
      uint256 farmerId;
      uint256 lotNumber;
      uint256 amount; // in Wei
      uint256 timestamp;
      uint256 profitPercentage;
      string status; // "ACTIVE", "COMPLETED", "REFUNDED"
  }
  ```
* **Functions**:
  - `invest(...)`: Investor calls this and sends ETH. It checks if the crop is approved, checks that the farmer is registered, forwards the ETH directly to the farmer's address, and registers the investment struct. Emits `InvestmentMade`.
  - `updateInvestmentStatus(...)`: Farmer or owner updates investment status to completed/refunded. Emits `InvestmentStatusUpdated`.

### D. `RatingSystem.sol`
Locks consumer feedback metrics on-chain.
* **Data Structures**:
  ```solidity
  struct Rating {
      uint256 ratingId;
      address consumer;
      uint256 farmerId;
      uint256 lotNumber;
      uint8 reliability; // 1-5
      uint8 productQuality; // 1-5
      uint8 deliverySatisfaction; // 1-5
      string comment;
      uint255 timestamp;
  }
  ```
* **Functions**:
  - `addRating(...)`: Records ratings on-chain. Emits `RatingAdded`.
  - `getFarmerAverageRating(uint256 _farmerId)`: Computes the average rating scaled by 10 (e.g. 45 represents 4.5) to bypass Solidity's lack of float division.

---

## 4. Backend Database Schema & API Specifications

Backend runs Flask on port `5000` with an `agrochain.db` SQLite database.

### A. SQLite Table Schemas (`models.py`)

1. **`users`**:
   - `id` (PK), `name`, `email` (Unique), `phone_number` (Unique), `password_hash`, `role` (`ADMIN`, `FARMER`, `INSPECTOR`, `TESTER`, `CONSUMER`, `INVESTOR`), `wallet_address`, `is_approved`, `is_verified_farmer`, `government_id`, `ownership_proof_url`, `district`, `pin_code`, `coverage_pins` (Text list of pins for verifiers), `sub_district` (Taluk), `coverage_level` (`SUB_DISTRICT`, `DISTRICT`), `must_change_password` (Boolean), `status` (`PENDING_SETUP`, `ACTIVE`, `INACTIVE`, `SUSPENDED`, `PENDING_APPROVAL`), `lab_name` (Text), `authorized_person` (Text), `lab_license_number` (Text), `accreditation_number` (Text), `gov_reg_number` (Text), `lab_certificates` (Text JSON), `supporting_documents` (Text JSON).
2. **`farmers`**:
   - `id` (PK), `user_id` (FK $\rightarrow$ `users`), `farm_location`, `farm_size`, `farming_type`, `crop_type`, `expected_yield`, `cultivation_date`, `tx_hash`, `block_number`, `blockchain_status` (`DB_ONLY`, `VERIFIED`), `is_approved`, `timeline_status`, `land_survey_no`, `gps_latitude`, `gps_longitude`, `evidence_photos` (JSON list of URLs), `evidence_documents` (JSON list of URLs), `verification_status` (`PENDING`, `VERIFIED`, `REJECTED`), `tester_remarks`, `assigned_inspector_id` (FK), `assigned_tester_id` (FK), `tester_id` (FK), `verification_date`, `farm_address`, `district`, `sub_district` (Taluk), `village`, `pin_code`, `inspection_date`, `inspection_notes`, `inspection_method` (`PHYSICAL_VISIT`, `PHOTO_REVIEW`, `HYBRID`).
3. **`products`**:
   - `lot_number` (PK), `farmer_id` (FK $\rightarrow$ `farmers`), `crop_name`, `quality_grade`, `price` (BigInt Wei), `test_date`, `expiry_date`, `certification_status` (`APPROVED`, `REJECTED`), `tx_hash`, `block_number`, `timestamp`.
4. **`investments`**:
   - `id` (PK), `investor_id` (FK $\rightarrow$ `users`), `farmer_id` (FK $\rightarrow$ `farmers`), `lot_number` (FK $\rightarrow$ `products`), `amount` (Rs. value proposal), `tx_hash`, `block_number`, `profit_percentage`, `status` (`PENDING`, `ACCEPTED`, `DECLINED`), `terms`, `message`, `timestamp`.
5. **`ratings`**:
   - `id` (PK), `consumer_id` (FK), `farmer_id` (FK), `lot_number` (FK), `reliability`, `product_quality`, `delivery_satisfaction`, `comment`, `tx_hash`, `block_number`, `blockchain_status` (`DB_ONLY`, `VERIFIED`), `timestamp`.
6. **`transactions`**:
   - `id` (PK), `tx_hash` (Unique), `block_number`, `from_address`, `to_address`, `amount`, `method_name`, `event_data` (JSON string).
7. **`audit_logs`**:
   - `id` (PK), `user_id` (FK), `action`, `details`, `timestamp`.
8. **`otp_verifications`**:
   - `id` (PK), `phone_number` (Unique), `otp_code` (6 digits), `expires_at`.

### B. Core REST API Endpoints

#### Auth Blueprint (`/api/auth`)
* `POST /send-otp` $\rightarrow$ Generates 6-digit random phone OTP, saves to DB with 5-min expiry, enforces 60-second cooldown (HTTP 429 on spam), dispatches via the basic-auth `_send_sms_gate()` Android API helper, or falls back to a dev terminal log.
* `POST /send-email-otp` $\rightarrow$ Generates 6-digit random email verification code, saves to DB with 5-min expiry, dispatches HTML verification email via async SMTP client, or prints to terminal in dev mode.
* `POST /register` $\rightarrow$ Validates registration inputs (restricted to FARMER, TESTER, CONSUMER, INVESTOR), verifies either Email OTP or SMS OTP according to chosen `otp_method` ('email' or 'sms') passed in payload, hashes password, creates user profile.
* `POST /login` $\rightarrow$ Authenticates user credentials, logs login event, generates a JWT token containing `id` and `role` claims.
* `GET /profile` $\rightarrow$ Decodes JWT token and returns user details.
* `POST /change-password` $\rightarrow$ Allows authenticated users to change their password (clears `must_change_password` flag).
* `POST /link-wallet` $\rightarrow$ Verifies MetaMask signature ownership using cryptographic recover message (`personal_sign` signature and email verification text matching) before saving the address. Changes Inspector status to `ACTIVE`.

#### Admin Blueprint (`/api/admin`)
* `POST /create-inspector` $\rightarrow$ Allows Admins to create new inspectors, generates a temporary password, and sends an notification email.
* `GET /users` $\rightarrow$ Lists all users in the system.
* `POST /approve-user/<id>` $\rightarrow$ Admin approves user profile.
* `GET /audit-logs` $\rightarrow$ Fetches recent audit logs.

#### Farmer Blueprint (`/api/farmer`)
* `POST /register` $\rightarrow$ Registers new cultivation with District, Taluk (Sub-District), and Village parameters. Assigns verifiers using Kerala Priority Assignment matching: Priority 1 (same Taluk), Priority 2 (same District), Priority 3 (any active DISTRICT-level inspector). Only active inspectors receive assignments.
* `GET /my-crops` $\rightarrow$ Lists authenticated farmer's crops.
* `GET /all-crops` $\rightarrow$ Publicly lists all crop projects.
* `GET /<id>` $\rightarrow$ Retrieves detailed specifications of a specific crop.
* `POST /update-timeline/<id>` $\rightarrow$ Restricts manual timeline updates. Validates timeline status shifts (`READY_TO_HARVEST`, `HARVEST_COMPLETED`).

#### Quality Blueprint (`/api/quality`)
* `POST /approve/<id>` $\rightarrow$ Inspector/Admin approves crop on-chain using MetaMask, logging `inspection_notes` and `inspection_method`.
* `POST /reject/<id>` $\rightarrow$ Inspector/Admin rejects crop registration, loggingremarks.
* `POST /save-notes/<id>` $\rightarrow$ Inspector/Admin saves detailed inspection notes and method (`PHYSICAL_VISIT`, `PHOTO_REVIEW`, `HYBRID`) directly to the DB without MetaMask.
* `GET /pending` $\rightarrow$ Retrieves list of unapproved crop listings assigned to the verifier.

#### Product Blueprint (`/api/product`)
* `POST /register` $\rightarrow$ Registers Product lot, sets pricing, dates, and automatically updates the parent crop timeline to `PRODUCT_AVAILABLE`.
* `GET /all` $\rightarrow$ Lists all certified product lots.
* `GET /<lot_number>` $\rightarrow$ Fetches quality grade details for a specific lot.

#### Finance Blueprint (`/api/finance`)
* `POST /invest` $\rightarrow$ Investor submits proposal containing proposed price, returns, terms, and messages.
* `GET /my-investments` $\rightarrow$ Lists all investments submitted by the investor. (Uses correct RBAC decorators to avoid context errors).
* `GET /received-proposals` $\rightarrow$ Farmer retrieves proposals submitted for their crops.
* `POST /update-status/<id>` $\rightarrow$ Farmer accepts proposal, setting status to `ACCEPTED` and automatically updating crop timeline to `FUNDING_COMPLETED`.
* `POST /cancel/<id>` $\rightarrow$ Cancels a pending investment/LOI proposal, removing it from the database and logging a `INVESTMENT_CANCELLED` audit log. Restricted to the authoring investor or administrator.

#### Rating Blueprint (`/api/rating`)
* `POST /add` $\rightarrow$ Logs consumer review comment and reliability scores.
* `GET /farmer/<id>` $\rightarrow$ Calculates average scores and issues credibility badges (`Gold Premium Certified` for $\ge 4.5$).

#### Explorer Blueprint (`/api/explorer`)
* `POST /log-tx` $\rightarrow$ Indexes a new transaction on the off-chain explorer registry.
* `GET /transactions` $\rightarrow$ Lists recently mined actions.
* `GET /tx/<hash>` $\rightarrow$ Returns solidity events parameters and values.
* `GET /server-ip` $\rightarrow$ Dynamically determines the local IP address of the Flask server machine to build mobile-friendly QR routing paths.

---

## 5. Frontend Pages & Routing System

Managed via React Router inside `Frontend/src/App.jsx`.

### Navigation Pages
1. **Landing Page (`/`)** *(Updated: June 30, 2026)*: Main presentation dashboard with active system counters and metrics. Features a responsive gradient backdrop overlay behind the hero text to guarantee contrast readability against the leaf background image. Optimized scrolling with passive event listeners and fixed background positioning. Roles are showcased in a premium bento grid of informational cards styled with spotlight glows, micro-pattern dot layers, and hover transition arrows.
2. **Login/Signup (`/login`, `/register`)** *(Updated: June 24, 2026)*: Signup role selection has `INSPECTOR` role removed. Enforces dual OTP verification (SMS OTP + Email OTP) with toggleable input panels and dev fallback outputs.
3. **Control Dashboard (`/dashboard`)** *(Updated: June 30, 2026)*: Role-specific consoles with notification badges, proposal counters, and custom live stats widgets (displays Committed Capital for Investors, Certificates Issued for Testers, and Verified Crops for Inspectors).
   - **For Inspectors**: Blocks page with a fullscreen **First Login Change Password Modal** if `must_change_password` is enabled. Shows a **MetaMask Wallet Connection Card** requiring inspectors to connect their wallet and sign a verification message to activate their account (transitioning status from `PENDING_SETUP` to `ACTIVE`).
   - **For Admins**: Features a **Create Inspector Account** card in the Operations Console grid, launching a beautiful pop-up modal to onboard field verifiers directly.
4. **My Crops Directory (`/farmer/crops` - `CropHistory.jsx`)** *(Updated: June 30, 2026)*: The primary farmer document hub. Allows updating timelines, displays visual loading skeletons, and exposes action modals for printing or downloading PDF letters and certificates with dynamic QR codes.
5. **Investor LOI Tracking (`/investor/lois` - `SubmittedLOIs.jsx`)** *(Updated: June 30, 2026)*: Dedicated portal for investors to track submitted proposals. Supports proposal cancellation (deletes proposal, logs `INVESTMENT_CANCELLED` audit trail) and provides PDF Letter of Intent generation.
6. **Funding Page (`/finance`)** *(Updated: June 30, 2026)*: Active product lot grid where investors submit LOI proposals, track funding, and lock/transfer ETH escrow tokens. Uses visual marketplace skeletons during data retrieval.
7. **Consumer Tracking (`/consumer/track`)** *(Updated: June 27, 2026)*: Public directory listing all farmers and crops. Tapping cards loads provenance milestones, GPS map coordinates, and allows consumers to log reviews.
8. **Redesigned Explorer Portal (`/explorer` - `BlockchainExplorer.jsx`)** *(Updated: June 27, 2026)*: Toggled lookup panel (Crop ID / Lot number) featuring an integrated HTML5-based camera QR Code scanner (`QrScannerModal.jsx`) and dynamic local server IP resolution.
9. **Quality Testing (`/tester/approve` - `QualityTesting.jsx`)** *(Updated: June 30, 2026)*: Pending verification queue for Inspectors and Testers. Inspector panel renders District, Taluk, Village, and separate links for Evidence Documents. Features Inspection Method dropdown, Remarks input, a **Save Notes (No MetaMask)** action button, and custom table skeletons.
10. **Admin Console (`/admin` - `AdminDashboard.jsx`)** *(Updated: June 11, 2026, 01:00 AM)*: Central system analytics and audit logs. Oversees registered users list, approves user authorities, and displays system-level analytical charts.
11. **Create Inspector Modal Trigger** *(Updated: June 11, 2026, 01:10 AM)*: Integrated directly into the **Operations Console** on the main [Dashboard.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/Dashboard.jsx) page, allowing administrators to onboard field inspectors, set jurisdictions, and generate credentials.

### D. Styling & Aesthetic Guardrails (Tailwind CSS)
To maintain the platform's premium design aesthetic and prevent elements (like buttons and badges) from rendering invisibly:
* **Standard Tailwind Weights Only**: Avoid using invalid/non-standard Tailwind color weights (e.g., `emerald-650`, `slate-650`, `purple-650`, `slate-955`). Always use standard weights (`50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`, `950`).
* **Active Theme Support**: Ensure colors resolve properly in both light and dark modes (using the `.dark` class prefix).

---

## 6. Developer Operational Setup

### Setup Commands Checklist

1. **Terminal 1: Spin up local blockchain node**
   ```bash
   cd Blockchain
   npm install
   npx hardhat node
   ```
   *Note: This starts a local RPC server at `http://127.0.0.1:8545` and prints 20 pre-funded test accounts.*

2. **Terminal 2: Deploy smart contracts**
   ```bash
   cd Blockchain
   npx hardhat run scripts/deploy.js --network localhost
   ```
   *Note: This automatically deploys the contracts and exports the compiled contract addresses and ABIs to the `Frontend/` and `Backend/` settings folders.*

3. **Terminal 3: Setup virtual environment, seed database, and run Flask**
   ```bash
   cd Backend
   copy .env.example .env
   pip install -r requirements.txt
   py seed.py --reset
   py app.py
   ```
   *Note: Backend server runs at `http://127.0.0.1:5000`.*

4. **Terminal 4: Start Frontend Vite Server**
   ```bash
   cd Frontend
   npm install
   npm run dev
   ```
   *Note: Local server runs at `http://localhost:3000` (or falls back to `http://localhost:3001` if port 3000 is occupied).*

### MetaMask Wallet Setup
1. Click the MetaMask extension in the browser.
2. Go to Settings $\rightarrow$ Networks $\rightarrow$ Add Network $\rightarrow$ Add a Network Manually:
   - **Network Name**: Hardhat Localhost
   - **RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
3. Import private keys printed in the Hardhat Terminal node startup log:
   - Account #0 $\rightarrow$ Dr. Anita (Tester)
   - Account #1 $\rightarrow$ Rajesh Patel (Farmer)
   - Account #2 $\rightarrow$ Amit Kumar (Consumer)
   - Account #3 $\rightarrow$ Suresh Mehta (Investor)

---

## 7. Security & Credential Management Guidelines

To ensure the safety and integrity of the AgroChain project, all developers and AI agents must adhere to the following credential management rules:
1. **No Hardcoded Secrets**: Never hardcode secret keys, API tokens, database passwords, or private keys directly into the source code (`.py`, `.js`, `.jsx`, etc.).
2. **Environment Variables**: Always use `.env` files for storing sensitive credentials. Ensure that `python-dotenv` or Vite's `import.meta.env` mechanisms are used to load them.
3. **Never Commit Secrets**: Ensure that `.env` is always included in the `.gitignore` file. Only `.env.example` should be committed to the repository, containing dummy or placeholder values.
4. **Secure Defaults**: If a new service requires a credential, fall back to secure default handling (e.g., throwing an error if the secret is missing, rather than defaulting to a publicly known "test" secret in production).
5. **Private Key Handling**: Ethereum private keys used for deployment or testing must only reside in secure environment variables or local node memory (like Hardhat's default test accounts), never pushed to version control.

---

## 8. Codebase Directory & File Breakdown

Here is a comprehensive index of all key files in the AgroChain workspace:

### A. Root Configurations & Scripts
* [.gitignore](file:///c:/MY%20PROJECTS/AgroChain-Morden/.gitignore): Specifies files to be ignored by Git (e.g., node_modules, Python virtual environments, SQLite databases, and `.env` credentials).
* [README.md](file:///c:/MY%20PROJECTS/AgroChain-Morden/README.md): Primary developer setup documentation.
* [walkthrough.md](file:///c:/MY%20PROJECTS/AgroChain-Morden/walkthrough.md): Comprehensive system walkthrough showing architecture diagrams, core routes, pages, and validation status checklists.
* [start-presentation.bat](file:///c:/MY%20PROJECTS/AgroChain-Morden/start-presentation.bat): Windows batch script that automates running the local Hardhat node, deploying smart contracts, running the Flask API server, and launching the Vite web app in parallel.

### B. Blockchain Network Component (`Blockchain/`)
* [Blockchain/contracts/FarmerRegistry.sol](file:///c:/MY%20PROJECTS/AgroChain-Morden/Blockchain/contracts/FarmerRegistry.sol): Solidity contract verifying farmer registration details, inspector assignments, and on-chain cultivation validation status.
* [Blockchain/contracts/ProductRegistry.sol](file:///c:/MY%20PROJECTS/AgroChain-Morden/Blockchain/contracts/ProductRegistry.sol): Solidity contract defining the quality certificate registry, laboratory grades, and base prices in Wei.
* [Blockchain/contracts/MicroFinance.sol](file:///c:/MY%20PROJECTS/AgroChain-Morden/Blockchain/contracts/MicroFinance.sol): Solidity contract handling peer-to-peer escrow transfers, investments tracking, and status modifications.
* [Blockchain/contracts/RatingSystem.sol](file:///c:/MY%20PROJECTS/AgroChain-Morden/Blockchain/contracts/RatingSystem.sol): Solidity contract storing user-submitted reviews and computing averaged numeric trust rankings.
* [Blockchain/hardhat.config.js](file:///c:/MY%20PROJECTS/AgroChain-Morden/Blockchain/hardhat.config.js): JavaScript configuration declaring RPC endpoint details and compilation compiler settings.
* [Blockchain/scripts/deploy.js](file:///c:/MY%20PROJECTS/AgroChain-Morden/Blockchain/scripts/deploy.js): Script that compiles Solidity contracts, deploys them to the Localhost node, and updates ABI and address assets in the Frontend/Backend settings.

### C. Backend API Server Component (`Backend/`)
* [Backend/app.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/app.py): Entry script initializing the Flask app factory, configuring CORS rules, registering SQLAlchemy database models, and binding blueprints.
* [Backend/config.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/config.py): Declares database file URIs, upload directories, and JWT access credentials.
* [Backend/models.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/models.py): Declares the SQLite SQLAlchemy database schemas (Users, Farmers, Products, Investments, Ratings, Transactions, Audit Logs, and OTPs).
* [Backend/seed.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/seed.py): Populates the SQLite database with testing credentials, mock inspector/tester profiles, location pins, and dummy registrations.
* [Backend/utils/auth.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/utils/auth.py): Contains JWT session helpers (`generate_token`, `token_required`, `role_required`) to enforce route access.
* **API Routing Blueprints (`Backend/routes/`)**:
  * [Backend/routes/admin.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/admin.py): Serves administrative analytics tables, user approval logs, and system audit trails.
  * [Backend/routes/auth.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/auth.py): Manages OTP codes (via hardened `_send_sms_gate()` SMS helper using the correct SMS Gate API format), profile linkages, and MetaMask addresses.
  * [Backend/routes/explorer.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/explorer.py): Logs mined blockchain hashes and processes transaction search lookups.
  * [Backend/routes/farmer.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/farmer.py): Registers crops, fetches crop lists, and restricts timeline status changes.
  * [Backend/routes/finance.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/finance.py): Connects investor proposals, accepts LOIs, and triggers status changes.
  * [Backend/routes/product.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/product.py): Registers new product lot credentials and references parent crops.
  * [Backend/routes/quality.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/quality.py): Handles inspector/tester verification queues and remarks.
  * [Backend/routes/rating.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/rating.py): Processes walletless rating additions and computes dynamic trust levels.

### D. Frontend React Application (`Frontend/`)
* [Frontend/index.html](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/index.html): Base HTML document layout rendering the root React workspace.
* [Frontend/src/main.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/main.jsx): Root file bootstrap loading components into React DOM.
* [Frontend/src/App.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/App.jsx): Declares the client-side router endpoints and wraps pages in role-based guards.
* [Frontend/src/index.css](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/index.css): Master style sheet detailing Tailwind CSS directives, theme toggles, scrollbars, and printable document media layouts.
* **Context Stores (`Frontend/src/context/`)**:
  * [Frontend/src/context/AuthContext.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/context/AuthContext.jsx): Handles JWT user log-in sessions, verification triggers, and logs credentials to memory.
  * [Frontend/src/context/WalletContext.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/context/WalletContext.jsx): Stores active MetaMask addresses and provides Ethers.js v6 smart contract instances.
  * [Frontend/src/context/LoadingContext.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/context/LoadingContext.jsx): Coordinates a global loading state with a premium translucent blur backdrop overlay and Sprout animation.
  * [Frontend/src/context/ToastContext.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/context/ToastContext.jsx): Manages application notifications and custom toast message feeds.
* **Console Pages (`Frontend/src/pages/`)**:
  * [Frontend/src/pages/LandingPage.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/LandingPage.jsx): Initial presentation page featuring active system counters.
  * [Frontend/src/pages/LoginPage.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/LoginPage.jsx): Sign-in UI supporting password and OTP login forms.
  * [Frontend/src/pages/RegisterPage.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/RegisterPage.jsx): Dynamic signup portal with geographical input parameters and role choices.
  * [Frontend/src/pages/Dashboard.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/Dashboard.jsx): The main hub for all roles, displaying action shortcuts and unread notification badges.
  * [Frontend/src/pages/FarmerRegistration.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/FarmerRegistration.jsx): Registration form for crops (GPS, expected yield, district, land survey).
  * [Frontend/src/pages/CropHistory.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/CropHistory.jsx): Document center for farmers to trace crops, update status, and print letters or certificates.
  * [Frontend/src/pages/QualityTesting.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/QualityTesting.jsx): Queue of pending crops for inspectors/testers.
  * [Frontend/src/pages/ProductRegistration.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/ProductRegistration.jsx): Form for testers to certify crop lots (grade, expiry, price).
  * [Frontend/src/pages/FundingPage.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/FundingPage.jsx): Funding portal listing lots for investors to submit proposals.
  * [Frontend/src/pages/SubmittedLOIs.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/SubmittedLOIs.jsx): Panel for investors to trace LOIs, unlock contacts, and print PDF agreements.
  * [Frontend/src/pages/ConsumerTracking.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/ConsumerTracking.jsx): Directory for tracking crops, map lookup, and walletless ratings.
  * [Frontend/src/pages/BlockchainExplorer.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/BlockchainExplorer.jsx): Decodes block history and parses URL crop/lot queries.
  * [Frontend/src/pages/AdminDashboard.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/AdminDashboard.jsx): Admin portal with audit logs and user validation logs.

### E. Secondary Configurations & Build Files
* [Backend/.env.example](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/.env.example): Blueprint configuration template outlining requirements for keys, database paths, and OTP setups.
* [Backend/requirements.txt](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/requirements.txt): Declares Python dependency packages for running Flask and SQLAlchemy.
* [Backend/contracts/addresses.json](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/contracts/addresses.json) / [Frontend/src/contracts/addresses.json](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/contracts/addresses.json): Stores deployment contract addresses synced by the Hardhat compilation scripts.
* **Solidity ABI compilation files** (e.g. `FarmerRegistry.json`, `MicroFinance.json`, `ProductRegistry.json`, `RatingSystem.json` inside `Backend/contracts/` and `Frontend/src/contracts/`): Contain ABI descriptors mapping JavaScript/Python requests to smart contract methods.
* [Frontend/tailwind.config.js](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/tailwind.config.js): Handles spacing grid layouts, typography defaults, and color palette declarations.
* [Frontend/postcss.config.js](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/postcss.config.js): Integrates Tailwind CSS compilation processes.
* [Frontend/vite.config.js](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/vite.config.js): Coordinates fast HMR compilation parameters and maps API proxy configurations.
* [LICENSE](file:///c:/MY%20PROJECTS/AgroChain-Morden/LICENSE): Open-source license declaration.
* [My Notepad.txt](file:///c:/MY%20PROJECTS/AgroChain-Morden/My%20Notepad.txt): Development scratchpad used for temporary developer notes.

---

## 9. Chronological Change Log

* **June 30, 2026** (Dashboard Analytics, Skeletons & Contrast Optimizations):
  * **Role-Specific Dashboard Stats**: Integrated dynamic widgets in [Dashboard.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/Dashboard.jsx) fetching and rendering live stats: committed capital (Rs) for Investors, certificates issued (count) for Quality Lab Testers, and verified crops (count) for Inspectors.
  * **Vite & Landing Optimizations**: Set Landing Page window scroll listeners to passive (`{ passive: true }`) for improved responsiveness. Applied clip-path layout constraints to the hero backdrop overlay to prevent background rendering glitches.
  * **Obsolete Media Exclusions**: Deleted duplicate video asset `AgroChain How It works.mp4` from the repository root (now consolidated in Frontend public directory) and cleared outdated `.PNG`/`.jpg` images from the `screenshots/` directory.
  * **Pulsed Skeleton Screens**: Replaced the basic inline CSS loading animations with advanced skeleton frameworks (`FundingMarketplaceSkeleton`, `TableSkeleton`, `CropHistorySkeleton`, `DashboardSkeleton`, etc.) in `Skeletons.jsx`.

* **June 27, 2026** (Global Loading Overlay, Camera QR Scanner & LOI Cancellation):
  * **Embedded Camera QR Scanner**: Built [QrScannerModal.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/components/QrScannerModal.jsx) utilizing `html5-qrcode` to scan product lot QR labels via laptop/mobile camera streams, auto-populating lookups.
  * **Global Loading Context**: Developed [LoadingContext.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/context/LoadingContext.jsx) providing a central, premium fullscreen backdrop blur overlay with spinning emerald loaders during authentication transitions and transaction mining.
  * **Proposal Cancellation Route**: Added `POST /api/finance/cancel/<int:investment_id>` in [finance.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/finance.py) to enable investors/admins to discard pending LOIs, logging a `INVESTMENT_CANCELLED` audit log.
  * **Dynamic IP Resolver API**: Implemented a dynamic socket endpoint `GET /api/explorer/server-ip` in [explorer.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/explorer.py) to resolve the backend's local network IP to auto-generate scannable QR codes for mobile network testing.
  * **Toast Notification Context**: Added a global `ToastContext.jsx` that handles toast messages and notification rendering.

* **June 24, 2026** (SMS Gateway Diagnosis & Hardened OTP Dispatch):
  * **Root Cause Diagnosis**: Identified that the SMS gateway (`SMS Gate` Android app at `192.168.1.28:8080`) was failing silently due to two critical bugs: wrong JSON field names (`textMessage.text` instead of `message`) and a broken phone format (`{9895154388}` instead of E.164 `+919895154388`).
  * **Dedicated `_send_sms_gate()` Helper**: Extracted all SMS dispatch logic in [Backend/routes/auth.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/auth.py) into a clean, reusable `_send_sms_gate(url, user, pass, phone_e164, text)` function with 3-layer error handling: `urllib.error.HTTPError` (bad HTTP response from gateway), `urllib.error.URLError` (network unreachable / phone offline), and `Exception` (catch-all with full detail).
  * **Correct SMS Gate API Payload**: Fixed JSON body to match the official SMS Gate Android API spec: `{ "message": "...", "phoneNumbers": ["+91XXXXXXXXXX"] }` with proper E.164 phone format and `Basic Auth` header.
  * **Hardened Phone Normalisation**: Updated the `send_otp` route to accept all Indian phone number variants: `9895...` (10-digit), `09895...` (11-digit with leading 0), `919895...` (12-digit with country code), and `+919895...` (13-digit E.164). Added first-digit validation (must start with 6, 7, 8, or 9 per Indian telecom regulations).
  * **60-Second OTP Rate-Limit**: Added a cooldown check in `send_otp` — if an OTP was issued within the last 60 seconds (i.e. `expires_at > now + 4 minutes`), the endpoint returns HTTP 429 to prevent OTP spam.
  * **Cleaner Config Handling**: Added `.strip()` to SMS URL, username, and password reads from `current_app.config` to prevent silent failures caused by trailing whitespace in `.env` values.

* **June 22, 2026** (Roles Bento Grid Redesign, Contrast fixes, SMS Gateway & Floating Navbars):
  * **Hero Contrast Backdrop**: Added a responsive gradient overlay and updated hero text classes (`text-slate-700 dark:text-slate-200 font-medium`), trust badges (`text-slate-700 dark:text-slate-300`), and the secondary marketplace button to resolve text readability issues over the agricultural leafy background image.
  * **Static Bento Cards**: Converted the roles grid items in [LandingPage.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/LandingPage.jsx) from Router `Link` components to standard `div` containers to prevent browser redirection on click.
  * **Visual Bento Styling**: Styled cards with custom color-coded spotlight glows on hover, a subtle dot grid overlay (`.card-dots`), colored context badges (e.g. Production, Quality Control), card lift hover translations, and interactive transition arrow CTAs.
  * **SMS Gateway Configuration**: Setup backend credentials (`SMS_GATEWAY_URL`, `SMS_GATEWAY_USER`, and `SMS_GATEWAY_PASSWORD`) in [Backend/.env](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/.env) to connect local SMS gateways for OTP code delivery.
  * **Floating Navigation Bars**: Converted default headers to premium floating navigation bars in both [LandingPage.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/LandingPage.jsx) and [App.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/App.jsx). Shifted padding-top properties from the main wrapper to individual content sections to prevent any white gap rendering behind the translucent floating navbar.
  * **Agricultural Hero Background**: Configured and applied a sharp agricultural backdrop overlay (`hero_background.png`) behind the hero text columns.
  * **Corrected Lifecycle Timeline**: Updated the "How it works" timeline steps to accurately portray the real platform roles workflow: Farmer Registration, Inspector Verification, Lab Certification, Direct Funding, and Consumer Tracing.
  * **Cultivation Date Validation**: Integrated frontend validation (restricting HTML date picker `max` limit and verifying inside `handleSubmit` in [FarmerRegistration.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/FarmerRegistration.jsx)) and backend validation inside `/register` in [farmer.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/farmer.py) to prevent farmers from entering future cultivation start dates.
  * **Clean Database Utility**: Created [clear_db.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/clear_db.py) to drop all SQLite tables and recreate them from scratch, seeding only the default System Administrator account (`admin@gmail.com` / `test@123`) to prepare a completely clean testing environment.
  * **Dynamic Location Dropdowns**: Converted the District, Taluk (Sub-District), and Village text inputs in [FarmerRegistration.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/FarmerRegistration.jsx) into dynamic, interdependent select dropdowns mapped to Kerala location metadata.
  * **Interactive Map Coordinates Selection**: Replaced the manual text inputs for GPS Latitude/Longitude and the simulation auto-detect button with an interactive OpenStreetMap Leaflet map. Enabled drag-and-drop marker placement, district-selection dynamic panning, and form coordinates validation.
  * **Base64 Evidence Uploads**: Replaced simulated/mock URLs for photos and documents in [FarmerRegistration.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/FarmerRegistration.jsx) with HTML5 `FileReader` base64 data URLs to store actual uploaded files in the SQLite database and display true previews.
  * **MIME-Type Document Labels**: Added `getFileTypeLabel` helper in [FarmerRegistration.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/FarmerRegistration.jsx) and [QualityTesting.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/QualityTesting.jsx) to dynamically show document types (e.g., PDF, Image, Word, Excel, ZIP) based on the uploaded file's base64 MIME-type.
  * **Full 14 Kerala Districts Selection & exact 77 Taluks**: Extended `KERALA_LOCATIONS` and `DISTRICT_COORDINATES` in [FarmerRegistration.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/FarmerRegistration.jsx) to include all 14 districts of Kerala, along with the exact 77 administrative taluks specified in Wikipedia, complete with representative villages and map center coordinates.
  * **Map Search, Toggles & Precise Auto-Centering**: Integrated OpenStreetMap Nominatim geocoding in [FarmerRegistration.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/FarmerRegistration.jsx) to automatically pan/zoom the Leaflet map when any District, Taluk, or Village is selected. Added a location search input above the map, integrated an Esri Satellite View tile layer toggle control, and customized precise zoom levels (up to zoom 17 for specific searches) for precise location pin placement.
  * **Reverse Geocoding Auto-Fill**: Implemented OpenStreetMap Nominatim reverse geocoding in [FarmerRegistration.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/FarmerRegistration.jsx) to automatically resolve coordinates into textual addresses and populate the "Farm Location Address in words" field whenever the marker is placed or dragged on the map.
  * **Farm Address Label Renaming**: Renamed the label from "Farm Location Address" to "Farm Location Address in words" in [FarmerRegistration.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/FarmerRegistration.jsx) for improved clarity.
  * **Compilation**: Verified and completed the frontend production build with zero errors.

* **June 12, 2026** (Quality Lab Tester Model & Onboarding Flow):
  * **Private Lab self-registration**: Extended registration forms to allow Quality Labs (`TESTER`) to input lab name, license number, accreditation details, and upload credentials.
  * **Pending Approval state**: New tester accounts default to `PENDING_APPROVAL` and `is_approved = False`.
  * **Admin Credentials Review Modal**: Added a detailed pop-up modal to the Admin Dashboard to review all registration credentials and documents.
  * **Active Tester check**: Restricted crop assignment routing to only Quality Labs that have been approved by the Admin and are in `ACTIVE` status.
  * **MetaMask Warnings**: Added warning cards to the Quality Lab dashboard to alert testers if their MetaMask wallets are not connected or linked.
  * **MetaMask Setup Help**: Added a toggleable, non-technical setup guide inside the wallet connection section on [RegisterPage.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/RegisterPage.jsx) explaining how to set up MetaMask as a digital signature card on `agroblock.in`.
  * **Notice Modal & Form Flow**: Added a signup warning notice modal when "Quality Lab" is selected from the role dropdown, and updated the signup button label to dynamically say "Apply for Quality Lab Account".
  * **Automated Email Notifications**: Configured `/approve-user/<int:user_id>` in [admin.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/admin.py) to automatically send a welcome email to the tester when the administrator approves their application, detailing how to log in with their credentials.
  * **Strict Terms & Conditions**: Built [TermsPage.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/TermsPage.jsx) and registered `/terms` route in [App.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/App.jsx). Added a required terms consent checkbox for the Quality Lab signup flow.

* **June 11, 2026** (Inspector Restructure & Kerala Assignment Model):
  * **Admin-Only Inspector Creation**: Disabled public signups for inspectors. Added an admin-only creation panel in [AdminDashboard.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/AdminDashboard.jsx) and backend routes.
  * **Password Setup & Reset**: Implemented forced password reset modal on first login for inspectors in [Dashboard.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/Dashboard.jsx).
  * **MetaMask Signature verification**: Updated backend and frontend linking flows to require cryptographically verifying a signed verification message (`personal_sign` signature) to activate inspector status to `ACTIVE`.
  * **Kerala Location Hierarchy**: Replaced geodesic calculations with priority routing (Priority 1: same Taluk/Sub-District, Priority 2: same District, Priority 3: any active DISTRICT-level inspector). Only active inspectors receive assignments.
  * **Separate Evidence & Notes Saving**: Split evidence storage into photos and documents in [FarmerRegistration.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/FarmerRegistration.jsx) and [QualityTesting.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/QualityTesting.jsx). Added "Save Notes (No MetaMask)" option for inspectors to save detailed notes and inspection methods.

* **June 8, 2026** (Dashboard & Navigation refinement):
  * **Unified Badging**: Added real-time notification badges and clear button alerts based on `localStorage` caches in [Dashboard.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/Dashboard.jsx).
  * **LOI Redirection & Banning**: Updated [FundingPage.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/FundingPage.jsx) with warning banners for non-investor roles and added "Resend LOI / Propose New Terms" button workflows.
  * **Styling Guardrails**: Standardized CSS color weights across [SubmittedLOIs.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/SubmittedLOIs.jsx) and [ConsumerTracking.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/ConsumerTracking.jsx) to align with Tailwind standards.
  * **Quality Lab Certification Queue**: Enabled the **Pending Approvals** card and queue for the `TESTER` role (Quality Lab) in [Dashboard.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/Dashboard.jsx) and [QualityTesting.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/QualityTesting.jsx). Integrated Inspector Approval Letter viewing, one-click automated **Approve & Certify Crop** on-chain transactions, and Batch Quality Certificate printing/downloads.
  * **Project Memory Expansion**: Documented the complete project layout and directory files breakdown in [memory.md](file:///c:/MY%20PROJECTS/AgroChain-Morden/memory.md).

* **June 7, 2026** (LOI Portal, Document Center & Database Extensions):
  * **Submitted LOI Tracking**: Added [SubmittedLOIs.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/SubmittedLOIs.jsx) for investors to monitor and filter sent proposals.
  * **Printer Layouts**: Designed printable modals and generated PDF layouts for [CropHistory.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/CropHistory.jsx) using `html2pdf.js` with forced light-mode formatting.
  * **Geographical DB Schemas**: Expanded [models.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/models.py) database schemas with `district`, `pin_code`, and `coverage_pins`.
  * **Geographical Assignment API**: Added assignment checks to [auth.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/auth.py), [farmer.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/farmer.py), [quality.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/routes/quality.py) and expanded [seed.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/seed.py) to automatically map nearest verifiers on register.

* **June 6, 2026** (Microfinance Escrow & Ratings Smart Contracts):
  * **MicroFinance Escrow**: Created and deployed [MicroFinance.sol](file:///c:/MY%20PROJECTS/AgroChain-Morden/Blockchain/contracts/MicroFinance.sol) to lock and distribute Ethereum funding tokens to farmers.
  * **Decentralized Reviews**: Created and deployed [RatingSystem.sol](file:///c:/MY%20PROJECTS/AgroChain-Morden/Blockchain/contracts/RatingSystem.sol) to store consumer ratings and calculate scaled average trust scores.
  * **MetaMask Context**: Implemented contract instance bindings in [WalletContext.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/context/WalletContext.jsx).

* **June 3, 2026** (Product Registry Smart Contract & Auth Flow):
  * **Quality Certification Contract**: Built [ProductRegistry.sol](file:///c:/MY%20PROJECTS/AgroChain-Morden/Blockchain/contracts/ProductRegistry.sol) to register laboratory grades on-chain.
  * **Security Tokenization**: Implemented backend JWT generation and decorator check guards in [auth.py](file:///c:/MY%20PROJECTS/AgroChain-Morden/Backend/utils/auth.py).
  * **Client Authentication**: Implemented login interfaces in [LoginPage.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/LoginPage.jsx) and [AuthContext.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/context/AuthContext.jsx).

* **May 30, 2026** (Landing Page & Presentation Layout):
  * **UI Landing Page**: Created [LandingPage.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/LandingPage.jsx) featuring platform stats grids and animations.

* **May 27, 2026** (Automation scripts):
  * **Orchestration Batch Script**: Created [start-presentation.bat](file:///c:/MY%20PROJECTS/AgroChain-Morden/start-presentation.bat) to launch the four system servers in parallel console processes.

* **May 25, 2026** (Initial Repository Structure):
  * **Baseline Setup**: Configured directories, seeded database connections, created [README.md](file:///c:/MY%20PROJECTS/AgroChain-Morden/README.md), and set up the consumer directories [ConsumerTracking.jsx](file:///c:/MY%20PROJECTS/AgroChain-Morden/Frontend/src/pages/ConsumerTracking.jsx).

---

## 10. Future Roadmap & Scope (UX Enhancements)

For future scale-up and enhancement of the platform's user experience (particularly to reduce the barrier to entry for rural farmers), the following architecture is proposed:

### A. Unified Web2 Social Authentication for Farmers
*   **Google OAuth2 Integration**: In place of MetaMask wallets, Farmers register or log in with one-click **Google Sign-In** or SMS-based OTP verification.
*   **Familiar UI**: Removes Web3 client requirements (browser extensions, gas management, and seed phrase recovery) for non-technical users.

### B. Auto-Generating Wallets (Embedded Web3)
*   **SDK Integrations**: Implement services like **Privy**, **Web3Auth**, or **Magic Link** to derive an Ethereum wallet address securely in the background upon Google OAuth login.
*   **Invisible Custody**: The derived address is saved to the user's `wallet_address` column. Farmers never see key phrases or sign contract transactions, but are fully equipped to receive micro-finance escrow payments directly on-chain.

### C. Automatic Fiat Off-Ramp
*   **Stripe / Transak Integrations**: Provide a one-click `"Withdraw to Bank"` button that automatically initiates a fiat off-ramp (converting received ETH to local currency, e.g., INR) and transfers it directly to their bank account.
