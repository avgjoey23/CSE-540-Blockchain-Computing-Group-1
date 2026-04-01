// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

/* 
    Allows issuers to be registered by contract owner. Contains an issuer mapping DID ID hash -> IPFS CID.
    Allows users to be registered. Contains a user mapping DID ID -> IPFS CID. 
    Contains internal mapping of user address -> user DID ID.

    Contains public functions for registration and mapping of DID ID -> IPFS CID.

    All DID IDs should be hashed with keccak256 before being sent to the contract. This is to minimize
    gas usage and storage costs.

    All IPFS CIDs should have the first 2 bytes (0x1220) stripped prior to sending to ensure the CID fits into
    a bytes32 type. The 2 byte prefix will need to be added back prior to use with IPFS.
*/
contract DIDRegistry {
    // creator of the contract, used for permission to add trusted issuers
    address public contractOwner;

    // events emitted when entities are registered
    event IssuerRegistered(bytes32 issuerDIDID, bytes32 issuerIPFSCID);
    event UserRegistered(bytes32 userDIDID, bytes32 userIPFSCID);

    // map issuer DID ID to issuer IPFS CID
    mapping(bytes32 issuerDIDID => bytes32 issuerIPFSCID) private _issuerDIDIDToIssuerIPFSCID;

    // map issuer address to bool. This is used for testing whether an address is a trusted issuer
    mapping(address issuer => bool) _issuerAddresses;

    // map user DID ID to user IPFS CID
    mapping(bytes32 userDIDID => bytes32 userIPFSCID) private _userDIDIDToUserIPFSCID;

    // map user address to their DID ID
    mapping(address user => bytes32 userDIDID) private _userAddressToDIDID;

    // set deployer as contractOwner
    constructor() {
        contractOwner = msg.sender;
    }

    // Adds a trusted issuer mapping and address. Can only be called by the contract owner address.
    function registerIssuer(address issuerAddress, bytes32 issuerDIDID, bytes32 issuerIPFSCID) external {
        require(
            msg.sender == contractOwner,
            "Only the contract owner can add trusted issuers."
        );

        _issuerAddresses[issuerAddress] = true;
        _issuerDIDIDToIssuerIPFSCID[issuerDIDID] = issuerIPFSCID;
        emit IssuerRegistered(issuerDIDID, issuerIPFSCID);
    }

    // Checks whether an address matches a trusted issuer. Needed by the CredentialStatus contract.
    function isTrustedIssuer(address issuerAddress) external view returns (bool) {
        return _issuerAddresses[issuerAddress];
    }

    // Gets an issuer IPFSCID given the issuer DID ID. Returns 0x00.. if issuer DID ID does not exist.
    function getIssuerIPFSCID(bytes32 issuerDIDID) external view returns (bytes32) {
        return _issuerDIDIDToIssuerIPFSCID[issuerDIDID];
    }

    // Adds a user mapping. The key must not already exist in the mapping.
    function registerUser(bytes32 userDIDID, bytes32 userIPFSCID) external {
        require(
            _userDIDIDToUserIPFSCID[userDIDID] == bytes32(0),
            "User DID ID already exists."
        );

        _userDIDIDToUserIPFSCID[userDIDID] = userIPFSCID;
        _userAddressToDIDID[msg.sender] = userDIDID;
        emit UserRegistered(userDIDID, userIPFSCID);
    }

    // Updates a user mapping. The key must already exist in the mapping, and only the original calling address can update.
    function updateUser(bytes32 userDIDID, bytes32 userIPFSCID) external {
        require(
            _userDIDIDToUserIPFSCID[userDIDID] != bytes32(0),
            "User DID ID does not exist."
        );

        require(
            userDIDID == _userAddressToDIDID[msg.sender],
            "Message sender is not DID ID owner."
        );

        _userDIDIDToUserIPFSCID[userDIDID] = userIPFSCID;
        emit UserRegistered(userDIDID, userIPFSCID);
    }

    // Gets a user IPFSCID given the user DID ID. Returns 0x00.. empty if user DID ID does not exist.
    function getUserIPFSCID(bytes32 userDIDID) external view returns (bytes32) {
        return _userDIDIDToUserIPFSCID[userDIDID];
    }
}