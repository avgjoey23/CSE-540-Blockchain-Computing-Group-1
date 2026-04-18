const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PORT = 3000;
const ethers = require('ethers');
const ipfs = require('ipfs-storage');
const cors = require('cors');
app.use(cors());
const { DID_REGISTRY_ADDRESS, CREDENTIAL_STATUS_ADDRESS, RPC_URL } = require('./config');

const DIDRegistryABI = require('./abi/DIDRegistry.json');
const CredentialStatusABI = require('./abi/CredentialStatus.json');

const IPFSService = require('./services/IPFSService');

app.use(bodyParser.json());

// connect to contracts info
const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
const ISSUER_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const issuerWallet = new ethers.Wallet(ISSUER_PRIVATE_KEY, provider);

// creates contract instances
const didRegistry = new ethers.Contract(DID_REGISTRY_ADDRESS, DIDRegistryABI, provider);
const credentialStatus = new ethers.Contract(CREDENTIAL_STATUS_ADDRESS, CredentialStatusABI, provider);

const MOVIES = [
    { id: 1, title: "The Fast and the Furious" },
    { id: 2, title: "2 Fast 2 Furious" },
    { id: 3, title: "The Fast and the Furious: Tokyo Drift" },
    { id: 4, title: "Fast & Furious" },
    { id: 5, title: "Fast Five" },
    { id: 6, title: "Fast & Furious 6" },
    { id: 7, title: "Furious 7" },
    { id: 8, title: "The Fate of the Furious" },
    { id: 9, title: "F9: The Fast Saga" },
    { id: 10, title: "Fast X" },
];

/*
 * Define routes
 */

app.get('/api/movies', (req, res) => {
    res.json(MOVIES);
});

/* Verify user has access to movie
 *
 * input: { walletAddress: string, vcHash: string }
 * return: { verified: boolean, status: string }
 */
app.post('/api/verify', async (req, res) => {
    const { walletAddress, vcHash } = req.body;

    if (!walletAddress || !vcHash) {
        return res.status(400).json({ error: 'Wallet address and VC Hash are required.' });
    }

    try {
        // Check the credential status — returns 0 (DoesNotExist), 1 (Issued), or 2 (Revoked)
        const statusCode = await credentialStatus.getCredentialStatusCode(vcHash);
        const statusNumber = Number(statusCode);

        const STATUS = { 0: 'DoesNotExist', 1: 'Issued', 2: 'Revoked' };

        return res.status(200).json({
            verified: statusNumber === 1,
            status: STATUS[statusNumber] ?? 'Unknown'
        });

    } catch (err) {
        console.error('Verification error:', err);
        return res.status(500).json({ error: 'Internal server error during verification.' });
    }
});

/* Purchase a movie for a user
 *
 * input: { walletAddress: string, movieId: number }
 * return: { success: boolean, vcHash: string }
 */
app.post('/api/purchase', async (req, res) => {
    const { walletAddress, movieId } = req.body;

    if (!walletAddress || !movieId) {
        return res.status(400).json({ error: 'walletAddress and movieId are required.' });
    }

    try {
        // Compute the VC hash the same way as in verify and on the frontend
        const vcHash = ethers.keccak256(ethers.toUtf8Bytes(`${walletAddress}:movie:${movieId}`));

        // Check if credential already exists
        const statusCode = await credentialStatus.getCredentialStatusCode(vcHash);
        if (Number(statusCode) === 1) {
            return res.status(200).json({ success: false, error: 'AlreadyOwned' });
        }

        // Issue the credential, signed by the trusted issuer wallet
        const tx = await credentialStatus.connect(issuerWallet).issueCredential(vcHash);
        await tx.wait();

        return res.status(200).json({ success: true, vcHash });

    } catch (err) {
        console.error('Purchase error:', err);
        return res.status(500).json({ error: 'Internal server error during purchase.' });
    }
});

/*
 * Start Server
 */

app.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
});


// List existing items
app.get('/api/items',(request,response) => {
        response.json(items);
});

// Get item by id
app.get('/api/items/:id',(request,response) => {
    const id = parseInt(request.params.id);
    let item = items.find(item=> item.id === id);

    if (item) {
        response.json(item);
    } else {
        response.status(404).send('Not Found');
    }
})

// create new item
app.post('/api/items', (request,response) => {
    let payload = bodyParser.json(request.body);
    response.status(200).send(payload.name);
});

/* DID registry routes */

// Register an Issuer (Only Owner)
app.post('/api/did/register-issuer', async (req, res) => {
    try {
        const { address, did, cid } = req.body;
        const tx = await DIDRegistryService.registerIssuer(address, did, cid);
        res.status(200).json({ message: 'Issuer registered', transactionHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: 'Failed to register issuer (Owner only)' });
    }
});

// Get Issuer IPFS CID
app.get('/api/did/issuer/:did', async (req, res) => {
    try {
        const { did } = req.params;
        const cid = await DIDRegistryService.getIssuerIPFSCID(did);
        res.status(200).json({ issuerDIDID: did, ipfsCID: cid });
    } catch (error) {
        console.error('Error getting issuer CID:', error);
        res.status(500).json({ error: 'Failed to get issuer CID' });
    }
});

// Register a New User
app.post('/api/did/register-user', async (req, res) => {
    try {
        const { userDIDID, userIPFSCID } = req.body;
        const tx = await DIDRegistryService.registerUser(userDIDID, userIPFSCID);
        res.status(200).json({ 
            message: 'User registered successfully', 
            transactionHash: tx.hash 
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Update an existing User
app.post('/api/did/update-user', async (req, res) => {
    try {
        const { userDIDID, userIPFSCID } = req.body;
        const tx = await DIDRegistryService.updateUser(userDIDID, userIPFSCID);
        res.status(200).json({ message: 'User updated successfully', transactionHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Get User IPFS CID
app.get('/api/did/user/:did', async (req, res) => {
    try {
        const { did } = req.params;
        const cid = await DIDRegistryService.getUserIPFSCID(did);
        res.status(200).json({ did, ipfsCID: cid });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user CID' });
    }
});

/* credential status routes */

// Issue a credential
app.post('/api/credentials/issue', async (req, res) => {
    try {
        const { vcHash } = req.body; // Extract vcHash from the request body
        const tx = await credentialStatusService.issueCredential(vcHash);
        res.status(200).json({ message: 'Credential issued successfully', transactionHash: tx.hash });
    } catch (error) {
        console.error('Error issuing credential:', error);
        res.status(500).json({ error: 'Failed to issue credential' });
    }
});

// Revoke a credential
app.post('/api/credentials/revoke', async (req, res) => {
    try {
        const { vcHash } = req.body; // Extract vcHash from the request body
        const tx = await credentialStatusService.revokeCredential(vcHash);
        res.status(200).json({ message: 'Credential revoked successfully', transactionHash: tx.hash });
    } catch (error) {
        console.error('Error revoking credential:', error);
        res.status(500).json({ error: 'Failed to revoke credential' });
    }
});

// Get credential status code
app.get('/api/credentials/status/:vcHash', async (req, res) => {
    try {
        const { vcHash } = req.params; // Extract vcHash from the URL parameter
        const statusCode = await credentialStatusService.getCredentialStatusCode(vcHash);
        res.status(200).json({ vcHash, statusCode });
    } catch (error) {
        console.error('Error getting credential status code:', error);
        res.status(500).json({ error: 'Failed to get credential status code' });
    }
});

/* IPFS service routes */

// Endpoint to Store
app.post('/api/IPFS', async (req, res) => {
    try {
        const cid = await IPFSService.storeJSON(req.body);
        res.status(201).json({ success: true, cid });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint to Retrieve
app.get('/api/IPFS/:cid', async (req, res) => {
    try {
        const data = await IPFSService.getJSON(req.params.cid);
        res.json({ success: true, data });
    } catch (error) {
        res.status(404).json({ success: false, error: "Content not found" });
    }
});

/*
* Start Server
*/

app.listen(PORT, () => {
    console.log(`server listening on port ${PORT}`);
});

// Example Curl commands (curl doesn't have to be used)

// curl http://localhost:3000/api/items
// curl http://localhost:3000/api/items/1
// curl http://localhost:3000/api/items/2
// curl http://localhost:3000/api/items/3

// curl -X post -H "Content-Type: application/json" -d '{"id": 4, "name": "item4"}' http://localhost:3000/api/items

// run server with 
// node server.js
