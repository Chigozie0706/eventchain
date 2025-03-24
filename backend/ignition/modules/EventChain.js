const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("ethers");

/**
 * @notice List of supported token addresses for EventChain transactions.
 * @dev These are predefined token addresses on the blockchain that can be used for ticket purchases.
 *      Make sure these addresses are correct and available on the target network.
 */

const _supportedTokens = [
  ethers.getAddress("0x874069fa1eb16d44d622f2e0ca25eea172369bc1"), // cUSD (Celo Dollar)
  ethers.getAddress("0x10c892A6EC43a53E45D0B916B4b7D383B1b78C0F"), // cEUR (Celo Euro)
  ethers.getAddress("0xE4D517785D091D3c54818832dB6094bcc2744545"), // cREAL (Celo Real)
];

/**
 * @notice Deployment module for the EventChain smart contract.
 * @dev Uses Hardhat Ignition to deploy the EventChain contract with predefined supported tokens.
 * @param {object} m - The module deployment object provided by Hardhat Ignition.
 * @return {object} An object containing the deployed EventChain contract instance.
 */
module.exports = buildModule("EventChainModule", (m) => {
  const eventChain = m.contract("EventChain", [_supportedTokens]);
  return { eventChain };
});
