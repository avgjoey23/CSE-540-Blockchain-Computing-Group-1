// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

/*
    Allows issuers to be registered by contract owner. Contains an issuer mapping DID ID -> IPFS CID.
    Allows users to be registered. Contains a user mapping DID ID -> IPFS CID. 
    Contains internal mapping of user address -> user DID ID

    Contains public functions for registration and mapping of DID ID -> IPFS CID

    TODO: use bytes32 as keys because it is cheaper
*/
contract DIDRegistry {
    // creator of the contract, used for permission to add trusted issuers
    address public contractOwner;

    // events emitted when entities are registered
    event IssuerRegistered(string issuerDIDID, string issuerIPFSCID);
    event UserRegistered(string userDIDID, string userIPFSCID);

    // map issuer DID ID to issuer IPFS CID
    mapping(string issuerDIDID => string issuerIPFSCID) private _issuerDIDIDToIssuerIPFSCID;

    // map user DID ID to user IPFS CID
    mapping(string userDIDID => string userIPFSCID) private _userDIDIDToUserIPFSCID;

    // map user DID ID to their address
    mapping(string userDIDID => address user) private _userDIDIDToAddress;

    // set deployer as contractOwner
    constructor() {
        contractOwner = msg.sender;
    }

    modifier onlyOwner {
       require(
            msg.sender == contractOwner,
            "Only the contract owner can add trusted issuers."
        ); 
        _;
    }

    modifier newUser(string calldata userDIDID) {
         require(
            bytes(_userDIDIDToUserIPFSCID[userDIDID]).length == 0,
            "User DID ID already exists."
        );
        _;
    }

    modifier onlyOriginalSender(string calldata userDIDID) {
        require(
            msg.sender == _userDIDIDToAddress[userDIDID],
            "Message sender is not DID ID owner."
        );
        _;
    }

    modifier updatesAllowed(string calldata userDIDID) {
         require(
            bytes(_userDIDIDToUserIPFSCID[userDIDID]).length != 0,
            "User DID ID does not exist."
        );

        require(
            msg.sender == _userDIDIDToAddress[userDIDID],
            "Message sender is not DID ID owner."
        );
        _;
    }

    // Adds a trusted issuer mapping. Can only be called by the contract owner address.
    function registerIssuer(string calldata issuerDIDID, string calldata issuerIPFSCID) onlyOwner external {
        _issuerDIDIDToIssuerIPFSCID[issuerDIDID] = issuerIPFSCID;
        emit IssuerRegistered(issuerDIDID, issuerIPFSCID);
    }

    // Gets an issuer IPFSCID given the issuer DID ID. Returns empty string if issuer DID ID does not exist.
    function getIssuerIPFSCID(string calldata issuerDIDID) external view returns (string memory) {
        return _issuerDIDIDToIssuerIPFSCID[issuerDIDID];
    }

    // Adds a user mapping. The key must not already exist in the mapping.
    function registerUser(string calldata userDIDID, string calldata userIPFSCID) newUser(userDIDID) external {
        _userDIDIDToUserIPFSCID[userDIDID] = userIPFSCID;
        _userDIDIDToAddress[userDIDID] = msg.sender;
        emit UserRegistered(userDIDID, userIPFSCID);
    }

    // Updates a user mapping. The key must already exist in the mapping, and only the original calling address can update.
    function updateUser(string calldata userDIDID, string calldata userIPFSCID) updatesAllowed(userDIDID) external {
        _userDIDIDToUserIPFSCID[userDIDID] = userIPFSCID;
        emit UserRegistered(userDIDID, userIPFSCID);
    }

    // Gets a user IPFSCID given the user DID ID. Returns empty string if user DID ID does not exist.
    function getUserIPFSCID(string calldata userDIDID) external view returns (string memory) {
        return _userDIDIDToUserIPFSCID[userDIDID];
    }
}