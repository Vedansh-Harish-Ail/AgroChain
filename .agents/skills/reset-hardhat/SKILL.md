---
name: Reset Hardhat
description: When the user says "Reset Hardhat", run the full local blockchain reset sequence — re-authorize wallets, fund wallets with ETH, and restart the backend server.
---

# Reset Hardhat

When the user says **"Reset Hardhat"** (or mentions MetaMask issues like "no network fee", "insufficient funds", "Review alert won't click", or "transaction revert"), perform the following steps in order from the `Blockchain/` directory:

## Step 1: Run All-in-One Local Setup Script

This single command funds all wallets with 100 ETH and configures all necessary roles (Inspectors, Testers, Admins) on the smart contracts:

```bash
npx hardhat run scripts/setup-localhost.js --network localhost
```

This automates the following actions:
- Sends **100 ETH** to:
  - Inspector (Agri): `0xab00e9c32ce055f9cf0b057c580e2408be35ac22`
  - Tester (Quality): `0x180b3ed8cc0d8a5a0e15bf896f3ebedc1fd5a485`
  - Admin (System Admin): `0x14fc193387B4340a376DE19eF53016b955f3403a`
  - Inspector2: `0x1c6e1bcc8f86077fbfc4ac7f99e77de409bae1c6`
- Authorizes `Agri` and `Inspector2` on the `FarmerRegistry` contract.
- Authorizes `Tester` on the `ProductRegistry` contract.
- Grants contract `ADMIN_ROLE` to the `admin` wallet address.

## Step 3: Restart Backend (if needed)

Stop and restart the Flask backend server so it picks up any pending code changes:

```bash
# From Backend/ directory
py app.py
```

## Why This Is Needed

Every time the Hardhat node (`npx hardhat node`) is restarted, the entire blockchain state is wiped:
- All ETH balances reset to 0 for imported wallets
- All smart contract role authorizations are cleared
- All on-chain transaction history is lost

The database (SQLite) retains its data, but the blockchain state must be re-initialized.

## User Wallet Reference

| Email | Role | Wallet Address |
|---|---|---|
| vedaks126145@gmail.com | INSPECTOR | 0xab00e9c32ce055f9cf0b057c580e2408be35ac22 |
| ailvedansh18@gmail.com | TESTER | 0x180b3ed8cc0d8a5a0e15bf896f3ebedc1fd5a485 |
| ailvedansh19@gmail.com | INSPECTOR | 0x1c6e1bcc8f86077fbfc4ac7f99e77de409bae1c6 |
