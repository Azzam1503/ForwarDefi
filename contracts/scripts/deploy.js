const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deploying contracts with account:", deployer.address);
  console.log("Network:", network.name, "Chain ID:", network.chainId);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "AVAX");

  // Deploy MockUSDC first
  console.log("\n📄 Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const mockUSDC = await MockUSDC.deploy();
  await mockUSDC.waitForDeployment();
  console.log("✅ MockUSDC deployed to:", await mockUSDC.getAddress());

  // Contract parameters
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  const maxPurchasePerOrder =
    process.env.MAX_PURCHASE_PER_ORDER || "10000000000"; // 10k USDC
  const repayScoreIncrease = process.env.REPAY_SCORE_INCREASE || "50";
  const liquidateScoreDecrease = process.env.LIQUIDATE_SCORE_DECREASE || "100";
  const earlyRepayDiscountBps = process.env.EARLY_REPAY_DISCOUNT_BPS || "2000"; // 20%
  const minInstallmentAmountBps =
    process.env.MIN_INSTALLMENT_AMOUNT_BPS || "5000"; // 50%

  console.log("\n📄 Deploying BNPL Contract...");
  console.log("Parameters:");
  console.log("- Token (MockUSDC):", await mockUSDC.getAddress());
  console.log("- Treasury:", treasuryAddress);
  console.log("- Max Purchase:", maxPurchasePerOrder);
  console.log("- Repay Score Increase:", repayScoreIncrease);
  console.log("- Liquidate Score Decrease:", liquidateScoreDecrease);
  console.log("- Early Repay Discount:", earlyRepayDiscountBps, "bps");
  console.log("- Min Installment Amount:", minInstallmentAmountBps, "bps");

  const BNPLContract = await ethers.getContractFactory(
    "BNPLInstallmentsProrated"
  );
  const bnpl = await BNPLContract.deploy(
    deployer.address, // initialOwner
    await mockUSDC.getAddress(), // token
    treasuryAddress, // treasury
    maxPurchasePerOrder,
    repayScoreIncrease,
    liquidateScoreDecrease,
    earlyRepayDiscountBps,
    minInstallmentAmountBps
  );
  await bnpl.waitForDeployment();
  console.log("✅ BNPL Contract deployed to:", await bnpl.getAddress());

  // Fund some initial liquidity (10k USDC)
  console.log("\n💰 Setting up initial liquidity...");
  const initialLiquidity = ethers.parseUnits("10000", 6); // 10k USDC

  console.log("Minting USDC to deployer...");
  const mintTx = await mockUSDC.mint(deployer.address, initialLiquidity);
  await mintTx.wait();

  console.log("Approving BNPL contract to spend USDC...");
  const approveTx = await mockUSDC.approve(
    await bnpl.getAddress(),
    initialLiquidity
  );
  await approveTx.wait();

  console.log("Funding liquidity pool...");
  const fundTx = await bnpl.fundLiquidity(initialLiquidity);
  await fundTx.wait();

  console.log(
    "✅ Funded",
    ethers.formatUnits(initialLiquidity, 6),
    "USDC to pool"
  );

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number(network.chainId),
    deployer: deployer.address,
    contracts: {
      MockUSDC: await mockUSDC.getAddress(),
      BNPLInstallmentsProrated: await bnpl.getAddress(),
    },
    parameters: {
      treasury: treasuryAddress,
      maxPurchasePerOrder: maxPurchasePerOrder.toString(),
      repayScoreIncrease: repayScoreIncrease.toString(),
      liquidateScoreDecrease: liquidateScoreDecrease.toString(),
      earlyRepayDiscountBps: earlyRepayDiscountBps.toString(),
      minInstallmentAmountBps: minInstallmentAmountBps.toString(),
    },
    deployedAt: new Date().toISOString(),
  };

  console.log("\n📋 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));

  // Write to file for backend integration
  const fs = require("fs");
  fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\n✅ Deployment info saved to deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
