// FILE: backend/services/credentialStatusService.js

const { ethers } = require("ethers");

// Load environment variables for provider and contract details
const provider = new ethers.providers.JsonRpcProvider(process.env.ETH_RPC_URL);
const privateKey = process.env.PRIVATE_KEY; // Private key of the account interacting with the contract
const wallet = new ethers.Wallet(privateKey, provider);

// Contract ABI and address
const contractABI = [
    "function issueCredential(bytes32 VCHash) external",
    "function revokeCredential(bytes32 VCHash) external",
    "function getCredentialStatusCode(bytes32 VCHash) external view returns (uint8)"
];
const contractAddress = process.env.CREDENTIAL_STATUS_CONTRACT_ADDRESS;

// Initialize contract instance
const credentialStatusContract = new ethers.Contract(contractAddress, contractABI, wallet);

const credentialStatusService = {
    /**
     * Issues a credential by calling the issueCredential method on the contract.
     * @param {string} vcHash - The VC hash (as a hex string).
     * @returns {Promise<ethers.Transaction>} - The transaction object.
     */
    async issueCredential(vcHash) {
        try {
            const tx = await credentialStatusContract.issueCredential(vcHash);
            console.log("Transaction sent:", tx.hash);
            await tx.wait(); // Wait for the transaction to be mined
            console.log("Credential issued successfully.");
            return tx;
        } catch (error) {
            console.error("Error issuing credential:", error);
            throw error;
        }
    },

    /**
     * Revokes a credential by calling the revokeCredential method on the contract.
     * @param {string} vcHash - The VC hash (as a hex string).
     * @returns {Promise<ethers.Transaction>} - The transaction object.
     */
    async revokeCredential(vcHash) {
        try {
            const tx = await credentialStatusContract.revokeCredential(vcHash);
            console.log("Transaction sent:", tx.hash);
            await tx.wait(); // Wait for the transaction to be mined
            console.log("Credential revoked successfully.");
            return tx;
        } catch (error) {
            console.error("Error revoking credential:", error);
            throw error;
        }
    },

    /**
     * Retrieves the status code of a credential by calling getCredentialStatusCode on the contract.
     * @param {string} vcHash - The VC hash (as a hex string).
     * @returns {Promise<number>} - The status code of the credential.
     */
    async getCredentialStatusCode(vcHash) {
        try {
            const statusCode = await credentialStatusContract.getCredentialStatusCode(vcHash);
            console.log("Credential status code:", statusCode.toNumber());
            return statusCode.toNumber(); // Convert BigNumber to a regular number
        } catch (error) {
            console.error("Error getting credential status code:", error);
            throw error;
        }
    }
};

module.exports = credentialStatusService;