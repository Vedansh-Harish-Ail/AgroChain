# AgroChain (Modernized) — Complete Project Memory

This document is the master documentation of the **AgroChain** (Modernized) project. It contains a detailed breakdown of the project’s purpose, features, security models, data structures, backend routes, contract details, frontend screens, and step-by-step developer checklists.

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

1. **System Administrator (`ADMIN`)**:
   - Oversees the entire ecosystem, approves pending user registration accounts, and monitors the overall system health.
   - Features the **System Audit Trail** showing all backend operations, with auto-parsed transaction hashes and crop/lot IDs that link directly to the lookup explorer.
   - Displays system analytics (total farmers, testers, consumers, dedicated investors, crop category distributions, and fraud alerts).

2. **Farmer (`FARMER`)**:
   - Registers crop cultivations by entering expected yields, locations, farm sizes, crop types, land survey numbers, GPS coordinates, and uploading evidence photos.
   - Manages crop lifecycles through a restricted timeline status.
   - Reviews Letters of Intent (proposals) submitted by investors and accepts/declines them.
   - Accesses the **Farmer Document Center** to view and print official crop approval letters and certified batch certificates containing dynamic QR codes.

3. **Agricultural Inspector (`INSPECTOR`)**:
   - Assigned to specific crops based on their geographic location (district and pin code).
   - Accesses the Pending Inspection Queue showing crop registrations in their assigned region that need checking.
   - Inspects the farmer's land deeds, coordinates, and soil metrics. Approves or rejects crop registrations, recording audit dates, signatures, and verifier remarks. Requires MetaMask for signing verifications.

4. **Quality Tester / Lab (`TESTER`)**:
   - Assigned to specific verified crops based on their geographic location (district and pin code).
   - Issues **Product Quality Certificates** for harvested crops after conducting scientific tests, specifying quality grades (e.g., `Grade A+`, `Grade A`) and setting the listing price and expiry dates. Requires MetaMask for signing certificates.

5. **Dedicated Investor (`INVESTOR`)**:
   - Logs in to explore verified, active crop listings seeking funding.
   - Submits formal micro-finance proposals (proposing funding amounts in Rupees, return yield margins, and terms).
   - Locks and transfers funds (test ETH) directly to the farmer's MetaMask wallet using the `MicroFinance.sol` smart contract escrow mechanism.

6. **Consumer / Retail Buyer (`CONSUMER` / Legacy Role)**:
   - Explores the public agricultural supply chain directory without needing to log in.
   - Traces crop provenance (GPS coordinates, map links, testing dates, and timeline steps).
   - Logs in to submit reviews and trust ratings (evaluating reliability, quality, and delivery satisfaction). Supports walletless Web2 interactions, where ratings are logged in the database if a MetaMask wallet is not connected, but verified on-chain if connected.

### B. High-Fidelity Lookup Portal & QR Link
* **Explorer Redesign (`/explorer`)**: Replaced raw, tech-heavy blockchain transaction indexes with a dual-tab lookup interface (Crop Cultivation ID vs. Product Lot Number) displaying clean certificates.
* **Redirection query parsing**: The explorer parses browser search query parameters on mount (e.g., `?lot=1001` or `?crop=2`). 
* **Physical Packaging QR Code**: Testers generate a Product Lot Number that is encoded into a QR Code. When printed and stuck on a crop bag, scanning the QR code redirects the consumer directly to the explorer page, auto-filling and loading the lot details.

### C. Printable Modals & Printer CSS
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
   - `id` (PK), `name`, `email` (Unique), `phone_number` (Unique), `password_hash`, `role` (`ADMIN`, `FARMER`, `INSPECTOR`, `TESTER`, `CONSUMER`, `INVESTOR`), `wallet_address`, `is_approved`, `is_verified_farmer`, `government_id`, `ownership_proof_url`, `district`, `pin_code`.
2. **`farmers`**:
   - `id` (PK), `user_id` (FK $\rightarrow$ `users`), `farm_location`, `farm_size`, `farming_type`, `crop_type`, `expected_yield`, `cultivation_date`, `tx_hash`, `block_number`, `blockchain_status` (`DB_ONLY`, `VERIFIED`), `is_approved`, `timeline_status`, `land_survey_no`, `gps_latitude`, `gps_longitude`, `evidence_photos` (JSON list), `verification_status` (`PENDING`, `VERIFIED`, `REJECTED`), `tester_remarks`, `assigned_inspector_id` (FK), `assigned_tester_id` (FK), `tester_id` (FK), `verification_date`, `farm_address`, `district`, `pin_code`.
3. **`products`**:
   - `lot_number` (PK), `farmer_id` (FK $\rightarrow$ `farmers`), `crop_name`, `quality_grade`, `price` (BigInt Wei), `test_date`, `expiry_date`, `certification_status` (`APPROVED`, `REJECTED`), `tx_hash`, `block_number`, `timestamp`.
4. **`investments`**:
   - `id` (PK), `investor_id` (FK $\rightarrow$ `users`), `farmer_id` (FK $\rightarrow$ `farmers`), `lot_number` (FK $\rightarrow$ `products`), `amount` (Rs. value proposal), `tx_hash`, `block_number`, `profit_percentage`, `status` (`PENDING`, `ACCEPTED`, `DECLINED`), `terms`, `message`, `timestamp`.
5. **`ratings`**:
   - `id` (PK), `consumer_id` (FK), `farmer_id` (FK), `lot_number` (FK), `reliability`, `product_quality`, `delivery_satisfaction`, `comment`, `tx_hash`, `block_number`, `timestamp`.
6. **`transactions`**:
   - `id` (PK), `tx_hash` (Unique), `block_number`, `from_address`, `to_address`, `amount`, `method_name`, `event_data` (JSON string).
7. **`audit_logs`**:
   - `id` (PK), `user_id` (FK), `action`, `details`, `timestamp`.
8. **`otp_verifications`**:
   - `id` (PK), `phone_number` (Unique), `otp_code` (6 digits), `expires_at`.

### B. Core REST API Endpoints

#### Auth Blueprint (`/api/auth`)
* `POST /send-otp` $\rightarrow$ Generates 6-digit random code, saves to DB with 5 min expiry, triggers SMS Gateway or fallback dev log.
* `POST /register` $\rightarrow$ Validates registration inputs, verifies phone number against OTP, hashes password using `scrypt`, creates User profile.
* `POST /login` $\rightarrow$ Authenticates user credentials, logs login event, generates a JWT token containing `id` and `role` claims.
* `GET /profile` $\rightarrow$ Decodes JWT token and returns user details.
* `POST /link-wallet` $\rightarrow$ Links MetaMask public address to User account.

#### Farmer Blueprint (`/api/farmer`)
* `POST /register` $\rightarrow$ Registers new cultivation and records audit log.
* `GET /my-crops` $\rightarrow$ Lists authenticated farmer's crops.
* `GET /all-crops` $\rightarrow$ Publicly lists all crop projects.
* `GET /<id>` $\rightarrow$ Retrieves detailed specifications of a specific crop.
* `POST /update-timeline/<id>` $\rightarrow$ Restricts manual timeline updates. Validates timeline status shifts (`READY_TO_HARVEST`, `HARVEST_COMPLETED`).

#### Quality Blueprint (`/api/quality`)
* `POST /approve/<id>` $\rightarrow$ Tester marks crop approved, sets `verification_status = 'VERIFIED'`, sets Remarks, coordinates, and advances timeline to `TESTER_APPROVED`.
* `POST /reject/<id>` $\rightarrow$ Tester marks crop `REJECTED`, logging verifier remarks.
* `GET /pending` $\rightarrow$ Retrieves list of unapproved crop listings.

#### Product Blueprint (`/api/product`)
* `POST /register` $\rightarrow$ Registers Product lot, sets pricing, dates, and automatically updates the parent crop timeline to `PRODUCT_AVAILABLE`.
* `GET /all` $\rightarrow$ Lists all certified product lots.
* `GET /<lot_number>` $\rightarrow$ Fetches quality grade details for a specific lot.

#### Finance Blueprint (`/api/finance`)
* `POST /invest` $\rightarrow$ Investor submits proposal containing proposed price, returns, terms, and messages.
* `GET /my-investments` $\rightarrow$ Lists all investments submitted by the investor. (Uses correct RBAC decorators to avoid context errors).
* `GET /received-proposals` $\rightarrow$ Farmer retrieves proposals submitted for their crops.
* `POST /update-status/<id>` $\rightarrow$ Farmer accepts proposal, setting status to `ACCEPTED` and automatically updating crop timeline to `FUNDING_COMPLETED`.

#### Rating Blueprint (`/api/rating`)
* `POST /add` $\rightarrow$ Logs consumer review comment and reliability scores.
* `GET /farmer/<id>` $\rightarrow$ Calculates average scores and issues credibility badges (`Gold Premium Certified` for $\ge 4.5$).

#### Explorer Blueprint (`/api/explorer`)
* `POST /log-tx` $\rightarrow$ Indexes a new transaction on the off-chain explorer registry.
* `GET /transactions` $\rightarrow$ Lists recently mined actions.
* `GET /tx/<hash>` $\rightarrow$ Returns solidity events parameters and values.

---

## 5. Frontend Pages & Routing System

Managed via React Router inside `Frontend/src/App.jsx`.

### Navigation Pages
1. **Landing Page (`/`)**: Main presentation dashboard, display metrics, role explanations.
2. **Login/Signup (`/login`, `/register`)**: OTP request fields, role selection dropdowns, MetaMask wallet link tools.
3. **Control Dashboard (`/dashboard`)**: Role-specific options with real-time notification badges using `localStorage` cache validation:
   - *Farmers*: Received micro-finance proposals (badges for new incoming LOIs), link wallets, shortcuts to register crops and view crop lists (badges for crop verification status updates).
   - *Testers*: Shortcuts to check pending crops (badges for new registrations) and certify harvested crop batches (badges for verified crops awaiting certification).
   - *Investors*: Track Submitted LOIs (badges for accepted/declined proposals).
   - *Admins*: Full analytics panel (metrics grids, logs console, user list table).
4. **My Crops Directory (`/farmer/crops` - `CropHistory.jsx`)**: The primary farmer document hub. Allows updating timelines and displays action modals:
   - **View Approval Letter**: Printable modal showing verifier sign-offs and coordinates.
   - **Print Certificate & QR**: Renders batch quality certificates containing a dynamic QR Code image linking to the explorer.
   - *Note: Both documents support direct PDF downloads using `html2pdf.js` with a forced light-mode configuration for clean, ink-saving printing.*
5. **Investor LOI Tracking (`/investor/lois` - `SubmittedLOIs.jsx`)**: Dedicated portal for investors to track all their submitted proposals. Features status-based filter tabs (Accepted, Pending, Rejected), displays unlocked farmer contact info, and allows generating formal PDF Letter of Intent agreements.
5. Funding Page (`/finance`): Active product lot grid where investors click cards, view target funding amounts, submit terms, connect wallets, and trigger ETH transfers. Restricted to the `INVESTOR` role for submitting LOIs. Features dynamic `"LOI Sent (Status)"` status badges on cards and transitions the button option to `"Resend LOI / Propose New Terms"` to allow resending updated proposals.
6. **Consumer Tracking (`/consumer/track`)**: Public directory listing all farmers and crops. Tapping cards loads provenance milestones, GPS map coordinates, and allows consumers to log reviews.
7. **Redesigned Explorer Portal (`/explorer` - `BlockchainExplorer.jsx`)**: Toggled lookup panel (Crop ID / Lot number) which also decodes URL parameter scans (`?lot=1001` or `?crop=1`).

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
