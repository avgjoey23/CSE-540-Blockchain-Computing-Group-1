// FILE: backend/services/credentialStatusService.js

require('dotenv').config();
const { ethers } = require("ethers");

// Load environment variables for provider and contract details
const provider = new ethers.JsonRpcProvider(process.env.ETH_RPC_URL, undefined, { staticNetwork: true });
const privateKey = process.env.PRIVATE_KEY; // Private key of the account interacting with the contract
const wallet = new ethers.Wallet(privateKey, provider);

// Contract ABI and address
const contractABI = [
    "function registerIssuer(address issuerAddress, bytes32 issuerDIDID, bytes32 issuerIPFSCID) external",
    "function getIssuerIPFSCID(bytes32 issuerDIDID) view returns (bytes32)",

    "function registerUser(bytes32 userDIDID, bytes32 userIPFSCID) external",
    "function updateUser(bytes32 userDIDID, bytes32 userIPFSCID) external",
    "function getUserIPFSCID(bytes32 userDIDID) view returns (bytes32)",
];
const contractAddress = process.env.DID_REGISTRY_CONTRACT_ADDRESS;

// Initialize contract instance
const didRegistryContract = new ethers.Contract(contractAddress, contractABI, wallet);

const DIDRegistryService = {
    /**
     * Registers a new issuer. Only callable by the contract owner.
     */
    async registerIssuer(issuerAddress, issuerDIDID, issuerIPFSCID) {
        try {
            const tx = await didRegistryContract.registerIssuer(issuerAddress, issuerDIDID, issuerIPFSCID);
            console.log("Register Issuer TX sent:", tx.hash);
            await tx.wait();
            console.log("Issuer registered successfully.");
            return tx;
        } catch (error) {
            console.error("Error registering issuer:", error);
            throw error;
        }
    },

    /**
     * Retrieves an issuer's IPFS CID. (Read-only)
     */
    async getIssuerIPFSCID(issuerDIDID) {
        try {
            const cid = await didRegistryContract.getIssuerIPFSCID(issuerDIDID);
            return cid;
        } catch (error) {
            console.error("Error getting issuer IPFS CID:", error);
            throw error;
        }
    },

    /**
     * Registers a new user mapping.
     */
    async registerUser(userDIDID, userIPFSCID) {
        try {
            const tx = await didRegistryContract.registerUser(userDIDID, userIPFSCID);
            console.log("Register User TX sent:", tx.hash);
            await tx.wait();
            console.log("User registered successfully.");
            return tx;
        } catch (error) {
            console.error("Error registering user:", error);
            throw error;
        }
    },

    /**
     * Updates an existing user's mapping.
     */
    async updateUser(userDIDID, userIPFSCID) {
        try {
            const tx = await didRegistryContract.updateUser(userDIDID, userIPFSCID);
            console.log("Update User TX sent:", tx.hash);
            await tx.wait();
            console.log("User updated successfully.");
            return tx;
        } catch (error) {
            console.error("Error updating user:", error);
            throw error;
        }
    },

    /**
     * Retrieves a user's IPFS CID. (Read-only)
     */
    async getUserIPFSCID(userDIDID) {
        try {
            const cid = await didRegistryContract.getUserIPFSCID(userDIDID);
            return cid;
        } catch (error) {
            console.error("Error getting user IPFS CID:", error);
            throw error;
        }
    }
};

module.exports = DIDRegistryService;
