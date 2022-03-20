// SPDX-License-Identifier: UNLICENSED
/*
 * @title Domain manager, for handling string-related tasks
 */

pragma solidity ^0.8.0;

import "contracts/domains/strings.sol";

import "hardhat/console.sol";

error InvalidSpec(string reason);

library DomainManager {
    using strings for *;

    /*
     * @dev Determines if a given domain is expressed with a valid format.
     */
    function validateDomain(string memory domain) internal view returns (bool) {
        strings.slice memory domainSlice = domain.toSlice();
        if (domainSlice.count("/".toSlice()) != 0) {
            console.log("Domain contains invalid character '/'");
            return false;
        }
        if (domainSlice.count(".".toSlice()) > 1) {
            console.log("Domain contains too many '.' characters");
            return false;
        }
        return true;
    }

    /*
     * @dev Extracts the domain from a given URL. 
     *      This function is very gas intensive.
     */
    function extractDomain(string memory url)
        internal
        pure
        returns (string memory)
    {
        strings.slice memory urlSlice = url.toSlice();
        strings.slice memory protocolSlice = "://".toSlice();
        if (urlSlice.count(protocolSlice) != 1) {
            revert InvalidSpec("Invalid URL.");
        }
        strings.slice memory part;
        urlSlice.split(protocolSlice, part); // part = (domain + path) - leaving out the protocol
        urlSlice.split("/".toSlice(), part); // part = domain
        // Only keeps the root domain (not allowing third-level domains verification)
        strings.slice memory dot = ".".toSlice();
        while (part.count(dot) > 1) {
            part.split(dot);
        }
        return part.toString();
    }
    
}
