const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const { developmentChains, networkConfig} = require("../../helper-hardhat-config")


!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Pulitzer Unit Tests", async function () {
      let pulitzerContract
      let deployer

      beforeEach(async () => {
        const chainId = network.config.chainId
        deployer = (await ethers.getSigners())[0]
        await deployments.fixture(["mocks", "pulitzer"])
        linkToken = await ethers.getContract("LinkToken")
        linkTokenAddress = linkToken.address
        additionalMessage = ` --linkaddress  ${linkTokenAddress}`
        pulitzerContract = await ethers.getContract("PulitzerContract")
        mockOracle = await ethers.getContract("MockOracle")

        await hre.run("fund-link", {
          contract: pulitzerContract.address,
          linkaddress: linkTokenAddress,
          fundamount: networkConfig[chainId]["fee"],
        })
      })

      it("Should successfully extract the domain from a given URL", async () => {
        let domain
        domain = await pulitzerContract._extractDomain(
          "https://www.google.com"
        )
        console.log(`https://www.google.com -> ${domain}`)
        expect(domain).to.equal("google.com")
        domain = await pulitzerContract._extractDomain(
          "http://giansegato.com/essays/how-i-beat-the-berlin///"
        )
        console.log(`http://giansegato.com/essays/how-... -> ${domain}`)
        expect(domain).to.equal("giansegato.com")
        domain = await pulitzerContract._extractDomain(
          "http://www.giansegato.com///essays/how-i-beat-the-berlin///"
        )
        console.log(`http://www.giansegato.com///essays/... -> ${domain}`)
        expect(domain).to.equal("giansegato.com")
      })

      it("Should successfully validate domain format", async () => {
        const valid = await pulitzerContract._validateDomain("google.com")
        expect(valid).to.be.true
        let invalid = await pulitzerContract._validateDomain(
          "https://google.com"
        )
        expect(invalid).to.be.false
        invalid = await pulitzerContract._validateDomain("www.google.com")
        expect(invalid).to.be.false
      })

      it("Should successfully generate a proof", async () => {
        const proof = await pulitzerContract.requestProofBody(deployer.address)
        console.log("proof: ", proof)
        expect(proof).to.not.be.null
      })

      it("Should successfully make a domain verification request", async () => {
        const transaction = await pulitzerContract.requestProofVerification(
          "giansegato.com"
        )
        const transactionReceipt = await transaction.wait(1)
        const requestId = transactionReceipt.events[0].topics[1]
        console.log("requestId: ", requestId)
        expect(requestId).to.not.be.null
      })

      it("Should successfully make domain verification request and get a result", async () => {
        const domain = "giansegato.com"
        const url = "https://giansegato.com/something/else"

        const initialState = await pulitzerContract.isAddressApprovedForUrl(
          url
        )
        console.log(`${domain} is verified -> ${initialState}`)
        expect(initialState).to.be.false

        const transaction = await pulitzerContract.requestProofVerification(
          domain
        )
        const transactionReceipt = await transaction.wait(1)
        const requestId = transactionReceipt.events[0].topics[1]
        const callbackValue = true
        await mockOracle.fulfillOracleRequest(requestId, callbackValue)

        const proof = await pulitzerContract.isAddressApprovedForUrl(url)
        console.log(`${domain} is verified -> ${proof}`)
        assert.equal(proof, callbackValue)
      })

      it("Should prevent unknown addresses from minting a URL they haven't verified", async () => {
        const domain = "giansegato.com"
        const maliciousUrl = "https://google.com/something/else"

        const transaction = await pulitzerContract.requestProofVerification(
          domain
        )
        const transactionReceipt = await transaction.wait(1)
        const requestId = transactionReceipt.events[0].topics[1]
        const callbackValue = true
        await mockOracle.fulfillOracleRequest(requestId, callbackValue)
        await expect(pulitzerContract.mint(maliciousUrl)).to.be.revertedWith(
          "Address didn't verify domain."
        )
        console.log("Address didn't verify domain.")
      })

      it("Should prevent known addresses from minting a URL they haven't verified", async () => {
        const domain = "giansegato.com"
        const url = "https://giansegato.com/something/else"
        const callbackValue = false

        const transaction = await pulitzerContract.requestProofVerification(
          domain
        )
        const transactionReceipt = await transaction.wait(1)
        const requestId = transactionReceipt.events[0].topics[1]
        await mockOracle.fulfillOracleRequest(requestId, callbackValue)
        await expect(pulitzerContract.mint(url)).to.be.revertedWith(
          "Address didn't verify domain."
        )
        console.log("Address didn't successfully verify domain.")
      })

      it("An event is successfully fired when a domain is verified", async function () {
        this.timeout(10000) // 10 seconds
        const callbackValue = true
        const domain = "giansegato.com"
        const url = "https://giansegato.com/something/else"

        await new Promise(async (resolve, reject) => {
          pulitzerContract.once("VerificationPerformed", async () => {
            console.log("VerificationPerformed event fired!")
            const proof = await pulitzerContract.isAddressApprovedForUrl(url)
            try {
              assert.equal(proof, callbackValue)
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
          await mockOracle.fulfillOracleRequest(requestId, callbackValue)
        })
      })

      it("Should allow known addresses to mint a verified URLs", async function () {
        this.timeout(10000) // wait 10 seconds max

        const domain = "giansegato.com"
        const url = "https://giansegato.com/something/else"
        const callbackValue = true

        const transaction = await pulitzerContract.requestProofVerification(
          domain
        )
        const transactionReceipt = await transaction.wait(1)
        const requestId = transactionReceipt.events[0].topics[1]
        await mockOracle.fulfillOracleRequest(requestId, callbackValue)

        // we setup a promise so we can wait for our callback from the `once` function
        await new Promise(async (resolve, reject) => {
          // setup listener for our event
          pulitzerContract.once("TokenMint", async () => {
            console.log("TokenMint event fired!")
            const tokensMined = await pulitzerContract.tokenCounter()
            try {
              assert.equal(tokensMined, 1)
              resolve()
            } catch (e) {
              reject(e)
            }
          })

          await pulitzerContract.mint(url)
        })
      })
      
    })
