const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CeAffairsModule", (m) => {
  const ceAffairs = m.contract("CeAffairs"); // ✅ Proper structure
  return { ceAffairs };
});
