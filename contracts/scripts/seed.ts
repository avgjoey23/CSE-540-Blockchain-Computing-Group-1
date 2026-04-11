import "@nomicfoundation/hardhat-ethers";
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
    const [owner, testUser] = await ethers.getSigners();

    // Attach to already-deployed contracts
    const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    const didRegistry = DIDRegistry.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");

    const CredentialStatus = await ethers.getContractFactory("CredentialStatus");
    const credentialStatus = CredentialStatus.attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");

    // Use Hardhat's Account #1 as our test user
    const testUserAddress = await testUser.getAddress();
    console.log(`Test user wallet address: ${testUserAddress}`);

    // Hash the wallet address to get the userDIDID — this matches what the backend does
    const userDIDID = ethers.keccak256(ethers.toUtf8Bytes(testUserAddress));
    console.log(`userDIDID: ${userDIDID}`);

    // Use a placeholder IPFS CID for now (32 bytes of dummy data)
    const placeholderCID = ethers.keccak256(ethers.toUtf8Bytes("placeholder-cid"));

    // Register the user — must be called by the user's own wallet
    await didRegistry.connect(testUser).registerUser(userDIDID, placeholderCID);
    console.log(`User registered in DIDRegistry`);

    // Create a VC hash representing ownership of movie ID 1
    const vcHash = ethers.keccak256(ethers.toUtf8Bytes(`${testUserAddress}:movie:1`));
    console.log(`vcHash for movie 1: ${vcHash}`);

    // Issue the credential — must be called by a trusted issuer
    // First register the owner as a trusted issuer
    const ownerAddress = await owner.getAddress();
    const issuerDIDID = ethers.keccak256(ethers.toUtf8Bytes(ownerAddress));
    await didRegistry.connect(owner).registerIssuer(ownerAddress, issuerDIDID, placeholderCID);
    console.log(`Owner registered as trusted issuer`);

    // Now issue the credential
    await credentialStatus.connect(owner).issueCredential(vcHash);
    console.log(`Credential issued for movie 1`);

    console.log("\n--- Save these values for testing ---");
    console.log(`walletAddress: ${testUserAddress}`);
    console.log(`vcHash: ${vcHash}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});