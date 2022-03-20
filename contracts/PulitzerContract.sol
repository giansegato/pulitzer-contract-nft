// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

import "contracts/domains/DomainManager.sol";

contract PulitzerContract is ChainlinkClient, ERC721URIStorage {
    using Chainlink for Chainlink.Request;

    event VerificationRequested(address requester, string domain, string proofBody);
    event VerificationPerformed(
        address requester,
        bytes32 domainHash,
        bool result
    );
    event TokenMint(address _to, uint256 _tokenId, string _uri);

    struct DomainRequest {
        address requester;
        bytes32 domainHash;
    }
    mapping(address => bytes32[]) public verifiedDomains;
    mapping(bytes32 => DomainRequest) private verificationQueue;

    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    uint256 public tokenCounter;

    constructor(
        address _oracle,
        address _linkToken,
        bytes32 _jobId,
        uint256 _fee
    ) ERC721("Pulitzer", "PUL") {
        tokenCounter = 0;

        if (_linkToken == address(0)) {
            setPublicChainlinkToken();
        } else {
            setChainlinkToken(_linkToken);
        }

        // TODO:
        // 1. make a pool of oracles, instead of using the default one
        // 2. delegate parameters to contracts a DAO can control, instead of hardcoding them
        // 3. a DAO can update the contract
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
    }

    function mint(
        string memory url /** author? pic? other data to embed in the on-chain tokenURI */
    ) public returns (uint256) {
        require(isAddressApprovedForUrl(url), "Address didn't verify domain.");

        uint256 newTokenId = tokenCounter;
        _safeMint(msg.sender, newTokenId);
        // TODO _setTokenURI(newTokenId, tokenURI);

        emit TokenMint(msg.sender, newTokenId, url);

        tokenCounter++;
        return newTokenId;
    }

    function formatTokenURI(string memory imageURI)
        public
        pure
        returns (string memory)
    {
        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{ "name":"SVG NFT" ',
                                ', "description":"An NFT based on SVG!" ',
                                ', "image":", ',
                                imageURI,
                                '" }'
                                // '{"name":"',
                                // "SVG NFT", // You can add whatever name here
                                // '", "description":"An NFT based on SVG!", "attributes":"", "image":"',
                                // imageURI,
                                // '"}'
                            )
                        )
                    )
                )
            );
    }

    function getDomainHash(string memory domain)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(domain));
    }

    /*
     * @dev Checks if the address can mint a new token with the given URL.
     */
    function isAddressApprovedForUrl(string memory url) public view returns (bool) {
        return _isDomainVerified(
                getDomainHash(_extractDomain(url)),
                msg.sender
            );
    }

    /*
     * @dev Checks if the domain is verified by the address,
     *      looping through the verifiedDomains mapping.
     */
    function _isDomainVerified(bytes32 domainHash, address requester)
        internal
        view
        returns (bool)
    {
        bool isVerified = false;
        uint256 length = verifiedDomains[requester].length;
        for (uint256 i = 0; i < length; ) {
            if (verifiedDomains[requester][i] == domainHash) {
                isVerified = true;
                break;
            }
            unchecked {
                ++i;
            }
        }
        return isVerified;
    }

    function _extractDomain(string memory url)
        public
        pure
        returns (string memory)
    {
        return DomainManager.extractDomain(url);
    }

    function requestProofBody(address requester) public pure returns (string memory) {
        return DomainManager.generateProof(requester);
    }

    function _validateDomain(string memory domain) public view returns (bool) {
        return DomainManager.validateDomain(domain);
    }

    /*
     * @dev The domain verification request is sent to the oracle,
     *      and will be processed asynchronously.
     */
    function requestProofVerification(string memory _domain)
        public
        returns (bytes32 requestId)
    {
        require(_validateDomain(_domain), "Invalid domain.");
        bytes32 domainHash = getDomainHash(_domain);
        require(!_isDomainVerified(domainHash, msg.sender), "Domain already verified.");

        Chainlink.Request memory request = buildChainlinkRequest(
            jobId,
            address(this),
            this.fulfill.selector
        );
        request.add("type", "TXT");
        request.add("name", _domain);
        request.add("record", requestProofBody(msg.sender));
        bytes32 rid = sendChainlinkRequestTo(oracle, request, fee);

        // Add to the verification queue the hashed domain, and the requester
        verificationQueue[rid] = DomainRequest(
            msg.sender,
            domainHash
        );
        emit VerificationRequested(msg.sender, _domain, requestProofBody(msg.sender));

        return rid;
    }

    /*
     * @dev This function is called by the oracle when the verification is performed.
     *      `recordChainlinkFulfillment` will ensure that only the requesting oracle
     *      can fulfill the request.
     */
    function fulfill(bytes32 _requestId, bool _proof)
        public
        recordChainlinkFulfillment(_requestId)
    {
        if (_proof) {
            DomainRequest memory request = verificationQueue[_requestId];
            verifiedDomains[request.requester].push(request.domainHash);
            emit VerificationPerformed(
                request.requester,
                request.domainHash,
                _proof
            );
        } else {
            emit VerificationPerformed(
                address(0),
                bytes32(0),
                false
            );
        }
        delete verificationQueue[_requestId];
    }
}
