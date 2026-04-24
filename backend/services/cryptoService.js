// FILE: backend/services/cryptoService.js

require('dotenv').config();

const didKeyDriver = require('@digitalcredentials/did-method-key').driver();
const Multikey = require('@digitalcredentials/ed25519-multikey');


const suite = Multikey.Ed25519Multikey || Multikey;
didKeyDriver.use({
	multibaseMultikeyHeader: 'z6Mk',
	fromMultibase: suite.from
});

const vc = require('@digitalcredentials/vc');
const { Ed25519Signature2020 } = require('@digitalcredentials/ed25519-signature-2020');

const { securityLoader } = require('@digitalbazaar/security-document-loader');
const loader = securityLoader();

const IPFSService = require('./IPFSService');

const cryptoService = {
	/**
	 * Generate a DID document and store it to IPFS
	 * @param {Object} data - The JSON object from your frontend
	 * @returns the DID ID, CID of the full document, and the private key
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
	},

	/**
	 * @param {string} issuerDid - The DID ID of the issuer
	 * @param {string} issuerPrivKey - The private key of the issuer
	 * @param {string} userDid - The DID ID of the user to issue to
	 * @param {string} productId - The product ID (movie ID)
	 */
	async generateVC(issuerDid, issuerPrivKey, userDid, productId) {
		try {
			// get the key pair
			const publicKey = issuerDid.split(':').pop();

			const keyPair = await suite.from({
				id: `${issuerDid}#${publicKey}`,
				controller: issuerDid,
				publicKeyMultibase: publicKey,
				secretKeyMultibase: issuerPrivKey
			});

			// this is the structure of the credential document
			const credential = {
				'@context': [
					'https://www.w3.org/2018/credentials/v1',
					'https://w3id.org/security/suites/ed25519-2020/v1',
					{
						"ProductOwnershipCredential": "https://example.org",
						"productId": "https://schema.org"
					}
				],
				type: ['VerifiableCredential', 'ProductOwnershipCredential'],
				issuer: issuerDid,
				issuanceDate: new Date().toISOString(),
				credentialSubject: {
					id: userDid,
					productId: productId
				}
			};

			// sign the credential document
			const signatureSuite = new Ed25519Signature2020({
				key: keyPair,
				date: credential.issuanceDate
			});

			const signedVC = await vc.issue({
				credential,
				suite: signatureSuite,
				documentLoader: loader.build()
			});

			// store in IPFS (maybe not needed)
			const cid = await IPFSService.storeJSON(signedVC);

			return {
				signedVC,
				cid
			};
		} catch (error) {
			console.error("Error issuing or storing VC:", error);
			throw error;
		}
	},

	/**
	 * @param {Object} signedVC - The signed VC object
	 * @returns {Boolean} - True if the VC is verified
	 */
	async verifyVC(signedVC) {
		try {
			if (!signedVC) {
				throw new Error("No VC provided");
			}

			const documentLoader = loader.build();

			// this verifies that the credential is correctly signed
			const result = await vc.verifyCredential({
				credential: signedVC,
				suite: new Ed25519Signature2020(),
				documentLoader
			});

			if (!result.verified) {
				return false;
			}

			return true;

		} catch (error) {
			console.error("Error verifying the VC:", error);
			return false;
		}
	},

	/**
	 * @param {Object} signedVC - The signed VC object
	 * @returns {Boolean} - True if the VC is verified
	 * This verify is not crypto secure, there are issues with the verification library
	 * Using this for now just as a basic check that a VC is valid
	 */
	async checkVC(signedVC) {
		try {
			//check for the document and proof section
			if (!signedVC || !signedVC.proof) {
				throw new Error("Document is missing a proof section");
			}

			// check for a signature
			const signature = signedVC.proof.proofValue;

			if (!signature) {
				throw new Error("Missing 'proofValue' in proof object");
			}

			// ensure the issuer matches the person who created the proof
			const issuerDid = signedVC.issuer;
			const verificationMethod = signedVC.proof.verificationMethod;

			if (!verificationMethod.includes(issuerDid)) {
				throw new Error("Issuer DID mismatch");
			}

			return true;

		} catch (error) {
			console.error("Verification failed:", error.message);
			return false;
		}
	}
};

module.exports = cryptoService;

