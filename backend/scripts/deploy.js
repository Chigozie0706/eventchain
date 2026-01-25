const { ethers, upgrades } = require("hardhat");

/**
 * Deploy upgradeable EventChain contract
 * Run: npx hardhat run scripts/deploy.js --network celo_sepolia
 */

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Deploying EventChain (Upgradeable)");
  console.log("=".repeat(60) + "\n");

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying from:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "CELO\n");

  // Supported tokens based on network
  const networkName = network.name;
  let supportedTokens = [];

  if (networkName === "celo_sepolia") {
    supportedTokens = [
      "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // cUSD Alfajores
      "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F", // cEUR Alfajores
      "0xE4D517785D091D3c54818832dB6094bcc2744545", // cREAL Alfajores
      "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A", // G$ (same on both networks)
    ];
    console.log("🌍 Network: Sepolia Testnet");
  } else if (networkName === "celo_mainnet") {
    supportedTokens = [
      "0x765DE816845861e75A25fCA122bb6898B8B1282a", // cUSD
      "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", // cEUR
      "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787", // cREAL
      "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A", // G$
      "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", // USDT
    ];
    console.log("🌍 Network: Celo Mainnet");
  } else {
    console.log("🌍 Network:", networkName);
  }

  console.log("🪙 Supported tokens:", supportedTokens.length);
  if (supportedTokens.length > 0) {
    supportedTokens.forEach((token, i) => {
      console.log(`   ${i + 1}. ${token}`);
    });
  }

  console.log("\n⏳ Deploying contracts...\n");

  const EventChain = await ethers.getContractFactory("EventChain");

  // Deploy with UUPS proxy
  const eventChain = await upgrades.deployProxy(
    EventChain,
    [supportedTokens],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  await eventChain.waitForDeployment();

  const proxyAddress = await eventChain.getAddress();
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    proxyAddress
  );

  console.log("✅ Deployment Complete!\n");
  console.log("📋 Contract Addresses:");
  console.log("   Proxy:          ", proxyAddress);
  console.log("   Implementation: ", implementationAddress);

  // Verify configuration
  console.log("\n🔍 Verifying configuration...");
  const owner = await eventChain.owner();
  const ubiPool = await eventChain.ubiPool();
  const celoSupported = await eventChain.supportedTokens(ethers.ZeroAddress);
  const gDollarSupported = await eventChain.supportedTokens(
    "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A"
  );

  console.log("   Owner:         ", owner);
  console.log("   UBI Pool:      ", ubiPool);
  console.log("   CELO supported:", celoSupported ? "✅" : "❌");
  console.log("   G$ supported:  ", gDollarSupported ? "✅" : "❌");

  console.log("\n" + "=".repeat(60));
  console.log("🎉 SUCCESS!");
  console.log("=".repeat(60));
  console.log("\n📝 Next Steps:\n");
  console.log("1. Save proxy address to .env:");
  console.log(`   EVENT_CHAIN_PROXY=${proxyAddress}\n`);
  console.log("2. Verify on CeloScan:");
  console.log(`   npx hardhat verify --network ${networkName} ${implementationAddress}\n`);
  console.log("3. To upgrade later:");
  console.log(`   npx hardhat run scripts/upgrade.js --network ${networkName}\n`);
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment Failed:\n");
    console.error(error);
    process.exit(1);
  });