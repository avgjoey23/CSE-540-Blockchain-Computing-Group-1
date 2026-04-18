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
