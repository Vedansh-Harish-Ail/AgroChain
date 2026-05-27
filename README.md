# AgroChain DApp (Modernized Stack)

AgroChain is a blockchain-based agricultural supply chain and micro-finance platform. It bridges the gap between farmers and consumers by combining immutable blockchain traceability with interest-free micro-finance. Direct connections, verified quality, and zero middlemen.

This repository is a complete rebuild of the original AgroChain project, transitioning from legacy Truffle/Web3.js/Geth to a modern, robust, and clean full-stack architecture.

---

## Modern Tech Stack

- **Frontend:** React (Vite), Tailwind CSS (Dark/Light mode support), React Router, Axios, Ethers.js (v6), MetaMask wallet integration.
- **Backend:** Flask REST API, JWT Authentication, SQLAlchemy ORM (compatible with SQLite and PostgreSQL), Role-Based Access Control.
- **Blockchain:** Solidity, Hardhat local blockchain development network, OpenZeppelin Access Control.

---

## Project Structure

```text
AgroChain-Morden/
├── Blockchain/        # Hardhat config, contracts, deployment scripts
├── Backend/           # Flask REST API, SQLAlchemy models, blueprints
└── Frontend/          # React/Vite client application, Tailwind styling
```

---

## Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MetaMask Browser Extension

---

### Step 1: Start the Local Blockchain Node
Open a terminal, navigate to the `Blockchain/` directory, install packages, and spin up the Hardhat network:
```bash
cd Blockchain
npm install
npm run node
```
This starts a local Ethereum node at `http://127.0.0.1:8545` with 20 pre-funded test accounts.

---

### Step 2: Deploy the Smart Contracts
Open a new terminal, navigate to the `Blockchain/` directory, and run the deployment script:
```bash
cd Blockchain
npm run deploy
```
This compiles the Solidity code, deploys the contracts (`FarmerRegistry`, `ProductRegistry`, `MicroFinance`, `RatingSystem`), and automatically copies the addresses and ABIs to the `Frontend/` and `Backend/` configurations.

---

### Step 3: Configure and Seed the Backend
Navigate to the `Backend/` directory. Initialize a virtual environment (optional) and install the python dependencies:
```bash
cd Backend
py -m pip install -r requirements.txt
```
To run the server and seed initial users and mock data:
```bash
# Set up default configuration
copy .env.example .env

# Run database seed script (automatically creates and populates tables)
py seed.py

# Start the Flask API server
py app.py
```
The API backend will run on `http://localhost:5000`.

---

### Step 4: Run the Frontend
Navigate to the `Frontend/` directory, install packages, and start the Vite development server:
```bash
cd Frontend
npm install
npm run dev
```
Open your browser and navigate to `http://localhost:3000`.

---

## Metamask Integration Setup

1. Open MetaMask.
2. Add a Custom Network:
   - **Network Name:** Hardhat Localhost
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
3. Import Account:
   - Use the private key of any of the pre-funded accounts printed in the `npm run node` console log.
   - For example, account #0 is the deployer, account #1 is Rajesh (Farmer), and account #2 is Amit (Investor).
