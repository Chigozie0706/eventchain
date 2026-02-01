const { ethers, upgrades, network } = require("hardhat");

/**
 * Deploy EventChainV2 as a fresh UUPS proxy
 *
 * Run:
 * npx hardhat run scripts/deploy-v2.js --network celo_sepolia
 * npx hardhat run scripts/deploy-v2.js --network celo_mainnet
 */

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Deploying EventChainV2 (UUPS Proxy)");
  console.log("=".repeat(60) + "\n");

  const [deployer] = await ethers.getSigners();

  console.log("📍 Deployer:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "CELO");

  const networkName = network.name;
  console.log("🌍 Network:", networkName);

  let supportedTokens = [];

  if (networkName === "celo_sepolia") {
    supportedTokens = [
      "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // cUSD
      "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F", // cEUR
      "0xE4D517785D091D3c54818832dB6094bcc2744545", // cREAL
      "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A", // G$
    ];
    console.log("🧪 Using Celo Sepolia tokens");
  } else if (networkName === "celo_mainnet") {
    supportedTokens = [
      "0x765DE816845861e75A25fCA122bb6898B8B1282a", // cUSD
      "0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73", // cEUR
      "0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787", // cREAL
      "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A", // G$
      "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e", // USDT
    ];
    console.log("🌐 Using Celo Mainnet tokens");
  } else {
    throw new Error("❌ Unsupported network");
  }

  console.log("🪙 Supported tokens:");
  supportedTokens.forEach((t, i) => console.log(`   ${i + 1}. ${t}`));

  console.log("\n⏳ Deploying EventChainV2...\n");

  const EventChainV2 = await ethers.getContractFactory("EventChainV2");

  const proxy = await upgrades.deployProxy(
    EventChainV2,
    [supportedTokens],
    {
      initializer: "initialize",
      kind: "uups",
    }
  );

  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  const implementationAddress =
    await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("✅ Deployment Successful!\n");
  console.log("📋 Contract Addresses:");
  console.log("   Proxy:          ", proxyAddress);
  console.log("   Implementation: ", implementationAddress);

  console.log("\n🔍 Verifying initial config...");
  console.log("   Owner:         ", await proxy.owner());
  console.log("   Event count:   ", (await proxy.eventCount()).toString());
  console.log("   CELO enabled:  ", await proxy.supportedTokens(ethers.ZeroAddress));
  console.log(
    "   G$ enabled:    ",
    await proxy.supportedTokens("0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A")
  );

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE");
  console.log("=".repeat(60));

  console.log("\n📝 Next Steps:");
  console.log(`1. Save proxy address:\n   EVENT_CHAIN_PROXY=${proxyAddress}`);
  console.log(
    `\n2. Verify implementation:\n   npx hardhat verify --network ${networkName} ${implementationAddress}`
  );
  console.log("\n3. Initialize V2 features (optional):");
  console.log(
    `   npx hardhat run scripts/init-v2.js --network ${networkName}`
  );
  console.log("\n4. Use proxy address in frontend ABI\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:\n", error);
    process.exit(1);
  });
