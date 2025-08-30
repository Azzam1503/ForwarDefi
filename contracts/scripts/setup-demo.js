const { ethers } = require("hardhat");
const deploymentInfo = require("../deployment.json");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🎬 Setting up demo data...");
  console.log("Using account:", deployer.address);

  // Get contract instances
  const mockUSDC = await ethers.getContractAt(
    "MockUSDC",
    deploymentInfo.contracts.MockUSDC
  );
  const bnpl = await ethers.getContractAt(
    "BNPLInstallmentsProrated",
    deploymentInfo.contracts.BNPLInstallmentsProrated
  );

  // Create demo addresses (valid checksummed addresses)
  const demoUsers = [
    "0x742d35Cc6635C0532925a3b8C17D35156d6da2e1", // high score user
    "0x8ba1f109551bD432803012645Hac136c22C177e9", // medium score user
    "0x1234567890123456789012345678901234567890", // low score user
  ];

  // Validate and checksum addresses
  const validDemoUsers = demoUsers.map((addr) => {
    try {
      return ethers.getAddress(addr); // This will checksum the address
    } catch (error) {
      console.log(`Invalid address ${addr}, generating random address...`);
      return ethers.Wallet.createRandom().address;
    }
  });

  console.log("\n👥 Setting up credit scores...");
  // Set credit scores for demo users
  await bnpl.setCreditScore(validDemoUsers[0], 850); // High tier
  await bnpl.setCreditScore(validDemoUsers[1], 650); // Medium tier
  await bnpl.setCreditScore(validDemoUsers[2], 400); // Low tier
  await bnpl.setCreditScore(deployer.address, 900); // Deployer high score

  console.log("✅ Credit scores set:");
  console.log(`- ${validDemoUsers[0]}: 850 (High tier)`);
  console.log(`- ${validDemoUsers[1]}: 650 (Medium tier)`);
  console.log(`- ${validDemoUsers[2]}: 400 (Low tier)`);
  console.log(`- ${deployer.address}: 900 (Deployer)`);

  // Mint some USDC to demo users for collateral
  console.log("\n💰 Minting demo USDC...");
  const demoAmount = ethers.parseUnits("1000", 6); // 1k USDC each

  for (const user of validDemoUsers) {
    await mockUSDC.mint(user, demoAmount);
  }
  await mockUSDC.mint(deployer.address, demoAmount);

  console.log("✅ Minted 1000 USDC to each demo address");

  // Display tier information
  console.log("\n📊 Current Tiers:");
  const tiersCount = await bnpl.getTiersCount();
  for (let i = 0; i < tiersCount; i++) {
    const tier = await bnpl.tiers(i);
    console.log(
      `Tier ${i}: minScore=${tier.minScore}, collateral=${
        tier.collateralBps
      }bps, fee=${tier.feeBps}bps, maxLoan=${ethers.formatUnits(
        tier.maxLoan,
        6
      )} USDC`
    );
  }

  console.log("\n🎯 Demo quotes for 1000 USDC purchase:");
  const purchaseAmount = ethers.parseUnits("1000", 6);

  for (let i = 0; i < validDemoUsers.length; i++) {
    try {
      const quote = await bnpl.quote(purchaseAmount, validDemoUsers[i]);
      console.log(
        `${validDemoUsers[i]} (score ${
          i === 0 ? 850 : i === 1 ? 650 : 400
        }): collateral=${ethers.formatUnits(
          quote.collateralRequired,
          6
        )} USDC, fee=${ethers.formatUnits(quote.totalFee, 6)} USDC`
      );
    } catch (error) {
      console.log(`${validDemoUsers[i]}: ${error.message}`);
    }
  }

  console.log("\n🎉 Demo setup complete!");
  console.log("\nContract addresses saved in deployment.json");
  console.log("You can now integrate these addresses in your NestJS backend");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Demo setup failed:", error);
    process.exit(1);
  });
