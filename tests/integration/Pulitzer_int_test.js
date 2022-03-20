const {assert, expect} = require("chai")
const {network, ethers, run} = require("hardhat")
const {
    developmentChains,
    networkConfig,
} = require("../../helper-hardhat-config")
const {autoFundCheck} = require("../../helper-functions")

developmentChains.includes(network.name)
    ? describe.skip // skip integration test in development chains
    : describe("Pulitzer Staging Tests", async function () {
        let pulitzerContract, linkTokenAddress
        let deployer
        const domain = "0xgs.dev"

        beforeEach(async () => {
            const chainId = network.config.chainId
            deployer = (await ethers.getSigners())[0]
            pulitzerContract = await ethers.getContract("PulitzerContract")
            linkTokenAddress = networkConfig[network.config.chainId].linkToken
            const fee = networkConfig[chainId]["fee"]
            const additionalMessage = ` --linkaddress  ${linkTokenAddress} --fundamount ${fee}`
            if (await autoFundCheck(pulitzerContract.address, network.name, linkTokenAddress, additionalMessage)) {
                await run("fund-link", {
                    contract: pulitzerContract.address,
                    linkaddress: linkTokenAddress,
                    fundamount: fee,
                })
            }

            await pulitzerContract.forgetMe()
        })

        afterEach(async function () {
            pulitzerContract.removeAllListeners()
        })

        it("Successfully verifies the domain", async function () {

            this.timeout(600000) // 10 minutes max

            await new Promise(async (resolve, reject) => {
                pulitzerContract.once("VerificationRequested", async (requester, domain, proofBody, event) => {
                    console.log(`VerificationRequested: requested by ${requester} for ${domain}, with proof ${proofBody}`)
                })

                pulitzerContract.once("VerificationPerformed", async () => {
                    console.log("VerificationPerformed event fired!")
                    try {
                        const domainVerified = await pulitzerContract.isDomainVerified(domain, deployer.address)
                        assert(domainVerified, "The domain is verified! 🍻")
                        resolve()
                    } catch (e) {
                        reject(e)
                    }
                })

                const transaction = await pulitzerContract.requestProofVerification(
                    domain
                )
                const transactionReceipt = await transaction.wait(1)
                const requestId = transactionReceipt.events[0].topics[1]
                console.log(`Request ID: ${requestId}`)

            })
        })

    })
