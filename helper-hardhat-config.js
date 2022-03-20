const networkConfig = {
  default: {
    name: "localhost",
    fee: "100000000000000000",
  },
  31337: {
    name: "localhost",
    fee: "100000000000000000",
  },
  42: {
    name: "kovan",
    linkToken: "0xa36085F69e2889c224210F603D836748e7dC0088",
    ethUsdPriceFeed: "0x9326BFA02ADD2366b30bacB125260Af641031331",
    keyHash: "0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4",
    vrfCoordinator: "0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9",
    oracle: "0xfF07C97631Ff3bAb5e5e5660Cdf47AdEd8D4d4Fd",
    jobId: "791bd73c8a1349859f09b1cb87304f71",
    fee: "100000000000000000",
    fundAmount: " ",
  },
  4: {
    name: "rinkeby",
    linkToken: "0x01be23585060835e02b77ef475b0cc51aa1e0709",
    ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    keyHash: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    vrfCoordinator: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    oracle: "0xc57b33452b4f7bb189bb5afae9cc4aba1f7a4fd8",
    jobId: "6b88e0402e5d415eb946e528b8e0c7ba",
    fee: "100000000000000000",
    fundAmount: "100000000000000000",
  },
  1: {
    name: "mainnet",
    linkToken: "0x514910771af9ca656af840dff83e8264ecf986ca",
    oracle: "0x240BaE5A27233Fd3aC5440B5a598467725F7D1cd",
    jobId: "6ca2e68622bd421d98c648f056ee7c76",
    fee: "2000000000000000000",
  },
  5: {
    name: "goerli",
    linkToken: "0x326c977e6efc84e512bb9c30f76e30c160ed06fb",
  },
  137: {
    name: "polygon",
    linkToken: "0xb0897686c545045afc77cf20ec7a532e3120e0f1",
    ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    oracle: "0x63B72AF260E8b40A7b89E238FeB53448A97b03D2",
    jobId: "f3daed2990114e98906aaf21c4172da3",
    fee: "100000000000000",
  },
}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6

module.exports = {
  networkConfig,
  developmentChains,
  VERIFICATION_BLOCK_CONFIRMATIONS,
}
