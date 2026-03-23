// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

/*
    Allows storage of Verifiable Credential status. They key is the hash of a VC. The status can be granted, revoked, or not exist.
    Statuses may only be changed by trusted issuers, as specified in the DID Registry Contract.

    TODO: should only be done by trusted issuers. maybe add a mapping of address to issuer DID in DID Registry and check that.
          if it exists (non-empty string) then the address that send this request is trusted
    TODO: use bytes32 as keys because it is cheaper.
*/
contract CredentialStatus {
    // creator  of the contract
    address public contractOwner;

    // the status of a credential 
    enum CredentialStatusCode {
        DoesNotExist,
        Issued,
        Revoked
    }

    // event emitted when the status of a credential is changed
    event CredentialStatusChanged(string VCHash, CredentialStatusCode status);
    // event emitted when the status of a credential is queried
    event CredentialStatusQueried(string VCHash, CredentialStatusCode status);

    // map the VC hash to a credential status code
    mapping(string VCHash => CredentialStatusCode) private _VCHashToCredentialStatusCode;

    // set deployer as contractOwner
    constructor() {
        contractOwner = msg.sender;
    }

    // Issues rights to a VC hash. The VC hash must not exist
    function issueCredential(string calldata VCHash) external {
        require(
            _VCHashToCredentialStatusCode[VCHash] == CredentialStatusCode.DoesNotExist,
            "Credential already exists."
        );

        _VCHashToCredentialStatusCode[VCHash] = CredentialStatusCode.Issued;
        emit CredentialStatusChanged(VCHash, CredentialStatusCode.Issued);
    }

    // Revokes rights of a VC hash. The VC hash must be currently issued
    function revokeCredential(string calldata VCHash) external {
        require(
            _VCHashToCredentialStatusCode[VCHash] == CredentialStatusCode.Issued,
            "Credential not issued."
        );

        _VCHashToCredentialStatusCode[VCHash] = CredentialStatusCode.Revoked;
        emit CredentialStatusChanged(VCHash, CredentialStatusCode.Revoked);
    }

    // Returns the current status code of a VC hash
    function getCredentialStatusCode(string calldata VCHash) external returns(CredentialStatusCode) {
        CredentialStatusCode status = _VCHashToCredentialStatusCode[VCHash];

        emit CredentialStatusQueried(VCHash, status);
        return status;
    }
}