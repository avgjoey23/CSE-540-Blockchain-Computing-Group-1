// FILE: backend/services/IPFSService.js

require('dotenv').config();
const pinataSDK = require('@pinata/sdk');

// Initialize with your JWT
const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });

const IPFSService = {
    /**
     * Stores a JSON object to IPFS via Pinata
     * @param {Object} data - The JSON object from your frontend
     * @returns {Promise<string>} - The CID (IpfsHash)
     */
    async storeJSON(data) {
        try {
            const result = await pinata.pinJSONToIPFS(data);
            return result.IpfsHash;
        } catch (error) {
            console.error("Pinata JSON Upload Error:", error);
            throw error;
        }
    },

    /**
     * Retrieves a JSON object from IPFS using a gateway
     * @param {string} cid - The IPFS content identifier
     */
    async getJSON(cid) {
        try {
            const gateway = process.env.PINATA_GATEWAY;
            const response = await fetch(`${gateway}/ipfs/${cid}`);

            if (!response.ok) throw new Error('Failed to fetch from IPFS');

            return await response.json();
        } catch (error) {
            console.error("Pinata JSON Retrieval Error:", error);
            throw error;
        }
    }
};

module.exports = IPFSService;

