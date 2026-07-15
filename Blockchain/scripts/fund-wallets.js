const hre = require("hardhat");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  
  // Fund inspector wallet
  const inspectorAddr = "0xab00e9c32ce055f9cf0b057c580e2408be35ac22";
  let tx = await signer.sendTransaction({
    to: inspectorAddr,
    value: hre.ethers.parseEther("10")
  });
  await tx.wait();
  console.log(`Sent 10 ETH to Inspector (${inspectorAddr})`);

  // Fund tester wallet too
  const testerAddr = "0x180b3ed8cc0d8a5a0e15bf896f3ebedc1fd5a485";
  tx = await signer.sendTransaction({
    to: testerAddr,
    value: hre.ethers.parseEther("10")
  });
  await tx.wait();
  console.log(`Sent 10 ETH to Tester (${testerAddr})`);

  // Fund second inspector wallet
  const inspector2Addr = "0x1c6e1bcc8f86077fbfc4ac7f99e77de409bae1c6";
  tx = await signer.sendTransaction({
    to: inspector2Addr,
    value: hre.ethers.parseEther("10")
  });
  await tx.wait();
  console.log(`Sent 10 ETH to Inspector2 (${inspector2Addr})`);

  console.log("All wallets funded!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
