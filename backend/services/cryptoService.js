// FILE: backend/services/cryptoService.js

require('dotenv').config();

const didKeyDriver = require('@digitalcredentials/did-method-key').driver();
const Multikey = require('@digitalcredentials/ed25519-multikey');

const IPFSService = require('./IPFSService');

const suite = Multikey.Ed25519Multikey || Multikey;
didKeyDriver.use({
  multibaseMultikeyHeader: 'z6Mk',
  fromMultibase: suite.from
});

const cryptoService = {
    /**
     * Generate a DID document and store it to IPFS
     * @param {Object} data - The JSON object from your frontend
     * @returns the DID ID and the private key
     */
    async generateDID() {
        try {

            const keyPair = await suite.generate();
            
            const { didDocument } = await didKeyDriver.publicKeyToDidDoc({
                publicKeyDescription: keyPair
            });

	    const didId = didDocument.id;

            const privateKey = keyPair.secretKeyMultibase; 

            const cid = await IPFSService.storeJSON(didDocument);

	    return {
	        did:didId,
		cid:cid,
		privateKey: privateKey
	    };

        } catch (error) {
            console.error("Error generating or storing DID document:", error);
            throw error;
        }
    }
};

module.exports = cryptoService;

