const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const addressesPath = path.join(__dirname, "..", "..", "Backend", "contracts", "addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  const FarmerRegistry = await hre.ethers.getContractFactory("FarmerRegistry");
  const farmerRegistry = FarmerRegistry.attach(addresses.FarmerRegistry);
  
  // Check crops 1, 2, 3
  for (let id = 1; id <= 3; id++) {
    try {
      const farmer = await farmerRegistry.farmers(id);
      console.log(`Crop ${id}: isRegistered=${farmer.isRegistered}, isApproved=${farmer.isApproved}, name=${farmer.farmerName}`);
    } catch (e) {
      console.log(`Crop ${id}: Not found on chain`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
