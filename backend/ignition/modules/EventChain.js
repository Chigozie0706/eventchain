const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("ethers");

//const _cUSDAddress = "0x874069fa1eb16d44d622f2e0ca25eea172369bc1";
//const _mentoExchange = "0x7d28570135A2B1930F331c507F65039D4937f66c";
const _mentoExchange = ethers.getAddress(
  "0x7d28570135a2b1930f331c507f65039d4937f66c"
); // Convert to checksummed address

const _supportedTokens = [
  "0x874069fa1eb16d44d622f2e0ca25eea172369bc1", // cUSD
  "0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F", // cEUR
  "0xE4D517785D091D3c54818832dB6094bcc2744545", // cCOP
];

module.exports = buildModule("EventChainModule", (m) => {
  const eventChain = m.contract("EventChain", [
    _mentoExchange,
    _supportedTokens,
  ]);
  return { eventChain };
});
