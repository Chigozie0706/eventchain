const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("ethers");

const _supportedTokens = [
  ethers.getAddress("0x874069fa1eb16d44d622f2e0ca25eea172369bc1"), // cUSD
  ethers.getAddress("0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F"), // cEUR
  ethers.getAddress("0xE4D517785D091D3c54818832dB6094bcc2744545"), // cCOP
];

module.exports = buildModule("EventChainModule", (m) => {
  const eventChain = m.contract("EventChain", [_supportedTokens]);
  return { eventChain };
});
