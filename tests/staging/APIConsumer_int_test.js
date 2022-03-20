const { assert, expect } = require("chai")
const { network, ethers, run } = require("hardhat")
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config")
const { autoFundCheck } = require("../../helper-functions")

developmentChains.includes(network.name)
  ? describe.skip // skip integration test in development chains
  : describe("Pulitzer Staging Tests", async function () {
      let pulitzerContract, linkTokenAddress
      const domain = "0xgs.dev"

      beforeEach(async () => {
        pulitzerContract = await ethers.getContract("PulitzerContract")
        linkTokenAddress = networkConfig[network.config.chainId].linkToken
        const accounts = await ethers.getSigners()
        const signer = accounts[0]
        if (await autoFundCheck(pulitzerContract.address, network.name, linkTokenAddress, "")) {
          await run("fund-link", {
            contract: pulitzerContract.address,
            linkaddress: linkTokenAddress,
            fundamount: networkConfig[chainId]["fee"],
          })
        }

        console.log(
          `Expected proof, given the owner ${signer.address}: ${await pulitzerContract.requestProofBody(
            signer.address
          )}`
        )
      })

      afterEach(async function () {
        pulitzerContract.removeAllListeners()
      })

      it("Successfully verifies the domain", async function () {
        
        this.timeout(600000) // 10 minutes max
        const domain = "0xgs.dev"

        await new Promise(async (resolve, reject) => {
          pulitzerContract.once("VerificationRequested", async (requester, domain, proofBody, event) => {
            console.log(`VerificationRequested: requested by ${requester} for ${domain}, with proof ${proofBody}`)
          })

          pulitzerContract.once("VerificationPerformed", async () => {
            console.log("VerificationPerformed event fired!")
            try {
              const domainHash = await pulitzerContract.getDomainHash(domain)
              const domainVerified = await pulitzerContract._isDomainVerified(domainHash)
              assert(domainVerified, "The domain is verified.")
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
          console.log(`Request domain verification, ID: ${requestId}`)
          
        })
      })
      
  })
