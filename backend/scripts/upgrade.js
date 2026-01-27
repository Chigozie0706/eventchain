const { ethers, upgrades } = require("hardhat");

/**
 * Upgrade EventChain V1 to V2 with GoodDollar integration
 * Run: npx hardhat run scripts/upgrade-to-v2.js --network celo_sepolia
 */

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🔄 Upgrading EventChain V1 → V2 (GoodDollar Integration)");
  console.log("=".repeat(60) + "\n");

  // Get proxy address from environment variable
  const PROXY_ADDRESS = process.env.EVENT_CHAIN_PROXY;

  if (!PROXY_ADDRESS || PROXY_ADDRESS === "") {
    console.error("❌ Error: EVENT_CHAIN_PROXY not set in .env file");
    console.log("\nAdd to your .env file:");
    console.log("EVENT_CHAIN_PROXY=0x...\n");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();
  const networkName = network.name;

  console.log("📍 Upgrading from:  ", deployer.address);
  console.log("📍 Proxy address:   ", PROXY_ADDRESS);
  console.log("🌍 Network:         ", networkName);

  // Get current implementation
  const currentImpl = await upgrades.erc1967.getImplementationAddress(
    PROXY_ADDRESS
  );
  console.log("📦 Current impl:    ", currentImpl);

  // Determine GoodDollar Engagement Rewards address based on network
  let engagementRewardsAddress;

  if (networkName === "celo_sepolia" || networkName === "celo_testnet") {
    // DEV Engagement Rewards (for testing - anyone can approve apps)
    engagementRewardsAddress = "0xb44fC3A592aDaA257AECe1Ae8956019EA53d0465";
    console.log("🧪 Using DEV Engagement Rewards (Testnet)");
  } else if (networkName === "celo_mainnet" || networkName === "celo") {
    // PROD Engagement Rewards (requires Good Labs approval)
    engagementRewardsAddress = "0x25db74CF4E7BA120526fd87e159CF656d94bAE43";
    console.log("🌐 Using PROD Engagement Rewards (Mainnet)");
  } else {
    console.error("❌ Error: Unsupported network");
    console.log("\nSupported networks: celo_sepolia, celo_mainnet");
    process.exit(1);
  }

  console.log("🎁 Rewards contract:", engagementRewardsAddress);

  console.log("\n⏳ Preparing upgrade...\n");

  // Get the V2 contract factory
  const EventChainV2 = await ethers.getContractFactory("EventChainV2");

  // Validate upgrade safety
  console.log("🔍 Validating upgrade safety...");
  await upgrades.validateUpgrade(PROXY_ADDRESS, EventChainV2, {
    kind: "uups",
  });
  console.log("✅ Upgrade validation passed!\n");

  // Perform upgrade
  console.log("⏳ Upgrading contract to V2...");
  const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, EventChainV2, {
    kind: "uups",
  });

  await upgraded.waitForDeployment();

  const newImpl = await upgrades.erc1967.getImplementationAddress(
    PROXY_ADDRESS
  );

  console.log("\n✅ Upgrade to V2 Complete!\n");
  console.log("📋 Addresses:");
  console.log("   Proxy (unchanged): ", PROXY_ADDRESS);
  console.log("   Old implementation:", currentImpl);
  console.log("   New implementation:", newImpl);

  // Initialize V2 with GoodDollar
  console.log("\n⏳ Initializing V2 features (GoodDollar)...");
  
  try {
    const initTx = await upgraded.initializeV2(engagementRewardsAddress);
    await initTx.wait();
    console.log("✅ V2 initialization successful!");
  } catch (error) {
    if (error.message.includes("already initialized")) {
      console.log("⚠️  V2 already initialized (this is OK if re-running)");
    } else {
      throw error;
    }
  }

  // Verify upgrade
  console.log("\n🔍 Verifying upgrade...");
  const owner = await upgraded.owner();
  const eventCount = await upgraded.eventCount();
  const goodDollarEnabled = await upgraded.goodDollarEnabled();
  const engagementRewards = await upgraded.engagementRewards();

  console.log("   Owner:              ", owner);
  console.log("   Event count:        ", eventCount.toString());
  console.log("   GoodDollar enabled: ", goodDollarEnabled ? "✅" : "❌");
  console.log("   Engagement Rewards: ", engagementRewards);

  console.log("\n" + "=".repeat(60));
  console.log("🎉 UPGRADE TO V2 SUCCESSFUL!");
  console.log("=".repeat(60));
  console.log("\n📝 Next Steps:\n");
  
  console.log("1. Verify new implementation:");
  console.log(`   npx hardhat verify --network ${networkName} ${newImpl}\n`);
  
  console.log("2. Register your app with GoodDollar:");
  if (networkName === "celo_sepolia" || networkName === "celo_testnet") {
    console.log(`   🧪 DEV: https://engagement-rewards-dev.vercel.app`);
    console.log(`   💡 Anyone can approve apps in dev environment\n`);
  } else {
    console.log(`   🌐 PROD: Contact Good Labs for app approval`);
    console.log(`   📧 See: https://docs.gooddollar.org\n`);
  }
  
  console.log("3. Update your frontend:");
  console.log("   - Users can still use buyTicket() (V1 compatible)");
  console.log("   - New users should use buyTicketWithRewards()");
  console.log("   - No referral parameters needed (address(0) used)\n");

  console.log("4. Test V2 functionality:");
  console.log("   - Create an event");
  console.log("   - Buy ticket with rewards");
  console.log("   - Check GoodDollar rewards claimed\n");

  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Upgrade Failed:\n");
    console.error(error);
    console.log("\n💡 Troubleshooting:");
    console.log("   - Ensure you're the contract owner");
    console.log("   - Check proxy address is correct");
    console.log("   - Verify network is supported");
    console.log("   - Make sure V2 contract is compiled\n");
    process.exit(1);
  });