# PROJECT SYNOPSIS
## DESIGN AND IMPLEMENTATION OF AGROCHAIN: AN ANCHORED WEB3 TRANSPARENCY REGISTRY AND PEER-TO-PEER MICRO-LOAN ESCROW INFRASTRUCTURE FOR AGRICULTURAL SUPPLY CHAINS

---

### 1. COVER PAGE

**Project Title:**  
Design and Implementation of AgroChain: An Anchored Web3 Transparency Registry and Peer-to-Peer Micro-Loan Escrow Infrastructure for Agricultural Supply Chains

**Course / Degree:**  
Master of Computer Applications (MCA)

**Submitted By:**  
[Student Name]  
Roll Number / Register Number: [Your Roll Number]  

**Under the Guidance of:**  
[Guide Name]  
[Guide Designation]  
Department of Computer Applications  

**Institution Name:**  
[Your College / University Name]  

**Academic Year:**  
2025 - 2026  

---

### 2. CERTIFICATE (TEMPLATE)

**DEPARTMENT OF COMPUTER APPLICATIONS**  
**[YOUR COLLEGE NAME HERE]**  

This is to certify that the project synopsis entitled **"Design and Implementation of AgroChain: An Anchored Web3 Transparency Registry and Peer-to-Peer Micro-Loan Escrow Infrastructure for Agricultural Supply Chains"** is a bonafide record of the work carried out by **[Student Name]** bearing Register No: **[Register Number]** in partial fulfillment for the award of the degree of Master of Computer Applications (MCA) during the academic year **[Year]**.

This synopsis has been reviewed and approved for submission to the Department of Computer Applications.

<br><br>

**________________________**  
**Internal Guide / Supervisor**  
[Guide Name & Designation]  

<br><br>

**________________________**  
**Head of the Department (HOD)**  
[HOD Name & Designation]  

<br><br>

**________________________**  
**External Examiner**  
[Examiner Name & Affiliation]  

Date: [Insert Date]  
Place: [Insert Place]  

---

### 3. ACKNOWLEDGEMENT

I express my deep sense of gratitude to my project guide, **[Guide Name]**, Department of Computer Applications, for providing insightful guidance, technical validation, and constant support during the conceptualization and development of the **AgroChain** platform.

I also extend my sincere thanks to our Head of the Department, **[HOD Name]**, and the principal of our institution, for facilitating access to development environments and supporting laboratory infrastructure.

Lastly, I thank my peers, laboratory assistants, and family members for their constant encouragement and feedback throughout this project.

**[Student Name]**  

---

### 4. ABSTRACT

Today's agricultural supply chain faces a double-sided trust problem. On the consumer end, purchasers of organic or premium products have no reliable mechanism to verify authenticity, leaving them vulnerable to labeling fraud. On the farming end, smallholder cultivators are excluded from formal credit channels due to rigid banking requirements, forcing them to rely on high-interest money lenders. 

**AgroChain** addresses both challenges through a hybrid Web2/Web3 platform. AgroChain secures supply chain logs by anchoring critical milestones directly onto a public Ethereum blockchain while providing a peer-to-peer (P2P) Letter of Intent (LOI)-based micro-loan portal for farmers. By utilizing decentralized smart contracts, the system records crop lifecycles, soil diagnostics, inspector audits, and laboratory test grades in an immutable registry. To ensure usability, consumers, farmers, and investors interact without MetaMask or gas fees. MetaMask is restricted strictly to authorized Agricultural Inspectors and Quality Lab Testers for on-chain approvals and quality certificates. 

The backend consists of a Flask REST API utilizing a relational SQLite/PostgreSQL database cache to bypass slow blockchain RPC calls and achieve load times under 1.5 seconds. Cultivations are auto-assigned to verifiers using a Kerala-specific administrative routing hierarchy. The final product is a transparent, peer-to-peer supply chain ecosystem that restores consumer trust and supports agricultural micro-finance.

---

### 5. INTRODUCTION

The globalization of agricultural supply chains has introduced multiple intermediaries, widening the gap between farmers and consumers. Centralized databases managed by single entities are vulnerable to administrative manipulation, as database entries can be updated or deleted, leaving no auditable trail. Conversely, blockchain technology offers an immutable, shared ledger where records are permanent and cryptographically secured.

However, full Web3 applications require all users to manage private keys and pay transaction gas fees—creating a barrier for farmers and consumers. AgroChain addresses this via a hybrid Web2/Web3 architecture. By restricting blockchain operations to critical regulatory checkpoints (inspections and quality testing), AgroChain leverages the trust of a public ledger while keeping the user experience accessible.

In AgroChain:
*   Farmers list crops and update growth timelines using a standard mobile-friendly web dashboard.
*   Consumers scan QR codes to instantly trace the crop lifecycle back to the source farm, including GPS coordinates, testing details, and audit blocks.
*   Micro-finance investors submit Letters of Intent (LOI) to fund crops without navigating cryptocurrency exchanges.
*   Agricultural Inspectors and Quality Labs use MetaMask to sign regulatory verifications, creating an immutable audit trail on-chain.

---

### 6. PROBLEM STATEMENT

Traditional agricultural supply chains and micro-lending platforms face four primary failures:
1.  **Centralized Database Tampering (Labeling Fraud):** Supply chain logs stored in centralized Web2 databases are susceptible to unauthorized modifications by database administrators or external hackers. A crop's organic or premium grade can be changed via SQL updates without an auditable history.
2.  **Financial Exclusion of Smallholders:** Small farmers are frequently excluded from banking credit due to a lack of traditional collateral. This forces them to turn to local money lenders charging high interest rates, reducing their profitability.
3.  **Fragmented and Unverified Records:** Soil tests, land records, inspector notes, and laboratory results are kept in isolated spreadsheets, paper binders, or private databases, making compiling a single, trustworthy crop history difficult.
4.  **Inefficient Inspector Allocation:** Manually assigning inspectors to verify crops leads to administrative delays. Distance-based math (e.g., GPS distance calculations) is often inaccurate due to geographic boundaries.

---

### 7. EXISTING SYSTEM

The existing agricultural supply chain registry and financing systems are dominated by three approaches:
1.  **Enterprise Private Blockchains (e.g., IBM Food Trust):** These solutions utilize permissioned ledgers like Hyperledger Fabric. While robust, they require high integration costs, making them inaccessible to smallholder cooperatives. Regular consumers cannot query the private ledger directly, limiting transparency.
2.  **Centralized SaaS Traceability (e.g., AgriDigital):** These platforms manage inventory and supply chain tracking via cloud databases. However, because they are proprietary and centralized, users must trust the platform host not to manipulate the data.
3.  **Traditional Micro-Lending Platforms (e.g., Kiva):** These platforms facilitate peer-to-peer loans for agriculture, but they rely on centralized intermediaries to handle funds and verify crop yields. This introduces processing delays and overhead costs.

---

### 8. LIMITATIONS OF EXISTING SYSTEM

The limitations of the existing systems include:
*   **Lack of Real Immutability:** Centralized databases lack cryptographic protection against internal admin tampering, allowing fraudulent updates to supply chain data.
*   **High Setup and Maintenance Cost:** Enterprise private blockchains are too expensive and complex for local cooperatives and individual smallholders.
*   **Lack of Direct Consumer Access:** Traceability records are often stored behind corporate portals and are not accessible via standard packaging scans.
*   **Complex Cryptocurrency Usability:** General Web3 platforms require farmers and consumers to configure Web3 wallets (like MetaMask) and buy native tokens to pay for gas, which is impractical for non-technical users.
*   **Absence of Verified Routing:** Existing platforms lack automated, boundary-aware algorithms to assign local auditors, leading to delayed inspections.

---

### 9. PROPOSED SYSTEM

The proposed system, **AgroChain**, is a hybrid Web2/Web3 platform designed to balance data immutability with user accessibility. 

Key design choices of the proposed system:
1.  **Hybrid Web3 Anchoring:** Blockchain is utilized *only* where immutability is required (crop approvals, quality certificates, audit history, and consumer ratings). The rest of the platform operates on a traditional relational database cache to optimize speed.
2.  **MetaMask Restriction:** Only Agricultural Inspectors and Quality Lab Testers use MetaMask to write verification details to the blockchain. Farmers, consumers, and investors remain walletless.
3.  **LOI-Based Investment Marketplace:** Investors browse verified crops and submit formal Letters of Intent (LOIs) specifying funding details in Rupees. No ETH or token transfer is forced on the investor, mitigating regulatory and usability hurdles.
4.  **Kerala-Based Priority Routing:** Crops are automatically routed to local inspectors and labs based on Kerala's administrative hierarchy (Priority 1: same Taluk, Priority 2: same District, Priority 3: neighboring district, Priority 4: system fallback).
5.  **Public Explorer with QR Code Redirection:** A public search tool allows anyone to trace crop history by entering a Crop Cultivation ID or Product Lot Number. Scanning a packaging QR code automatically redirects the browser to this timeline.

---

### 10. OBJECTIVES

The engineering objectives of the AgroChain project are:
*   To design and deploy a suite of Solidity smart contracts to record crop cultivation records, quality grades, and user reviews on-chain.
*   To implement a Flask REST API that serves as an identity provider, handles dual-factor OTP signup, and caches blockchain events for performance.
*   To create a React-based frontend dashboard with role-based UI screens for Farmers, Inspectors, Labs, Investors, and Admins.
*   To develop an automated routing algorithm to assign inspectors and testers to crops based on Taluk and District hierarchies.
*   To integrate a MetaMask signature verification system (`personal_sign`) to authenticate inspectors and testers cryptographically.
*   To implement a public explorer featuring a camera-based QR scanner using `html5-qrcode` to enable instant consumer traceability.
*   To build a printable certificate generation utility with print-friendly CSS formatting for farmers to print batch labels.

---

### 11. SCOPE OF THE PROJECT

The scope of AgroChain encompasses:
*   **Stakeholders:** Six distinct system roles: Farmer, Agricultural Inspector, Quality Lab Tester, Dedicated Investor, Consumer, and System Administrator.
*   **Geography:** Built specifically around the administrative boundaries of Kerala, India, using Districts and Taluks to coordinate inspections.
*   **Security:** Enforces Role-Based Access Control (RBAC) via JSON Web Tokens (JWT) at the API layer and OpenZeppelin Access Control roles on the smart contracts.
*   **Ecosystem Bounds:** Focuses on tracking the crop lifecycle from initial land registration to post-harvest quality testing, followed by P2P investment matchmaking and consumer verification. It does not handle shipping logistics, delivery tracking, or retail payments.

---

### 12. LITERATURE SURVEY

#### Reference 1: Syed et al., "Blockchain for Agricultural Supply Chain Traceability: A Review," *IEEE Access*, 2021.
*   **Summary:** The authors review the application of blockchain technology in agriculture. They highlight that while blockchain offers immutability and decentralized trust, existing solutions often suffer from poor user experience, high transaction costs, and a lack of integration with local regulatory frameworks. They advocate for hybrid architectures that separate data storage between on-chain and off-chain databases.
*   **Relevance to AgroChain:** This paper supports AgroChain's decision to use a hybrid architecture, caching data in SQLite/PostgreSQL while using the blockchain only for critical verification hashes.

#### Reference 2: Tian, "An Agri-Food Supply Chain Traceability System Based on RFID & Blockchain Technology," *ICSSSM*, 2016.
*   **Summary:** This study proposes a traceability model using RFID tags for physical identification and a blockchain ledger to prevent record modification. The research demonstrates how physical crop batches can be linked to digital records, ensuring food safety.
*   **Relevance to AgroChain:** Tian's work on linking physical batches to digital IDs is reflected in AgroChain's Product Lot Number and packaging QR code generation workflow.

#### Reference 3: Du et al., "Supply Chain Traceability System Based on Blockchain and Smart Contracts," *IEEE Access*, 2020.
*   **Summary:** The paper presents a system architecture using Solidity smart contracts to govern transactions between supply chain actors. The authors demonstrate that on-chain role enforcement prevents unauthorized actors from writing quality or verification records, reducing fraud.
*   **Relevance to AgroChain:** This informs the security design of `ProductRegistry.sol`, which strictly prevents labs from certifying a crop unless it has been verified by an authorized inspector.

#### Reference 4: Lin et al., "Blockchain and IoT Integration in Agriculture: Minimized Trust Protocols," *Computers and Electronics in Agriculture*, 2021.
*   **Summary:** This article explores how IoT data and blockchain can reduce reliance on human verifiers. However, it notes that in developing agricultural regions, human-in-the-loop verification (inspectors and laboratories) remains necessary due to high IoT sensor costs.
*   **Relevance to AgroChain:** This research supports AgroChain's structure of using authorized regional inspectors and Quality Labs as the core verifiers of farm data.

#### Reference 5: Kamble et al., "Blockchain Technology Adoption in Indian Agriculture Supply Chains," *Transportation Research Part E*, 2020.
*   **Summary:** This study analyzes the barriers to blockchain adoption in India. Key challenges identified include complex user interfaces, the requirement to handle cryptocurrency, and lack of integration with regional administrative boundaries.
*   **Relevance to AgroChain:** This paper highlights the need for AgroChain's walletless design for farmers and consumers, and its Kerala-specific regional assignment engine.

---

### 13. SYSTEM ARCHITECTURE

AgroChain utilizes a multi-tier hybrid architecture to bridge the gap between Web2 speed and Web3 immutability.

```
+-------------------------------------------------------------------------+
|                          CLIENT TIER (React.js)                         |
|                                                                         |
|  +--------------------+  +--------------------+  +-------------------+  |
|  |   Farmer/Consumer  |  |    Investor UI     |  | Inspector/Lab UI  |  |
|  |  (Walletless/Web2) |  |   (LOI Tracking)   |  | (MetaMask Linked) |  |
|  +---------+----------+  +---------+----------+  +---------+---------+  |
+------------|-----------------------|-----------------------|------------+
             |                       |                       |             
             | HTTP REST & JWT       |                       | JSON-RPC    
             v                       v                       |             
+------------------------------------------------+           |             
|               APPLICATION TIER                 |           |             
|             Flask REST API Server              |           |             
|        (Coordinating JWT Auth, Routing,        |           |             
|          OTP & Database operations)            |           |             
+--------------------+---------------------------+           |             
                     |                                       |             
                     | ORM Queries                           |             
                     v                                       v             
+----------------------------------------+       +------------------------+
|           DATA CACHE TIER              |       |   BLOCKCHAIN LEDGER    |
|   SQLite / Neon PostgreSQL Database    |       |   Hardhat Local Node   |
| (Caches crop metadata, user profiles,  |       |  (Solidity Contracts:  |
|  LOI proposal states, and audit logs)  |       |  Farmer/Product Reg.)  |
+----------------------------------------+       +------------------------+
```

*   **Client Tier:** A Vite-based React application that renders the user interface. It detects user roles and displays custom dashboards. It integrates MetaMask only for Inspectors and Labs to sign transactions.
*   **Application Tier:** A Python Flask API that handles business logic, registration, JWT authentication, and regional routing. It exposes REST endpoints for data input and retrieval.
*   **Data Cache Tier:** A relational database (SQLite in development, Neon PostgreSQL in production) that caches crop, product, and investment records to ensure fast loading times.
*   **Blockchain Ledger:** An Ethereum virtual machine (EVM) network running smart contracts that store crop verification proofs and quality grades.

---

### 14. MODULE DESCRIPTION

AgroChain is divided into seven core modules:

1.  **User Authentication and Verification Module:** Handles registration and login. Supports SMS OTP verification (via E.164 normalized phone numbers) and SMTP email OTP. It separates signups into Farmers, Quality Labs, Investors, and Consumers.
2.  **Administrative Inspector Portal:** Allows admins to create Inspector profiles. Upon first login, Inspectors must reset their temporary password and link their MetaMask wallet. The backend verifies their signature via `personal_sign` and sets their status to `ACTIVE`.
3.  **Kerala Geographical Assignment Engine:** Automatically assigns registered crops to nearby Inspectors and Quality Labs. It uses a location matching algorithm that prioritizes the same Taluk, followed by the same District, neighboring districts, and a system fallback.
4.  **Farmer Registration and Tracking Module:** Allows Farmers to register crop cultivations with land survey numbers, GPS coordinates, and documents. Once the crop is harvested, the Farmer updates the status to `HARVEST_COMPLETED`, routing it to the testing queue.
5.  **Quality Lab Certification Module:** Allows Quality Labs to self-register by uploading credentials (accreditation and license numbers). Once approved by the Admin, labs receive testing requests. The lab technician records the crop quality grade and issues a certificate on-chain.
6.  **P2P Loan Proposal Marketplace:** Allows Investors to browse certified crops and submit Letters of Intent (LOIs) specifying funding amounts and repayment terms in Rupees. Farmers receive dashboard notifications and can accept proposals.
7.  **Public Explorer & QR Traceability Module:** A search portal that fetches on-chain records. Features an integrated camera-based QR scanner. When a consumer scans a packaging QR code, it decodes the URL and loads the crop timeline.

---

### 15. WORKFLOW OF THE SYSTEM

The step-by-step lifecycle of a crop in AgroChain is as follows:

*   **Crop Registration:** The Farmer registers the crop location (Kerala-based Taluk and District) along with evidence documents. The backend assigns a local Inspector based on location routing.
*   **Inspector Audit:** The Inspector reviews the details, completes a field check, and approves it on-chain using MetaMask (signing a blockchain transaction).
*   **Harvest and Assignment:** The Farmer updates the timeline to `HARVEST_COMPLETED`. The crop is routed to a registered Quality Lab in the same district.
*   **Lab Certification:** The Lab Tester runs analysis and records the quality grade on-chain via MetaMask (which issues the Product Lot Number and price in Wei).
*   **P2P Bidding (LOI):** The certified crop is listed in the marketplace. Dedicated Investors submit Letters of Intent (LOIs) proposing funding amounts in INR.
*   **LOI Acceptance:** The Farmer reviews and accepts the LOI proposal. The crop's timeline advances to `FUNDING_COMPLETED`. No cryptocurrency transfers are performed by the Investor.
*   **Traceability Lookup:** Consumers scan the printed QR code on packaging or query the Crop Cultivation ID/Lot Number on the public explorer to trace the entire audit timeline.

---

### 16. FUNCTIONAL REQUIREMENTS

#### 1. Farmer Functions
*   **Sign-up & OTP Verification:** Create an account by verifying both email and phone OTPs.
*   **Link Wallet:** Associate an Ethereum wallet address to their profile without requiring gas.
*   **Register Cultivation:** Enter crop details, GPS coordinates, survey numbers, and upload deeds.
*   **Crop History Timeline:** View the list of registered crops and update status (Growing, Ready to Harvest, Harvest Completed).
*   **Document Downloads:** View and download the PDF Approval Letter and the gold-bordered Batch Quality Certificate.

#### 2. Agricultural Inspector Functions
*   **Forced Reset & Wallet Linking:** Reset temporary password on first login and verify MetaMask wallet via message signature.
*   **Inspection Queue:** View crop cultivations automatically assigned by the location engine.
*   **Audit Crop:** Enter inspection notes and select the verification method (Physical, Photo, Hybrid).
*   **On-Chain Approval:** Sign and write the crop approval record to the blockchain.

#### 3. Quality Lab Functions
*   **Self-Registration:** Submit credentials, licenses, and accreditation certificates for Admin review.
*   **Quality Queue:** View harvested crops assigned to their district and ZIP code.
*   **Certify Batch:** Enter lab results, assign a grade (A+, A, B, C), and write the certificate to the blockchain.

#### 4. Investor Functions
*   **Browse Marketplace:** Explore verified and certified crop lots.
*   **Submit LOI:** Submit a Letter of Intent proposing funding amounts and profit margins in Rupees.
*   **Manage Proposals:** Monitor submitted proposals and cancel pending offers.

#### 5. Consumer Functions
*   **Trace Provenance:** Search the explorer using a Crop ID or Product Lot Number.
*   **QR Scanner:** Use a device camera to scan packaging QR codes for instant lookup.
*   **Ratings & Reviews:** Rate farmers on reliability, quality, and delivery.

#### 6. System Administrator Functions
*   **Verifier Management:** Create Inspector accounts and review/approve Quality Lab applications.
*   **Audit Logs:** Monitor all system actions and transaction hashes in real-time.
*   **Analytics:** View charts showing user distributions, crop categories, and active investments.

---

### 17. NON-FUNCTIONAL REQUIREMENTS

*   **Security & Privacy:** Passwords must be hashed using PBKDF2 (via Werkzeug). API endpoints are protected using JWT role-based tokens. Smart contracts enforce role access control using OpenZeppelin's `AccessControl` libraries.
*   **Performance (Latency):** Dashboard pages must load in under 1.5 seconds. Relational database caching is used to avoid querying the Ethereum blockchain for list views.
*   **Data Consistency:** Relational records (SQLite/PostgreSQL) and on-chain blockchain records are synchronized using transaction receipt checks and backend event tracking.
*   **Usability:** Interface layouts must adapt to mobile, tablet, and desktop viewports. Visual skeletons prevent layout shifts during asynchronous fetches.
*   **Printability:** Compliance sheets and certificates must fit on standard A4 paper size when printed directly from the browser.

---

### 18. HARDWARE REQUIREMENTS

#### 1. Client / End-User System
*   **Processor:** Dual-core Intel Core i3 / AMD Ryzen 3 or higher.
*   **Memory:** 4 GB RAM.
*   **Peripherals:** Camera (required for consumers using the QR scanner), internet connection.

#### 2. Development / Deployment Server
*   **Processor:** Quad-core Intel Core i5 / AMD Ryzen 5 or higher.
*   **Memory:** 8 GB RAM (16 GB recommended to run local Hardhat blockchain simulations).
*   **Storage:** 500 MB free space for code, database, node libraries, and smart contract artifacts.

---

### 19. SOFTWARE REQUIREMENTS

*   **Operating System:** Windows 10/11, macOS, or Linux (Ubuntu 20.04+).
*   **Web Browser:** Google Chrome, Firefox, or Brave with the MetaMask extension installed.
*   **Runtime Environments:** Node.js (v18.0+) and Python (v3.9+).
*   **Database Engine:** SQLite (development cache) and PostgreSQL (production).
*   **Blockchain Compiler:** Solidity Compiler (v0.8.20).
*   **Development Tools:** Visual Studio Code, Hardhat Console, Git.

---

### 20. TECHNOLOGY STACK

```
+------------------+---------------------------------------------------------+
| LAYER            | TECHNOLOGY SELECTION                                    |
+------------------+---------------------------------------------------------+
| Frontend UI      | React.js (Vite compiler), Tailwind CSS, Lucide Icons    |
| Web3 Provider    | MetaMask Browser Extension (Ethers.js v6 integration)    |
| Backend API      | Python Flask, Flask-SQLAlchemy ORM                      |
| Database Cache   | SQLite (Local development), Neon Serverless PostgreSQL  |
| Ledger Simulator | Solidity v0.8.20, Hardhat Network                       |
| Verification     | html2pdf.js (PDF generation), html5-qrcode (QR Scanner) |
+------------------+---------------------------------------------------------+
```

---

### 21. DATABASE OVERVIEW

AgroChain utilizes a relational database as a cache layer to store files, coordinates, user profiles, and operational logs. 

#### Relational Database Schema Entity Relationship

1.  **`users` Table:** Stores profile data, hashed passwords, roles (`FARMER`, `TESTER`, `CONSUMER`, `ADMIN`, `INSPECTOR`, `INVESTOR`), wallet addresses, and lab registration details.
2.  **`farmers` Table:** Stores crop cultivation records, location data, land survey numbers, GPS coordinates, verification status (`PENDING`, `VERIFIED`, `REJECTED`), timeline status (`CROP_REGISTERED`, `READY_TO_HARVEST`, `HARVEST_COMPLETED`, `PRODUCT_AVAILABLE`, `FUNDING_COMPLETED`), and assigned Inspector/Tester IDs.
3.  **`products` Table:** Caches product lot details, quality grades, price in Wei, and on-chain transaction hashes.
4.  **`investments` Table:** Tracks Letters of Intent (LOIs), funding amounts in Rupees, proposed terms, and approval statuses (`PENDING`, `ACCEPTED`, `DECLINED`).
5.  **`ratings` Table:** Stores consumer star ratings and comments.
6.  **`audit_logs` Table:** Records system actions, timestamps, and operator names for the Admin dashboard.
7.  **`otp_verifications` Table:** Caches SMS and Email OTP codes with expiration timestamps.
8.  **`transactions` Table:** Logs blockchain transaction hashes, methods called, and gas heights.

---

### 22. BLOCKCHAIN INTEGRATION

#### Contract Roles and Responsibilities
AgroChain deploys four Solidity contracts:
1.  **`FarmerRegistry.sol`:** Registers crop cultivations and verifies them. It utilizes OpenZeppelin `AccessControl` to restrict approval rights to users holding `AGRICULTURE_ROLE` (Agricultural Inspectors).
2.  **`ProductRegistry.sol`:** Records product lot certification details. It enforces a rule that a crop lot cannot be certified unless it has been verified on-chain. It restricts certification to users holding `QUALITY_TESTOR_ROLE` (Quality Labs).
3.  **`MicroFinance.sol`:** Tracks investor and farmer wallet listings.
4.  **`RatingSystem.sol`:** Stores customer feedback evaluations on-chain to generate reputation ratings.

#### Access Control and Wallet Requirements
*   **Farmers, Consumers, and Investors:** Do not require MetaMask. Their registrations and transactions (such as LOI submissions and ratings) are logged via the Flask API.
*   **Inspectors and Quality Labs:** Require MetaMask. They connect their wallets and sign transactions on-chain. If their wallet address lacks the required role, a warning banner is shown on the dashboard.

---

### 23. EXPECTED OUTCOME

The expected outcomes of the AgroChain system are:
1.  **On-Chain Integrity:** A blockchain record of crop cultivations and quality certificates.
2.  **Consumer Traceability Timeline:** A public timeline showing the crop lifecycle, including:
    *   *Cultivation Step:* Shows the farmer's name, crop type, and land coordinates.
    *   *Inspection Step:* Shows the Inspector's wallet address, notes, and block height.
    *   *Certification Step:* Shows the Quality Lab's name, grade (e.g., A+), price, and certificate details.
3.  **Digital Documents:** Two downloadable PDF documents:
    *   *Crop Approval Letter:* Details land survey records and inspector signatures.
    *   *Batch Quality Certificate:* A gold-bordered certificate featuring a QR code for physical packaging.
4.  **LOI Micro-Finance Portal:** A peer-to-peer system where investors submit funding proposals in INR, and farmers accept proposals to establish agreements.
5.  **Admin Audit Trails:** An audit dashboard for administrators to monitor system events.

---

### 24. FUTURE ENHANCEMENTS

1.  **AI-Based Disease Diagnostics:** Integrating a computer vision model (such as a CNN trained on leaf diseases) to let farmers upload plant photos during registration and automatically flag disease concerns for the inspector.
2.  **IoT Integration:** Using temperature and humidity sensors in storage units or transport trucks to write shipping conditions to the blockchain.
3.  **Land Registry API Integration:** Connecting the platform to government land database APIs to verify survey numbers instantly, reducing the need for manual inspector reviews.
4.  **Dedicated Mobile Application:** Developing a React Native mobile application to allow inspectors to complete field audits, take photos, and save notes in remote areas with poor internet connection.

---

### 25. CONCLUSION

AgroChain demonstrates a hybrid Web2/Web3 architecture that balances data security with user accessibility. By restricting blockchain operations to critical regulatory checkpoints, the platform creates an immutable record of crop origins and quality grades without requiring farmers and consumers to manage cryptocurrency.

The combination of geographical assignment routing, secure user onboarding, and a peer-to-peer micro-finance portal provides a solution to the trust and funding challenges in agricultural supply chains. The result is a platform that protects consumers from fraud while supporting smallholder farmers.

---

### 26. REFERENCES (IEEE FORMAT)

1.  S. Nakamoto, "Bitcoin: A Peer-to-Peer Electronic Cash System," 2008.
2.  G. Wood, "Ethereum: A Secure Decentralized Generalised Transaction Ledger," *Ethereum Project Yellow Paper*, vol. 151, pp. 1-32, 2014.
3.  V. Buterin, "A Next-Generation Smart Contract and Decentralized Application Platform," Whitepaper, 2014.
4.  M. S. W. Syed, A. S. M. J. Qadri, and F. A. Al-Mamun, "Blockchain for Agricultural Supply Chain Traceability: A Review," *IEEE Access*, vol. 9, pp. 45210-45230, 2021.
5.  F. Tian, "An Agri-Food Supply Chain Traceability System for China Based on RFID & Blockchain Technology," in *Proc. 13th Int. Conf. on Service Systems and Service Management (ICSSSM)*, 2016, pp. 1-6.
6.  M. Du, Q. Chen, and Y. Xiao, "Supply Chain Traceability System Based on Blockchain and Smart Contracts," *IEEE Access*, vol. 8, pp. 86325-86335, 2020.
7.  J. Lin et al., "Blockchain and IoT integration in agriculture: Minimized trust protocols," *Computers and Electronics in Agriculture*, vol. 186, p. 106189, 2021.
8.  S. S. Kamble, A. Gunasekaran, and H. Arimura, "Blockchain Technology Adoption in Indian Agriculture Supply Chains," *Transportation Research Part E: Logistics and Transportation Review*, vol. 140, p. 102009, 2020.
9.  P. Antonucci, S. Figorilli, and C. Costa, "A Review on Blockchain Applications in the Agri-Food Sector," *Journal of Agricultural Engineering*, vol. 50, no. 2, pp. 45-57, 2019.
10. Y. P. Tsang, K. L. Choy, and H. Y. Lam, "An Internet of Things (IoT)-based Product Traceability System for Food Quality Assurance," *International Journal of Food Properties*, vol. 21, no. 1, pp. 1999-2015, 2018.
11. K. R. Awasthi and S. Kumar, "Decentralized Escrow Protocols for Peer-to-Peer Micro-Lending Systems," in *Proc. IEEE Int. Conf. on Decentralized Finance*, 2022, pp. 102-109.
12. ISO 22005:2007, "Traceability in the feed and food chain — General principles and basic requirements for system design and implementation," International Organization for Standardization, 2007.
13. R. Beck, M. Avital, and J. Damsgaard, "Blockchain Technology in Business and Information Systems Research," *Business & Information Systems Engineering*, vol. 59, no. 6, pp. 381-384, 2017.
14. IBM Food Trust, "Traceability and Trust in Food Supply Chains," Whitepaper, IBM Corp., 2020.
15. OpenZeppelin, "Access Control Contracts Documentation," [Online]. Available: https://docs.openzeppelin.com/contracts/4.x/access-control.
16. Ethers.js v6 Documentation, "Ethereum Wallet and Utility Library," [Online]. Available: https://docs.ethers.org/v6/.
17. Hardhat Network Documentation, "Ethereum Development Environment for Professionals," Nomic Foundation, [Online]. Available: https://hardhat.org/docs.
18. Flask-SQLAlchemy Documentation, "SQLAlchemy Database Toolkit Integration for Flask," [Online]. Available: https://flask-sqlalchemy.palletsprojects.com/.
