const { ethers, upgrades, network } = require("hardhat");

async function main() {
  console.log("\n🔧 Initializing EventChain V2 features...\n");

  const proxyAddress = process.env.EVENT_CHAIN_PROXY;
  if (!proxyAddress) {
    throw new Error("❌ EVENT_CHAIN_PROXY not set");
  }

  const networkName = network.name;
  let engagementRewardsAddress;

  if (networkName === "celo_sepolia") {
    engagementRewardsAddress = "0xb44fC3A592aDaA257AECe1Ae8956019EA53d0465";
  } else if (networkName === "celo_mainnet") {
    engagementRewardsAddress = "0x25db74CF4E7BA120526fd87e159CF656d94bAE43";
  } else {
    throw new Error("❌ Unsupported network");
  }

  console.log("🌍 Network:", networkName);
  console.log("🏆 EngagementRewards:", engagementRewardsAddress);

  const EventChainV2 = await ethers.getContractFactory("EventChainV2");
  const proxy = EventChainV2.attach(proxyAddress);

  const tx = await proxy.initializeV2(engagementRewardsAddress);
  await tx.wait();

  console.log("✅ V2 initialized successfully");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
