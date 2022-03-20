require("dotenv").config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@appliedblockchain/chainlink-plugins-fund-link");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("./tasks");

const _infuraEndpoint = "infura.io/v3/";
// const _alchemyEndpoint = "https://eth-kovan.alchemyapi.io/v2/";

const KOVAN_RPC_URL = `https://kovan.${_infuraEndpoint}${process.env.INFURA_API_KEY}`;
const RINKEBY_RPC_URL = `https://rinkeby.${_infuraEndpoint}${process.env.INFURA_API_KEY}`;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SAVE_DEPLOYMENTS = process.env.SAVE_DEPLOYMENTS || false;
const REPORT_GAS = process.env.REPORT_GAS || false;

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      chainId: 31337,
    },
    kovan: {
      url: KOVAN_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      chainId: 42,
      saveDeployments: SAVE_DEPLOYMENTS,
    },
    rinkeby: {
      url: RINKEBY_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      saveDeployments: SAVE_DEPLOYMENTS,
      chainId: 4,
    },
  },
  etherscan: {
    // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
      rinkeby: ETHERSCAN_API_KEY,
      kovan: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
      1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
    },
    feeCollector: {
      default: 1,
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.7",
      },
      {
        version: "0.6.6",
      },
      {
        version: "0.4.24",
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 3000000,
  },
  gasReporter: {
    enabled: REPORT_GAS,
    currency: "USD",
    // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
};
