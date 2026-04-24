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
- Pinata SDK
- MetaMask

## Project Installation and Deployment Step by Step
These steps are supported/verified on an AWS EC2 instance (t2.xlarge) running Ubuntu Server 24.04 LTS 

1. first, install git if you don't have it:
	`sudo apt update`
	`sudo apt install git`

2. get the repo
	`git clone https://github.com/avgjoey23/CSE-540-Blockchain-Computing-Group-1.git`

3. install nvm and node
	`curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash`
	`source ~/.bashrc`
	`nvm install --lts`

4. install dependencies:
	`cd CSE-540-Blockchain-Computing-Group-1`
	`cd backend && npm install`
	`cd ../contracts && npm install`
	`cd ../frontend && npm install`

5. add the environment variables
	`cd ../backend`
	create a file called '.env' and add the following contents:
	
	```
	PINATA_JWT=Token removed for now as i dont want it published to git 
	PINATA_GATEWAY=https://fuchsia-obvious-bear-808.mypinata.cloud
	ETH_RPC_URL=http://127.0.0.1:8545/
	PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
	DID_REGISTRY_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
	CREDENTIAL_STATUS_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
	``` 

6. install MetaMask from web browser web store. create an account and a wallet and add to browser. Tested with Google Chrome 

7. required step for running on an amazon EC2 instance. you must open an ssh tunnel to the 2 required ports. if running locally you don't need to do this.
	`ssh -i yourkey.pem -L 5173:localhost:5173 -L 3000:localhost:3000 ubuntu@your-EC2-pblic-DNS`
	leave this window open to maintain the tunnel

8. run the startup script to handle deploying contracts with HardHat, seeding test data, and starting the backend. Includes calls to `/contracts/scripts/deploy.ts` which stores contract address information in `/backend/config.js` for the server.
	`cd ..`
	you should be in the root of the project directory CSE-540-Blockchain-Computing-Group-1
	`./start.sh`
	the last line should be
	`server listening on port 3000`
	leave the service running in this terminal

9. run the application in another terminal
	`cd CSE-540-Blockchain-Computing-Group-1`
	`cd frontend`
	`npm run dev`
	you will see a link to the server at localhost. use this address to access the application.

10. click the icon in the top right of the application to connect your wallet created with MetaMask
