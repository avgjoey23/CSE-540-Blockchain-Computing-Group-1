# CSE-540-Blockchain-Computing-Group-1

Ciara Allen, David Bowers, Matthew Flores Semyonov, Eric June, Joe Mullen

## Project Description

### StreamingChains: A Decentralized Framework for Digital Media Rights

This system is a prototype of a decentralized identity and access management scheme for interoperable media platforms. It loosely follows the W3C SSI (self sovereign identity) standards for DID (distributed identifier) and VCs (verifiable credentials). The intention is to publicly record rights to digital media works, allowing a user to prove this ownership across a variety of platforms. The system seeks to replace the typical workflow of providing a username and password to an individual platform provider. Although the current system works, it silos media access across a number of trusted providers, with no decentralized view on what is actually owned by the user. Media is gated and served by the trusted entities. By decentralizing authentication and streaming of media, the user gains independence and platforms gain flexibility. A trustless ecosystem ensures a level playing field for all stakeholders.

This project is built upon the Ethereum blockchain.

### Definitions

- SSI
  self-sovereign identity.
- DID
  decentralized identifier document.
- VC
  verified credential.

### Components

- user
  represents a consumer. a user uses the demo app.
- demo app
  contains representations of digital media stores, digital media players, and a wallet owned by the user. note these would be separate applications in the
  real world, but here they are all contained within the demo application.
- issuers
  represents digital media stores where users can purchase rights to digital media.
- verifiers
  represents digital media players where a user can view the content. note that a platofrm could be an issuer and a verifier (e.g. Amazon).
- wallet
  contains credentials.
- registry contract
  maps ethereum addresses to DID document. part of ethereum chain.
- credential status contract
  maintains record of issued credentials, allowing revocation of rights. part of ethereum chain.
- IPFS
  holds full DID documents and dummy media items.

### System Flow

#### 0. Trusted Issuer Registration

To register trusted issuers on the IPFS, call the `registerIssuer()` function in the `DIDRegistry` contract:

```
function registerIssuer(address issuerAddress, bytes32 issuerDIDID, bytes32 issuerIPFSCID) onlyOwner external {
    _issuerAddresses[issuerAddress] = true;
    _issuerDIDIDToIssuerIPFSCID[issuerDIDID] = issuerIPFSCID;
    emit IssuerRegistered(issuerDIDID, issuerIPFSCID);
}
```

(note: the `onlyOwner` modifier allows only the original contract owner to register trusted issuers.)

The `registerIssuer` function sets an issuer's address as "trusted" by setting it's entry to `true` in a mapping of issuer address to trusted status:

```
mapping(address issuer => bool) _issuerAddresses;
```

The issuer's full DID document with public key is stored in the IPFS, and the issuer's DID id is mapped to their corresponding IPFS CID:

```
mapping(bytes32 issuerDIDID => bytes32 issuerIPFSCID) private _issuerDIDIDToIssuerIPFSCID;
```

Then an `event` is emitted for registration:

```
event IssuerRegistered(bytes32 issuerDIDID, bytes32 issuerIPFSCID);
```

#### 1. DID Creation

Users create a DID and keypair in their wallets.
The user wallet stores the DID id and private key.

#### 2. DID Storage

The user DID document is also stored in IPFS containing the associated public key.

#### 3. On-Chain Registration

User calls a function on registry contract (on-chain) to map their DID id to IPFS CID of DID document, similar to issuers, but this is a separate mapping of user DID id -> IPFS CID.
An internal mapping is made from users ethereum address to DID id, ensuring only that address can update the IPFS CID for that DID in the future.
An event is emitted for registration.

#### 4. VC generation

When a media item is purchased, the issuer creates a VC.
The VC is a JSON object containing the user's DID id, the issuer's DID id, and the unique ID of the digital media item.
The issuer signs the VC.
This is done off-chain.

#### 5. VC storage

The user stores the signed VC in their wallet.
Sent from the issuer off-chain.

#### 6. On-Chain Entry

Issuer calls a function on credential status contract to store a mapping of hash of the VC -> status.
This publicly acknowledges the purchase.
The contract queries the registry contract to verify the caller is a trusted issuer.
An event is emitted for status change.

#### 7. VC presentation

when a media item is selected to be played, the user presents the VC to the verifier.

#### 8. proof of possession

the verifier ensures that the user is actually the owner of the DID within the VC. the verifier queries the registry contract on-chain to map the user's
DID id in the VC to an IPFS CID. the verifier retrieves the public key from the full DID document. the verifier has the user sign a random number and
uses the public key to verify the signature.

#### 9. verification of issuer

the verifier calls a function on the DID registry contract with the issuer DID id contained in the VC to retrieve the IPFS CID of the issuer full DID.
the verifier uses the public key retrieved to verify the signature on the VC.

#### 10. media rights status check

The verifier computes the hash of the VC and calls a function on the credential status contract to verify rights have not been revoked.
A verification event is emitted.

#### 11. media retrieval

The verifier requests the specified media from IPFS and serves it to the user.

TODO: IPFS data is public, how do we make sure only the athenticated user can access it? (might have to encrypt it somehow)

## Dependencies

- Ethereum
- MetaMask
- HardHat
- Remix IDE
- React Javascript library
- Node.js

## Project Deployment

Steps:

1. Install dependencies, run these commands in the terminal:

   ```
   cd backend && npm install
   cd ../contracts && npm install
   cd ../frontend && npm install
   ```

2. Run the startup script to handle deploying contracts with HardHat, seeding test data, and starting the backend. Includes calls to `/contracts/scripts/deploy.ts` which stores contract address information in `/backend/config.js` for the server.

   `./start.sh`

3. Run the application

   `cd frontend && npm run dev`
