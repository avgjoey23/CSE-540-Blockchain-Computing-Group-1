require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const PORT = 3000;
const ethers = require('ethers');
const cors = require('cors');
const session = require('express-session');
const bs58 = require('bs58');

const { DID_REGISTRY_ADDRESS, CREDENTIAL_STATUS_ADDRESS, RPC_URL } = require('./config');
const DIDRegistryABI = require('./abi/DIDRegistry.json');
const CredentialStatusABI = require('./abi/CredentialStatus.json');

const IPFSService = require('./services/IPFSService');
const cryptoService = require('./services/cryptoService');
const DIDRegistryService = require('./services/registryService');
const credentialStatusService = require('./services/credentialService');

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(bodyParser.json());
app.use(session({
    secret: 'blockazon-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// connect to contracts
const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, { staticNetwork: true });
const ISSUER_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const issuerWallet = new ethers.Wallet(ISSUER_PRIVATE_KEY, provider);

// contract instances
const didRegistry = new ethers.Contract(DID_REGISTRY_ADDRESS, DIDRegistryABI, provider);
const credentialStatus = new ethers.Contract(CREDENTIAL_STATUS_ADDRESS, CredentialStatusABI, provider);

// platform DID — generated once on startup
let platformDID = null;
let platformPrivateKey = null;

// Strips the 0x1220 prefix from a base58 IPFS CID for storage in the contract as bytes32
const cidToBytes32 = (cid) => {
    const decoded = bs58.decode(cid);
    const withoutPrefix = decoded.slice(2);
    return ethers.hexlify(withoutPrefix);
};

// Adds the 0x1220 prefix back to a bytes32 hex string to reconstruct the base58 CID
const bytes32ToCid = (bytes32hex) => {
    const hex = bytes32hex.startsWith('0x') ? bytes32hex.slice(2) : bytes32hex;
    const prefixed = Buffer.from('1220' + hex, 'hex');
    return bs58.encode(prefixed);
};

const initializePlatform = async () => {
    try {
        const result = await cryptoService.generateDID();
        platformDID = result.did;
        platformPrivateKey = result.privateKey;

        const cidBytes32 = cidToBytes32(result.cid);
        const didIDHash = ethers.keccak256(ethers.toUtf8Bytes(platformDID));

        const tx = await didRegistry.connect(issuerWallet).registerIssuer(
            await issuerWallet.getAddress(),
            didIDHash,
            cidBytes32
        );
        await tx.wait();

        console.log(`Platform DID initialized: ${platformDID}`);
        console.log(`Platform registered as issuer on DIDRegistry`);
    } catch (err) {
        console.error('Failed to initialize platform DID:', err);
        process.exit(1);
    }
};

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
 * Movie routes
 */

app.get('/api/movies', (req, res) => {
    res.json(MOVIES);
});

/*
 * Register a user's wallet — generates a DID and registers it on chain
 * input: { walletAddress: string }
 * return: { success: boolean, did: string }
 */
app.post('/api/register', async (req, res) => {
    const { walletAddress } = req.body;

    if (!walletAddress) {
        return res.status(400).json({ error: 'walletAddress is required.' });
    }

    try {
        // Generate DID and store document on IPFS
        const result = await cryptoService.generateDID();
        const userDID = result.did;
        const userPrivateKey = result.privateKey;

        // Convert CID and hash DID ID for contract storage
        const cidBytes32 = cidToBytes32(result.cid);
        const didIDHash = ethers.keccak256(ethers.toUtf8Bytes(userDID));

        // Register user on DIDRegistry — signed by issuer wallet on behalf of user
        const tx = await didRegistry.connect(issuerWallet).registerUser(
            didIDHash,
            cidBytes32
        );
        await tx.wait();

        // Store DID and private key in session keyed by wallet address
        if (!req.session.users) req.session.users = {};
        req.session.users[walletAddress] = { did: userDID, privateKey: userPrivateKey };

        return res.status(200).json({ success: true, did: userDID });

    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ error: 'Internal server error during registration.' });
    }
});

/*
 * Verify user has access to movie
 * input: { walletAddress: string, movieId: number }
 * return: { verified: boolean, status: string }
 */
app.post('/api/verify', async (req, res) => {
    const { walletAddress, movieId } = req.body;
    console.log('Verify called:', { walletAddress, movieId });
    console.log('Session users:', JSON.stringify(req.session.users));

    if (!walletAddress || !movieId) {
        return res.status(400).json({ error: 'walletAddress and movieId are required.' });
    }

    try {
        // Look up VC CID from session
        const vcCid = req.session.users?.[walletAddress]?.vcs?.[movieId];

        if (!vcCid) {
            return res.status(200).json({ verified: false, status: 'DoesNotExist' });
        }

        // Fetch the VC from IPFS
        const signedVC = await IPFSService.getJSON(vcCid);

        // Verify the VC structure
        const isValid = await cryptoService.verifyVC(signedVC);

        // Also check the credential status on chain
        const cidBytes32 = cidToBytes32(vcCid);
        // console.log('Verifying cidBytes32:', cidBytes32);
        const statusCode = await credentialStatus.getCredentialStatusCode(cidBytes32);
        const statusNumber = Number(statusCode);

        const STATUS = { 0: 'DoesNotExist', 1: 'Issued', 2: 'Revoked' };

        return res.status(200).json({
            verified: isValid && statusNumber === 1,
            status: STATUS[statusNumber] ?? 'Unknown'
        });

    } catch (err) {
        console.error('Verification error:', err);
        return res.status(500).json({ error: 'Internal server error during verification.' });
    }
});

/*
 * Purchase a movie for a user
 * input: { walletAddress: string, movieId: number }
 * return: { success: boolean }
 */
app.post('/api/purchase', async (req, res) => {
    const { walletAddress, movieId } = req.body;

    if (!walletAddress || !movieId) {
        return res.status(400).json({ error: 'walletAddress and movieId are required.' });
    }

    try {
        // Check if already purchased in session
        const existingCid = req.session.users?.[walletAddress]?.vcs?.[movieId];
        if (existingCid) {
            return res.status(200).json({ success: false, error: 'AlreadyOwned' });
        }

        // Get or create user DID from session
        if (!req.session.users) req.session.users = {};
        if (!req.session.users[walletAddress]) {
            const result = await cryptoService.generateDID();
            const userDID = result.did;
            const userPrivateKey = result.privateKey;

            const cidBytes32 = cidToBytes32(result.cid);
            const didIDHash = ethers.keccak256(ethers.toUtf8Bytes(userDID));

            const tx = await didRegistry.connect(issuerWallet).registerUser(
                didIDHash,
                cidBytes32
            );
            await tx.wait();

            req.session.users[walletAddress] = { did: userDID, privateKey: userPrivateKey };
        }

        const userDID = req.session.users[walletAddress].did;

        // Generate a signed VC using the platform as issuer
        const vcResult = await cryptoService.generateVC(
            platformDID,
            platformPrivateKey,
            userDID,
            String(movieId)
        );

        // Convert VC CID to bytes32 for contract storage
        const cidBytes32 = cidToBytes32(vcResult.cid);

        // Check if credential already exists on chain
        const statusCode = await credentialStatus.getCredentialStatusCode(cidBytes32);
        if (Number(statusCode) === 1) {
            return res.status(200).json({ success: false, error: 'AlreadyOwned' });
        }

        // Issue the credential on chain
        const tx = await credentialStatus.connect(issuerWallet).issueCredential(cidBytes32);
        await tx.wait();

        // Store VC CID in session
        if (!req.session.users[walletAddress].vcs) {
            req.session.users[walletAddress].vcs = {};
        }
        req.session.users[walletAddress].vcs[movieId] = vcResult.cid;

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error('Purchase error:', err);
        return res.status(500).json({ error: 'Internal server error during purchase.' });
    }
});

/*
 * DID registry routes
 */

app.post('/api/did/register-issuer', async (req, res) => {
    try {
        const { address, did, cid } = req.body;
        const tx = await DIDRegistryService.registerIssuer(address, did, cid);
        res.status(200).json({ message: 'Issuer registered', transactionHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: 'Failed to register issuer (Owner only)' });
    }
});

app.get('/api/did/issuer/:did', async (req, res) => {
    try {
        const { did } = req.params;
        const cid = await DIDRegistryService.getIssuerIPFSCID(did);
        res.status(200).json({ issuerDIDID: did, ipfsCID: cid });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get issuer CID' });
    }
});

app.post('/api/did/register-user', async (req, res) => {
    try {
        const { userDIDID, userIPFSCID } = req.body;
        const tx = await DIDRegistryService.registerUser(userDIDID, userIPFSCID);
        res.status(200).json({ message: 'User registered successfully', transactionHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: 'Failed to register user' });
    }
});

app.post('/api/did/update-user', async (req, res) => {
    try {
        const { userDIDID, userIPFSCID } = req.body;
        const tx = await DIDRegistryService.updateUser(userDIDID, userIPFSCID);
        res.status(200).json({ message: 'User updated successfully', transactionHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});

app.get('/api/did/user/:did', async (req, res) => {
    try {
        const { did } = req.params;
        const cid = await DIDRegistryService.getUserIPFSCID(did);
        res.status(200).json({ did, ipfsCID: cid });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user CID' });
    }
});

/*
 * Credential status routes
 */

app.post('/api/credentials/issue', async (req, res) => {
    try {
        const { vcHash } = req.body;
        const tx = await credentialStatusService.issueCredential(vcHash);
        res.status(200).json({ message: 'Credential issued successfully', transactionHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: 'Failed to issue credential' });
    }
});

app.post('/api/credentials/revoke', async (req, res) => {
    try {
        const { vcHash } = req.body;
        const tx = await credentialStatusService.revokeCredential(vcHash);
        res.status(200).json({ message: 'Credential revoked successfully', transactionHash: tx.hash });
    } catch (error) {
        res.status(500).json({ error: 'Failed to revoke credential' });
    }
});

app.get('/api/credentials/status/:vcHash', async (req, res) => {
    try {
        const { vcHash } = req.params;
        const statusCode = await credentialStatusService.getCredentialStatusCode(vcHash);
        res.status(200).json({ vcHash, statusCode });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get credential status code' });
    }
});

/*
 * IPFS routes
 */

app.post('/api/IPFS', async (req, res) => {
    try {
        const cid = await IPFSService.storeJSON(req.body);
        res.status(201).json({ success: true, cid });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/IPFS/:cid', async (req, res) => {
    try {
        const data = await IPFSService.getJSON(req.params.cid);
        res.json({ success: true, data });
    } catch (error) {
        res.status(404).json({ success: false, error: "Content not found" });
    }
});

/*
 * Crypto routes
 */

app.post('/api/generateDID', async (req, res) => {
    try {
        const data = await cryptoService.generateDID();
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/generateVC', async (req, res) => {
    try {
        const { issuerDid, issuerPrivKey, userDid, productId } = req.body;
        if (!issuerDid || !issuerPrivKey || !userDid || !productId) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }
        const data = await cryptoService.generateVC(issuerDid, issuerPrivKey, userDid, productId);
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/verifyVC', async (req, res) => {
    try {
        const { signedVC } = req.body;
        if (!signedVC) {
            return res.status(400).json({ success: false, error: "Missing VC object" });
        }
        const data = await cryptoService.verifyVC(signedVC);
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/*
 * Start server
 */

initializePlatform().then(() => {
    app.listen(PORT, () => {
        console.log(`server listening on port ${PORT}`);
    });
}).catch(err => {
    console.error('Server failed to start:', err);
    process.exit(1);
});