const { ethers } = require("hardhat")

async function main() {
  const hre = require("hardhat")
  const network = hre.network
  console.log("Deploying SwapSathi Escrow Contract...")

  // Get the contract factory
  const SwapSathiEscrow = await ethers.getContractFactory("SwapSathiEscrow")

  // Set deployment parameters
  const arbitrator = "0x742d35Cc6634C0532925a3b8D4C9db96590c6C8C" // Replace with actual arbitrator address
  const feeRecipient = "0x742d35Cc6634C0532925a3b8D4C9db96590c6C8C" // Replace with actual fee recipient

  // Deploy the contract
  const escrow = await SwapSathiEscrow.deploy(arbitrator, feeRecipient)
  await escrow.waitForDeployment()

  const contractAddress = await escrow.getAddress()
  console.log("SwapSathi Escrow deployed to:", contractAddress)

  // Verify contract on BSCScan/Basescan (optional)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...")
    await escrow.deploymentTransaction().wait(6)

    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [arbitrator, feeRecipient],
      })
      console.log("Contract verified successfully")
    } catch (error) {
      console.log("Verification failed:", error.message)
    }
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    contractAddress: contractAddress,
    arbitrator: arbitrator,
    feeRecipient: feeRecipient,
    deployedAt: new Date().toISOString(),
    deployer: (await ethers.getSigners())[0].address,
  }

  console.log("Deployment Info:", deploymentInfo)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
