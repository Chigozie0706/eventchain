require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require('@openzeppelin/hardhat-upgrades');
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR-based compilation to fix "Stack Too Deep"
    },
  },
  etherscan: {
    enabled: false, // Disable Etherscan verification
  },

  sourcify: {
    enabled: true,
  },

  etherscan: {
    customChains: [
      {
        network: "celo_mainnet",
        chainId: 42220,
        urls: {
          apiURL: "https://api.celoscan.io/api", // Correct API URL for verification
          browserURL: "https://celoscan.io",
        },
      },
      {
        network: "celo_alfajores",
        chainId: 44787,
        urls: {
          apiURL: "https://api-alfajores.celoscan.io/api",
          browserURL: "https://alfajores.celoscan.io",
        },
      },
    ],
  },

  networks: {
    celo_alfajores: {
      url: `https://alfajores-forno.celo-testnet.org`,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 44787,
    },

    celo_sepolia: {
      url: `https://forno.celo-sepolia.celo-testnet.org`,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 11142220,
    },

    celo_mainnet: {
      url: `https://forno.celo.org`,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 42220,
    },
  },
};
