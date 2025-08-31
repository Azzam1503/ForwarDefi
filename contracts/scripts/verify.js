const { ethers, run } = require("hardhat");
const deploymentInfo = require("../deployment.json");

async function main() {
  console.log("🔍 Verifying contracts on Snowtrace...");

  try {
    // Verify MockUSDC
    console.log("\n📄 Verifying MockUSDC...");
    await run("verify:verify", {
      address: deploymentInfo.contracts.MockUSDC,
      constructorArguments: [],
    });
    console.log("✅ MockUSDC verified");
  } catch (error) {
    console.log("⚠️ MockUSDC verification failed:", error.message);
  }

  try {
    // Verify BNPL Contract
    console.log("\n📄 Verifying BNPLInstallmentsProrated...");
    const [deployer] = await ethers.getSigners();

    await run("verify:verify", {
      address: deploymentInfo.contracts.BNPLInstallmentsProrated,
      constructorArguments: [
        deployer.address,
        deploymentInfo.contracts.MockUSDC,
        deploymentInfo.parameters.treasury,
        deploymentInfo.parameters.maxPurchasePerOrder,
        deploymentInfo.parameters.repayScoreIncrease,
        deploymentInfo.parameters.liquidateScoreDecrease,
        deploymentInfo.parameters.earlyRepayDiscountBps,
        deploymentInfo.parameters.minInstallmentAmountBps,
      ],
    });
    console.log("✅ BNPLInstallmentsProrated verified");
  } catch (error) {
    console.log("⚠️ BNPL verification failed:", error.message);
  }

  console.log("\n🎉 Verification complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  });
