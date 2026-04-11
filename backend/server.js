const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const PORT = 3000;
const ethers = require('ethers');
const credService = require('./services/credentialService');
const DIDRegistryService = require('./services/registryService');
//const ipfs = require('ipfs-storage');

let items = [
    {
        id: 1,
        name: "item1"
    },
    {
        id: 2,
        name: "item2"
    },
    {
        id: 3,
        name: "item3"
    }
]

/*
 * Define routes
 */

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
