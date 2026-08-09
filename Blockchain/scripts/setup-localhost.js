const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  console.log(`Using deployer account: ${signer.address} to fund and setup roles...`);

  // Addresses
  const inspectorAddr = "0xab00e9c32ce055f9cf0b057c580e2408be35ac22";
  const testerAddr = "0x180b3ed8cc0d8a5a0e15bf896f3ebedc1fd5a485";
  const adminAddr = "0x14fc193387B4340a376DE19eF53016b955f3403a";
  const inspector2Addr = "0x1c6e1bcc8f86077fbfc4ac7f99e77de409bae1c6";

  // 1. Funding Wallets with 100 ETH
  const addressesToFund = [inspectorAddr, testerAddr, adminAddr, inspector2Addr];
  console.log("\n--- Funding Wallets ---");
  for (const addr of addressesToFund) {
    const tx = await signer.sendTransaction({
      to: addr,
      value: hre.ethers.parseEther("100")
    });
    await tx.wait();
    console.log(`Funded 100 ETH to: ${addr}`);
  }

  // Load contract addresses
  const addressesPath = path.join(__dirname, "..", "..", "Backend", "contracts", "addresses.json");
  if (!fs.existsSync(addressesPath)) {
    console.error(`Error: addresses.json not found at ${addressesPath}`);
    process.exit(1);
  }
  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf8"));

  // 2. Granting Roles on FarmerRegistry
  console.log("\n--- Setting up FarmerRegistry ---");
  const FarmerRegistry = await hre.ethers.getContractFactory("FarmerRegistry");
  const farmerRegistry = FarmerRegistry.attach(addresses.FarmerRegistry);

  // Authorize Inspector
  let tx = await farmerRegistry.authorizeInspector(inspectorAddr, true);
  await tx.wait();
  console.log(`Authorized inspector: ${inspectorAddr} on FarmerRegistry`);

  tx = await farmerRegistry.authorizeInspector(inspector2Addr, true);
  await tx.wait();
  console.log(`Authorized inspector2: ${inspector2Addr} on FarmerRegistry`);

  // Grant ADMIN_ROLE to admin wallet
  const ADMIN_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("ADMIN_ROLE"));
  tx = await farmerRegistry.grantRole(ADMIN_ROLE, adminAddr);
  await tx.wait();
  console.log(`Granted ADMIN_ROLE to admin: ${adminAddr} on FarmerRegistry`);


  // 3. Granting Roles on ProductRegistry
  console.log("\n--- Setting up ProductRegistry ---");
  const ProductRegistry = await hre.ethers.getContractFactory("ProductRegistry");
  const productRegistry = ProductRegistry.attach(addresses.ProductRegistry);

  // Authorize Tester
  tx = await productRegistry.authorizeTester(testerAddr, true);
  await tx.wait();
  console.log(`Authorized tester: ${testerAddr} on ProductRegistry`);

  // Grant ADMIN_ROLE to admin wallet
  tx = await productRegistry.grantRole(ADMIN_ROLE, adminAddr);
  await tx.wait();
  console.log(`Granted ADMIN_ROLE to admin: ${adminAddr} on ProductRegistry`);

  console.log("\nAll-in-one local network setup complete successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in setup-localhost script:", error);
    process.exit(1);
  });
