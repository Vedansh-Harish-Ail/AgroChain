# AgroChain Platform (Modernized Stack)

AgroChain is a blockchain-based agricultural supply chain and micro-finance platform. It bridges the gap between farmers, consumers, and investors by combining immutable ledger-based traceability with interest-free P2P micro-finance. By eliminating intermediaries, AgroChain ensures direct connections, verified quality, and fair financing.

This repository represents a complete modernization of the original AgroChain architecture, moving from legacy Truffle/Web3.js/Geth configurations to a modern, robust, and performant full-stack ecosystem.
....
---

## 🛠️ Modern Tech Stack

*   **Frontend**: React (Vite), Tailwind CSS (Dark/Light mode support), React Router, Axios, Ethers.js (v6), MetaMask wallet integration, Lucide icons, dynamic camera QR scanner (`html5-qrcode`), and global Loading/Toast Context wrappers.
*   **Backend**: Flask REST API, JWT Authentication with dual Phone/Email OTP, dynamic local IP resolver socket, SQLAlchemy ORM (compatible with SQLite/PostgreSQL), and geographical assignment routers.
*   **Blockchain**: Solidity (v0.8.20+), Hardhat local network, and OpenZeppelin Access Control.
*   **Documentation & Reporting**: `html2pdf.js` integration for standard letterheads and gold-bordered certificates with forced ink-saving print styles.

---

## 🚀 Key Features & Updates

### 👥 1. Role-Based Stakeholder Workflows
The platform implements strict Role-Based Access Control (RBAC) across six stakeholder dashboards:
1.  **System Administrator (`ADMIN`)**:
    *   Oversees user approvals (including verifier credential checks).
    *   Monitors the immutable **System Audit Trail** featuring direct block explorer links.
    *   Visualizes system analytics (active counts, crop distribution, and fraud alerts).
2.  **Farmer (`FARMER`)**:
    *   Registers cultivations (crop types, Expected Yields, GPS coordinates, land survey numbers, and evidence photos).
    *   Manages crop lifecycle states (`PENDING` $\rightarrow$ `READY_TO_HARVEST` $\rightarrow$ `HARVEST_COMPLETED` $\rightarrow$ `PRODUCT_AVAILABLE`).
    *   Verifies signup credentials via dual-factor OTP (SMS + Email OTP).
    *   Reviews investor funding proposals and accepts/declines them.
    *   Accesses the **Document Center** to view and print official certificates.
3.  **Agricultural Inspector (`INSPECTOR`)**:
    *   **Admin-Only Account Creation**: Private signup is disabled; accounts are created exclusively by the Administrator.
    *   **Setup Lifecycle (`PENDING_SETUP` $\rightarrow$ `ACTIVE`)**: Forces a password change on first login and requires connecting MetaMask to sign a cryptographic verification message (`personal_sign`), updating the account status to `ACTIVE`. Only `ACTIVE` inspectors receive assignments.
    *   **Kerala Location Routing Hierarchy**: Automatically assigned crop registrations using a prioritized matching model (Priority 1: same Taluk/Sub-District, Priority 2: same District, Priority 3: DISTRICT-level fallback).
    *   **Comprehensive Auditing**: Renders separate panels for photos and official evidence documents. Supports saving detailed notes and selecting the inspection method (`PHYSICAL_VISIT`, `PHOTO_REVIEW`, `HYBRID`) directly to the database without requiring a MetaMask connection, or approving on-chain.
    *   **Dashboard Stats**: Tracks their count of verified crops.
4.  **Quality Tester / Lab (`TESTER`)**:
    *   **Self-Registration**: Registers via the signup portal, providing details such as lab name, license number, accreditation details, and uploading documents.
    *   **Onboarding Approval**: Account defaults to `PENDING_APPROVAL` status. The Administrator reviews their credentials and approves them to `ACTIVE` status (`is_approved = True`).
    *   **Testing & Certification**: Only `ACTIVE` labs receive crop assignments in their district and PIN code coverage. Conducts scientific testing (moisture, purity, heavy metals, pesticide clearance) and certifies crop batches on-chain (`ProductRegistry.sol`) using MetaMask, setting grades (e.g., `Grade A+`) and listing prices in Wei. Displays warning cards if their MetaMask wallet is unlinked.
    *   **Dashboard Stats**: Tracks their count of issued certificates.
5.  **Dedicated Investor (`INVESTOR`)**:
    *   Browses verified crop listings in the **Funding Marketplace** and submits formal proposals (INR returns, yield margin agreements).
    *   Tracks proposals in the **Submitted LOIs Hub** with support for cancelling pending proposals, and locks/transfers funding (ETH) using the `MicroFinance.sol` smart contract escrow mechanism.
    *   **Dashboard Stats**: Tracks their total committed capital (Rs).
6.  **Consumer / Public Buyer (`CONSUMER`)**:
    *   Explores the public agricultural directory, traces crop origins (provenance timelines), and submits ratings/reviews on-chain or walletless.

### 📍 2. Geographical Verifier Allocation
*   **Inspector Priority Routing**: Crop registrations are automatically assigned to verifiers using a prioritized Kerala location matching model:
    *   **Priority 1**: Same Taluk/Sub-District
    *   **Priority 2**: Same District
    *   **Priority 3**: DISTRICT-level coverage fallback
*   **Active Verifier Queue**: Only inspectors in `ACTIVE` status (after completing setup, password reset, and wallet cryptographic signature link) receive crop assignments, preventing orphaned assignments.
*   **Quality Tester Assignment**: Harvested crops are matched to labs based on the crop's district and PIN code. Assignments are only routed to Quality Labs that are in `ACTIVE` status (i.e. approved by the Admin).

### 📄 3. Integrated Document Center & Printing
*   **Crop Verification Approval Letter**: A formal letterhead outlining GPS verification coordinates, soil chemistry parameters, and inspector sign-offs.
*   **Batch Quality Certificate**: A premium, gold-bordered certificate featuring certified grade badges and a unique batch QR code.
*   **Ink-Saving Print CSS**: Custom `@media print` directives in `index.css` force light-mode formatting and strip layouts of buttons, panels, and sidebars for clean, professional paper printing.

### 🔍 4. Supply Chain Explorer & Dynamic QR Routing
*   **Lookup Portal (`/explorer`)**: A dual-tab search dashboard (Crop Cultivation ID vs. Product Lot Number) displaying verified ledger statistics.
*   **Dynamic Query Parsing**: Accessing `/explorer?lot=XXXX` or `/explorer?crop=Y` parses and displays the corresponding on-chain tracebacks on mount.
*   **Integrated Camera QR Scanner**: Renders an interactive browser-based QR camera stream scanner (`html5-qrcode`) to scan physical packaging directly on-screen.
*   **Physical QR Code Integration**: Scanning the QR code printed on physical crop bags redirects users directly to their lot trace pages in the browser.

### 🔔 5. Real-Time Dashboard Badges & Loading overlays
*   Dashboards implement local cache validation (`localStorage`) to display live, unread notification counts on cards (e.g., pending crop updates, new incoming funding proposals, and inspection tasks).
*   Visual components implement structural loading skeletons (`Skeletons.jsx`) and global backdrop-blur overlay indicators during asynchronous blockchain operations.

---

## 📂 Project Structure

```text
AgroChain-Morden/
├── Blockchain/        # Solidity contracts, Hardhat config, deploy scripts
├── Backend/           # Flask REST API, SQLAlchemy schemas, blueprints, DB seeds
└── Frontend/          # React components, Tailwind styling, contract ABIs
```

---

## ⚡ Setup & Running Locally

### Prerequisites
*   Node.js (v18+)
*   Python (v3.9+)
*   MetaMask browser extension

---

### Step 1: Spin Up the Local Blockchain Node
Open a terminal, navigate to the `Blockchain/` directory, and launch the Hardhat server:
```bash
cd Blockchain
npm install
npm run node
```
This runs a local RPC server at `http://127.0.0.1:8545` and prints 20 pre-funded test accounts with their private keys.

---

### Step 2: Deploy the Smart Contracts
Open a new terminal, navigate to the `Blockchain/` directory, and deploy the contracts to the local network:
```bash
cd Blockchain
npm run deploy
```
This compiles the Solidity code, deploys the contracts (`FarmerRegistry`, `ProductRegistry`, `MicroFinance`, `RatingSystem`), and automatically exports the addresses and ABIs to the `Frontend/` and `Backend/` directories.

---

### Step 3: Configure and Seed the Backend
Open a third terminal, navigate to the `Backend/` directory:
```bash
cd Backend
pip install -r requirements.txt

# Set up environment variables
copy .env.example .env

# Create tables and seed mock data
py seed.py --reset

# Start Flask API server
py app.py
```
The API backend will run on `http://127.0.0.1:5000`.

---

### Step 4: Run the Frontend App
Open a fourth terminal, navigate to the `Frontend/` directory, and launch the Vite development server:
```bash
cd Frontend
npm install
npm run dev
```
Open `http://localhost:3000` (or `http://localhost:3001`) in your browser.

---

### 💡 Single-Command Startup
To spin up all servers and deploy the environment in a single command, double-click or run the batch script in the root directory:
```bash
start-presentation.bat
```

---

## 🦊 MetaMask Localhost Configuration

1.  Open the MetaMask extension.
2.  Navigate to **Settings** $\rightarrow$ **Networks** $\rightarrow$ **Add Network** $\rightarrow$ **Add a Network Manually**:
    *   **Network Name**: Hardhat Localhost
    *   **RPC URL**: `http://127.0.0.1:8545`
    *   **Chain ID**: `31337`
    *   **Currency Symbol**: `ETH`
3.  **Import Accounts**: Copy the private keys printed in the Hardhat terminal node logs:
    *   Account #0 $\rightarrow$ **Dr. Anita** (Regional Quality Lab Tester / Admin)
    *   Account #1 $\rightarrow$ **Rajesh Patel** (Farmer)
    *   Account #2 $\rightarrow$ **Amit Kumar** (Consumer)
    *   Account #3 $\rightarrow$ **Suresh Mehta** (Investor)

---

## 🌐 Production Cloud Hosting (Render + Neon)

The application has been successfully containerized and deployed live in a production cloud environment.

*   **Live Web Application URL**: [https://agrochain-i6zh.onrender.com](https://agrochain-i6zh.onrender.com)
*   **Backend + Frontend Host**: **Render.com** (Multi-stage Docker runtime with Gunicorn)
*   **Database Platform**: **Neon Serverless PostgreSQL** (US East AWS Cloud Instance)

### Database Migration Details
The database has been fully migrated from the local SQLite `agrochain.db` to Neon Postgres using:
1.  `migrate_to_neon.py` for schema generation and bulk data transfer (translating SQLite integer booleans to strict PostgreSQL booleans).
2.  `reset_sequences.py` to synchronize primary key auto-increment sequences (`_id_seq`), preventing duplicate key insert collisions.

---

## 💅 Styling & Aesthetic Guidelines

To maintain the system's high-fidelity design language:
*   **Standard Tailwind Weights Only**: Do not use non-standard Tailwind colors (such as `emerald-650` or `slate-655`). Standardize colors with valid weights (`50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`, `950`).
*   **Active Theme Support**: Ensure color classes are defined for both light and dark modes (using the `.dark` class prefix).

---

## 🔒 Security & Credential Rules

1.  **No Hardcoded Secrets**: Do not store private keys, API credentials, database strings, or JWT keys inside code repositories.
2.  **Environment Variables**: Save all configuration options in a local `.env` file (which is automatically ignored by `.gitignore`).
3.  **Secure Fallbacks**: Provide strict config checks in code to prevent starting operations if vital credentials are empty.

---

## 🔮 Future Roadmap & Scope

For future scale-up and enhancement of the platform's user experience (particularly to reduce the barrier to entry for rural farmers), the following architecture is proposed:

### 1. Unified Web2 Social Authentication for Farmers
*   **Google Connect**: Instead of linking MetaMask wallets, Farmers onboarding onto the platform register or log in with one-click **Google OAuth2** or SMS-based social authentication.
*   **Familiar UX**: Eliminates the requirement for non-technical users to install browser extensions, manage recovery phrases, or understand Web3 wallet jargon.

### 2. Auto-Generating Wallets (Embedded Invisible Web3)
*   **Embedded Wallet SDK Integration**: Implement services like **Privy**, **Web3Auth**, or **Magic Link** to securely derive an Ethereum wallet address in the background upon social login.
*   **Invisible Custody**: The generated address is linked directly to their profile (`wallet_address` column). Farmers never see a private key, signature pop-up, or gas error, yet are fully equipped to receive escrow investments directly on-chain.

### 3. Automatic Fiat Cash-Out (Fiat Off-Ramp)
*   **Stripe / Transak Off-Ramps**: Add a `"Withdraw to Bank"` workflow in the Farmer's dashboard that automatically triggers an exchange (converting on-chain ETH funding back into local fiat currency, e.g., INR) and routes it directly to their bank account using local banking networks.
