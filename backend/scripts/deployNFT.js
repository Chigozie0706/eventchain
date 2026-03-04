const { ethers, upgrades, network } = require("hardhat");

/**
 * Deploy upgradeable EventTicketNFT contract
 * Must be run AFTER deploy.js
 * Run: npx hardhat run scripts/deployNFT.js --network celo_mainnet
 *
 * Requires EVENT_CHAIN_PROXY in your .env file
 */

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("🎟️  Deploying EventTicketNFT (Upgradeable)");
  console.log("=".repeat(60) + "\n");

  // ── Require EventChain proxy address ──────────────────────────
  const eventChainProxy = process.env.EVENT_CHAIN_PROXY;
  if (!eventChainProxy) {
    throw new Error(
      "EVENT_CHAIN_PROXY not set in .env — deploy EventChain first"
    );
  }

  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying from:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "CELO\n");

  const networkName = network.name;
  console.log("🌍 Network:", networkName);
  console.log("🔗 EventChain Proxy:", eventChainProxy, "\n");

  console.log("⏳ Deploying EventTicketNFT...\n");

  const EventTicketNFT = await ethers.getContractFactory("EventTicketNFT");

  const eventTicketNFT = await upgrades.deployProxy(
    EventTicketNFT,
    [eventChainProxy],
    {
      kind: "uups",
      initializer: "initialize",
    }
  );

  await eventTicketNFT.waitForDeployment();
  const nftProxyAddress = await eventTicketNFT.getAddress();

  console.log("✅ EventTicketNFT Proxy deployed!\n");
  console.log("📋 Proxy Address:", nftProxyAddress);

  // ── Wait for node to index the deployment ─────────────────────
  console.log("\n⏳ Waiting for network to index deployment (5s)...");
  await new Promise((resolve) => setTimeout(resolve, 5000));

  // ── Read implementation address safely ────────────────────────
  let nftImplementationAddress = "unknown";
  try {
    nftImplementationAddress =
      await upgrades.erc1967.getImplementationAddress(nftProxyAddress);
    console.log("📋 Implementation Address:", nftImplementationAddress);
  } catch (e) {
    console.log(
      "⚠️  Could not read implementation address automatically."
    );
    console.log(
      "   You can find it on CeloScan by looking up the proxy contract."
    );
  }

  // ── Verify NFT configuration ───────────────────────────────────
  console.log("\n🔍 Verifying NFT configuration...");
  const nftOwner = await eventTicketNFT.owner();
  const registeredEventChain = await eventTicketNFT.eventChainContract();
  const tokenCounter = await eventTicketNFT.tokenIdCounter();

  console.log("   Owner:               ", nftOwner);
  console.log(
    "   EventChain contract: ",
    registeredEventChain,
    registeredEventChain.toLowerCase() === eventChainProxy.toLowerCase()
      ? "✅"
      : "❌ MISMATCH — check EVENT_CHAIN_PROXY"
  );
  console.log("   Token counter:       ", tokenCounter.toString());

  // ── Wire NFT into EventChain ───────────────────────────────────
  console.log("\n⏳ Wiring NFT contract into EventChain...");

  const EventChain = await ethers.getContractFactory("EventChain");
  const eventChain = EventChain.attach(eventChainProxy);

  const setNFTTx = await eventChain.setTicketNFT(nftProxyAddress);
  await setNFTTx.wait();
  console.log("   setTicketNFT tx:     ", setNFTTx.hash);

  // Verify wiring
  const wiredNFT = await eventChain.ticketNFT();
  console.log(
    "   ticketNFT set:       ",
    wiredNFT,
    wiredNFT.toLowerCase() === nftProxyAddress.toLowerCase() ? "✅" : "❌"
  );

  console.log("\n" + "=".repeat(60));
  console.log("🎉 EventTicketNFT Deployment SUCCESS!");
  console.log("=".repeat(60));
  console.log("\n📝 Save these to your .env:\n");
  console.log(`   EVENT_TICKET_NFT_PROXY=${nftProxyAddress}`);
  if (nftImplementationAddress !== "unknown") {
    console.log(`   EVENT_TICKET_NFT_IMPL=${nftImplementationAddress}`);
  }
  console.log("\n📝 Next Steps:\n");
  console.log("1. (Optional) Set a base URI for all tickets:");
  console.log(`   await eventTicketNFT.setBaseURI("ipfs://your-base-cid/")\n`);
  console.log("2. Verify on CeloScan:");
  if (nftImplementationAddress !== "unknown") {
    console.log(
      `   npx hardhat verify --network ${networkName} ${nftImplementationAddress}\n`
    );
  } else {
    console.log(
      `   Find implementation address on CeloScan, then run:\n`
    );
    console.log(
      `   npx hardhat verify --network ${networkName} <IMPL_ADDRESS>\n`
    );
  }
  console.log("=".repeat(60) + "\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ NFT Deployment Failed:\n");
    console.error(error);
    process.exit(1);
  });