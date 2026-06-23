const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const walletAddress = process.env.WALLET_ADDRESS;
  const roleType = process.env.ROLE_TYPE; // "INSPECTOR" or "TESTER"

  if (!walletAddress) {
    console.error("Error: WALLET_ADDRESS environment variable not set");
    process.exit(1);
  }
  if (!roleType) {
    console.error("Error: ROLE_TYPE environment variable not set");
    process.exit(1);
  }

  console.log(`Granting blockchain role ${roleType} to address ${walletAddress}...`);

  // Load contract addresses from Backend directory
  const addressesPath = path.join(__dirname, "..", "..", "Backend", "contracts", "addresses.json");
  if (!fs.existsSync(addressesPath)) {
    console.error(`Error: addresses.json not found at ${addressesPath}`);
    process.exit(1);
  }
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  if (roleType === "INSPECTOR") {
    // Authorize inspector on FarmerRegistry
    const FarmerRegistry = await hre.ethers.getContractFactory("FarmerRegistry");
    const farmerRegistry = FarmerRegistry.attach(addresses.FarmerRegistry);
    
    console.log("Calling authorizeInspector for inspector...");
    const tx1 = await farmerRegistry.authorizeInspector(walletAddress, true);
    await tx1.wait();
    console.log(`Authorized inspector: ${walletAddress} on FarmerRegistry`);
  } else if (roleType === "TESTER") {
    // Authorize tester on ProductRegistry
    const ProductRegistry = await hre.ethers.getContractFactory("ProductRegistry");
    const productRegistry = ProductRegistry.attach(addresses.ProductRegistry);

    console.log("Calling authorizeTester for tester...");
    const tx1 = await productRegistry.authorizeTester(walletAddress, true);
    await tx1.wait();
    console.log(`Authorized tester: ${walletAddress} on ProductRegistry`);
  } else {
    console.error(`Error: Unknown role type: ${roleType}`);
    process.exit(1);
  }

  console.log("On-chain role granting complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in grant-role script:", error);
    process.exit(1);
  });
