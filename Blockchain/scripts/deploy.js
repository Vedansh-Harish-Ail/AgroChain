const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment...");

  // Deploy FarmerRegistry
  const FarmerRegistry = await hre.ethers.getContractFactory("FarmerRegistry");
  const farmerRegistry = await FarmerRegistry.deploy();
  await farmerRegistry.waitForDeployment();
  const farmerRegistryAddress = await farmerRegistry.getAddress();
  console.log(`FarmerRegistry deployed to: ${farmerRegistryAddress}`);

  // Deploy ProductRegistry
  const ProductRegistry = await hre.ethers.getContractFactory("ProductRegistry");
  const productRegistry = await ProductRegistry.deploy(farmerRegistryAddress);
  await productRegistry.waitForDeployment();
  const productRegistryAddress = await productRegistry.getAddress();
  console.log(`ProductRegistry deployed to: ${productRegistryAddress}`);

  // Deploy MicroFinance
  const MicroFinance = await hre.ethers.getContractFactory("MicroFinance");
  const microFinance = await MicroFinance.deploy(farmerRegistryAddress, productRegistryAddress);
  await microFinance.waitForDeployment();
  const microFinanceAddress = await microFinance.getAddress();
  console.log(`MicroFinance deployed to: ${microFinanceAddress}`);

  // Deploy RatingSystem
  const RatingSystem = await hre.ethers.getContractFactory("RatingSystem");
  const ratingSystem = await RatingSystem.deploy(farmerRegistryAddress);
  await ratingSystem.waitForDeployment();
  const ratingSystemAddress = await ratingSystem.getAddress();
  console.log(`RatingSystem deployed to: ${ratingSystemAddress}`);

  // Set up standard roles for the deployer for convenience in testing
  const [deployer] = await hre.ethers.getSigners();
  const TESTER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("TESTER_ROLE"));
  const INSPECTOR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("INSPECTOR_ROLE"));
  const AGRICULTURE_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("AGRICULTURE_ROLE"));
  const QUALITY_TESTOR_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes("QUALITY_TESTOR_ROLE"));
  
  await farmerRegistry.grantRole(AGRICULTURE_ROLE, deployer.address);
  await farmerRegistry.grantRole(INSPECTOR_ROLE, deployer.address);
  console.log(`Granted AGRICULTURE_ROLE and INSPECTOR_ROLE to deployer: ${deployer.address}`);
  
  await productRegistry.grantRole(QUALITY_TESTOR_ROLE, deployer.address);
  await productRegistry.grantRole(TESTER_ROLE, deployer.address);
  console.log(`Granted QUALITY_TESTOR_ROLE and TESTER_ROLE to deployer: ${deployer.address}`);

  // Prepare directories for Frontend export
  const frontendContractsDir = path.join(__dirname, "..", "..", "Frontend", "src", "contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  // Prepare directories for Backend export (if backend needs addresses/abis)
  const backendContractsDir = path.join(__dirname, "..", "..", "Backend", "contracts");
  if (!fs.existsSync(backendContractsDir)) {
    fs.mkdirSync(backendContractsDir, { recursive: true });
  }

  // Save deployed addresses
  const addresses = {
    FarmerRegistry: farmerRegistryAddress,
    ProductRegistry: productRegistryAddress,
    MicroFinance: microFinanceAddress,
    RatingSystem: ratingSystemAddress
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "addresses.json"),
    JSON.stringify(addresses, null, 2)
  );
  fs.writeFileSync(
    path.join(backendContractsDir, "addresses.json"),
    JSON.stringify(addresses, null, 2)
  );
  console.log("Contract addresses saved to frontend and backend!");

  // Helper function to copy ABI files
  function copyArtifact(contractName) {
    const artifactPath = path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      `${contractName}.sol`,
      `${contractName}.json`
    );

    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      
      fs.writeFileSync(
        path.join(frontendContractsDir, `${contractName}.json`),
        JSON.stringify(artifact, null, 2)
      );
      fs.writeFileSync(
        path.join(backendContractsDir, `${contractName}.json`),
        JSON.stringify(artifact, null, 2)
      );
      console.log(`Copied ABI for ${contractName}`);
    } else {
      console.error(`Artifact not found: ${artifactPath}`);
    }
  }

  // Copy ABIs
  copyArtifact("FarmerRegistry");
  copyArtifact("ProductRegistry");
  copyArtifact("MicroFinance");
  copyArtifact("RatingSystem");

  console.log("Deployment and export completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
