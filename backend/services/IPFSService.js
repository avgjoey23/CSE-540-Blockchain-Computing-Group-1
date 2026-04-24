// FILE: backend/services/IPFSService.js

require('dotenv').config();
const pinataSDK = require('@pinata/sdk');

const pinata = new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT });

const IPFSService = {
	/**
	 * Stores a JSON object to IPFS via Pinata
	 * @param {Object} data - the object to store
	 * @returns {Promise<string>} - The CID (IPFS hash)
	 */
	async storeJSON(data) {
		try {
			const result = await pinata.pinJSONToIPFS(data);
			return result.IpfsHash;
		} catch (error) {
			console.error("Error storing data in pinata:", error);
			throw error;
		}
	},

	/**
	 * Retrieves a JSON object from IPFS
	 * @param {string} cid - The CID (IPFS hash)
	 */
	async getJSON(cid) {
		try {
			const gateway = process.env.PINATA_GATEWAY;
			const response = await fetch(`${gateway}/ipfs/${cid}`);

			if (!response.ok) throw new Error('Failed to fetch from IPFS');

			return await response.json();
		} catch (error) {
			console.error("Error retrieving data in pinata:", error);
			throw error;
		}
	}
};

module.exports = IPFSService;

