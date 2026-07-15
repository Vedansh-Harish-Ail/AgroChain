const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const addressesPath = path.join(__dirname, "..", "..", "Backend", "contracts", "addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));
  
  const FarmerRegistry = await hre.ethers.getContractFactory("FarmerRegistry");
  const farmerRegistry = FarmerRegistry.attach(addresses.FarmerRegistry);
  
  const inspector_addr = "0xab00e9c32ce055f9cf0b057c580e2408be35ac22";
  const is_authorized = await farmerRegistry.authorizedInspectors(inspector_addr);
  console.log(`Is ${inspector_addr} authorized inspector: ${is_authorized}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
