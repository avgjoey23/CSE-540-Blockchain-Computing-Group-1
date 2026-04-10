// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

/*
    Required functions from DIDRegistry contract
*/
interface IDIDRegistry {
    function isTrustedIssuer(address issuerAddress) external view returns (bool);
}

/*
    Allows storage of Verifiable Credential status. They key is the hash of a VC. The status can be granted, revoked, or not exist.
    Statuses may only be changed by trusted issuers, as specified in the DID Registry Contract.

    All passed VC hashes should be 32 bytes in the keccak256 format. 
*/
contract CredentialStatus {
    // creator  of the contract
    address public contractOwner;

    // reference to the DIDRegistry contract
    IDIDRegistry public DIDRegistry;

    // the status of a credential 
    enum CredentialStatusCode {
        DoesNotExist,
        Issued,
        Revoked
    }

    // event emitted when the status of a credential is changed
    event CredentialStatusChanged(bytes32 VCHash, CredentialStatusCode status);
    // event emitted when the status of a credential is queried
    event CredentialStatusQueried(bytes32 VCHash, CredentialStatusCode status);

    // map the VC hash to a credential status code
    mapping(bytes32 VCHash => CredentialStatusCode) private _VCHashToCredentialStatusCode;

    // Must be a new VC hash from a trusted issuer
    modifier canIssue(bytes32 VCHash) {
        require(
            DIDRegistry.isTrustedIssuer(msg.sender),
            "Caller is not a registered trusted issuer."
        );

        require(
            _VCHashToCredentialStatusCode[VCHash] == CredentialStatusCode.DoesNotExist,
            "Credential already exists."
        );
        _;
    }

    // Existing VC hash can be revoked by trusted issuer
    modifier canRevoke(bytes32 VCHash){
         require(
            DIDRegistry.isTrustedIssuer(msg.sender),
            "Caller is not a registered trusted issuer."
        );

        require(
            _VCHashToCredentialStatusCode[VCHash] == CredentialStatusCode.Issued,
            "Credential not issued."
        );
        _;
    }

    // set deployer as contractOwner
    constructor(address DIDRegistryAddress) {
        contractOwner = msg.sender;
        DIDRegistry = IDIDRegistry(DIDRegistryAddress);
    }

    // Issues rights to a VC hash. The VC hash must not exist. Can only be done by trusted issuer.
    function issueCredential(bytes32 VCHash) canIssue(VCHash) external {
        _VCHashToCredentialStatusCode[VCHash] = CredentialStatusCode.Issued;
        emit CredentialStatusChanged(VCHash, CredentialStatusCode.Issued);
    }

    // Revokes rights of a VC hash. The VC hash must be currently issued. Can only be done by trusted issuer.
    function revokeCredential(bytes32 VCHash) canRevoke(VCHash) external {
        _VCHashToCredentialStatusCode[VCHash] = CredentialStatusCode.Revoked;
        emit CredentialStatusChanged(VCHash, CredentialStatusCode.Revoked);
    }

    // Returns the current status code of a VC hash.
    function getCredentialStatusCode(bytes32 VCHash) external view returns(CredentialStatusCode) {
        CredentialStatusCode status = _VCHashToCredentialStatusCode[VCHash];
        // emit CredentialStatusQueried(VCHash, status);
        return status;
    }
}