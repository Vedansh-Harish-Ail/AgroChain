# AgroChain Platform (Modernized Stack)

AgroChain is a blockchain-based agricultural supply chain and micro-finance platform. It bridges the gap between farmers, consumers, and investors by combining immutable ledger-based traceability with interest-free P2P micro-finance. By eliminating intermediaries, AgroChain ensures direct connections, verified quality, and fair financing.

This repository represents a complete modernization of the original AgroChain architecture, moving from legacy Truffle/Web3.js/Geth configurations to a modern, robust, and performant full-stack ecosystem.

---

## 🛠️ Modern Tech Stack

*   **Frontend**: React (Vite), Tailwind CSS (Dark/Light mode support), React Router, Axios, Ethers.js (v6), MetaMask wallet integration, and Lucide icons.
*   **Backend**: Flask REST API, JWT Authentication, SQLAlchemy ORM (compatible with SQLite/PostgreSQL), and dynamic geographical assignment routers.
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
    *   Reviews investor funding proposals and accepts/declines them.
    *   Accesses the **Document Center** to view and print official certificates.
3.  **Agricultural Inspector (`INSPECTOR`)**:
    *   Assigned regional crop registrations based on location pin codes.
    *   Inspects soil parameters, GPS bounds, and land deeds on-site.
    *   Approves registrations on-chain (contract: `FarmerRegistry.sol`), generating an official **Approval Letter**.
4.  **Quality Tester / Lab (`TESTER`)**:
    *   Assigned harvested crops in their district coverage.
    *   Performs scientific testing (moisture, purity, heavy metals, pesticide clearance).
    *   Certifies crop batches on-chain (contract: `ProductRegistry.sol`) with a single-click action, setting grades (e.g., `Grade A+`) and listing prices in Wei.
5.  **Dedicated Investor (`INVESTOR`)**:
    *   Browses verified crop listings in the **Funding Marketplace** and submits formal proposals (INR returns, yield margin agreements).
    *   Tracks proposals in the **Submitted LOIs Hub** and locks/transfers funding (ETH) using the `MicroFinance.sol` smart contract escrow mechanism.
6.  **Consumer / Public Buyer (`CONSUMER`)**:
    *   Explores the public agricultural directory, traces crop origins (provenance timelines), and submits ratings/reviews on-chain or walletless.

### 📍 2. Geographical Verifier Allocation
Crops are automatically routed to inspectors and testers matching their geographical PIN Code / District coverage fields (`coverage_pins` in the database), preventing regional conflicts and automating administrative queues.

### 📄 3. Integrated Document Center & Printing
*   **Crop Verification Approval Letter**: A formal letterhead outlining GPS verification coordinates, soil chemistry parameters, and inspector sign-offs.
*   **Batch Quality Certificate**: A premium, gold-bordered certificate featuring certified grade badges and a unique batch QR code.
*   **Ink-Saving Print CSS**: Custom `@media print` directives in `index.css` force light-mode formatting and strip layouts of buttons, panels, and sidebars for clean, professional paper printing.

### 🔍 4. Supply Chain Explorer & Dynamic QR Routing
*   **Lookup Portal (`/explorer`)**: A dual-tab search dashboard (Crop Cultivation ID vs. Product Lot Number) displaying verified ledger statistics.
*   **Dynamic Query Parsing**: Accessing `/explorer?lot=XXXX` or `/explorer?crop=Y` parses and displays the corresponding on-chain tracebacks on mount.
*   **Physical QR Code Integration**: Scanning the QR code printed on physical crop bags redirects users directly to their lot trace pages in the browser.

### 🔔 5. Real-Time Dashboard Badges
Dashboards implement local cache validation (`localStorage`) to display live, unread notification counts on cards (e.g., pending crop updates, new incoming funding proposals, and inspection tasks).

---

## 📂 Project Structure

```text
AgroChain-Morden/
├── Blockchain/        # Solidity contracts, Hardhat config, deploy scripts
├── Backend/           # Flask REST API, SQLAlchemy schemas, blueprints, DB seeds
├── Frontend/          # React components, Tailwind styling, contract ABIs
└── screenshots/       # Visual architecture and workflow diagrams
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

## 💅 Styling & Aesthetic Guidelines

To maintain the system's high-fidelity design language:
*   **Standard Tailwind Weights Only**: Do not use non-standard Tailwind colors (such as `emerald-650` or `slate-655`). Standardize colors with valid weights (`50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`, `950`).
*   **Active Theme Support**: Ensure color classes are defined for both light and dark modes (using the `.dark` class prefix).

---

## 🔒 Security & Credential Rules

1.  **No Hardcoded Secrets**: Do not store private keys, API credentials, database strings, or JWT keys inside code repositories.
2.  **Environment Variables**: Save all configuration options in a local `.env` file (which is automatically ignored by `.gitignore`).
3.  **Secure Fallbacks**: Provide strict config checks in code to prevent starting operations if vital credentials are empty.
