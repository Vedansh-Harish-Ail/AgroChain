const hre = require("hardhat");

async function main() {
  const signers = await hre.ethers.getSigners();
  console.log("HARDHAT_ACCOUNTS_START");
  for (let i = 0; i < signers.length; i++) {
    console.log(`Account #${i}: ${signers[i].address}`);
  }
  console.log("HARDHAT_ACCOUNTS_END");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
