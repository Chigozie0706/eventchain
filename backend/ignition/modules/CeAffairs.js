const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const _cUSDAddress = "0x874069fa1eb16d44d622f2e0ca25eea172369bc1";

module.exports = buildModule("CeAffairsModule", (m) => {
  const ceAffairs = m.contract("CeAffairs", [_cUSDAddress]);
  return { ceAffairs };
});
