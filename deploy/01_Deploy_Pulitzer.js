const { getNamedAccounts, deployments, network } = require("hardhat");
const {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} = require("../helper-hardhat-config");

const { autoFundCheck, verify } = require("../helper-functions");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy, log, get } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId()
  let linkTokenAddress
  let oracle
  let jobId
  let additionalMessage = ""

  //set log level to ignore non errors
  ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR);

  if (chainId == 31337) {
    let linkToken = await get("LinkToken");
    let MockOracle = await get("MockOracle");
    linkTokenAddress = linkToken.address;
    oracle = MockOracle.address;
    additionalMessage = " --linkaddress " + linkTokenAddress;
    jobId = ethers.utils.toUtf8Bytes("00000000000000000000000000000000")
  } else {
    linkTokenAddress = networkConfig[chainId]["linkToken"];
    oracle = networkConfig[chainId]["oracle"];
    jobId = ethers.utils.toUtf8Bytes(networkConfig[chainId]["jobId"]);
  }
  const fee = networkConfig[chainId]["fee"];

  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;

  const args = [oracle, linkTokenAddress, jobId, fee];
  const pulitzerContract = await deploy("PulitzerContract", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY &&
    networkConfig[chainId]["saveDeployments"]
  ) {
    log("Verifying...");
    await verify(pulitzerContract.address, args);
  }

  log("----------------------------------------------------");
};
module.exports.tags = ["all", "pulitzer", "main"];
