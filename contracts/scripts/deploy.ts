import "@nomicfoundation/hardhat-ethers";
import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
    // Deploy DIDRegistry first since CredentialStatus depends on its address
    const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    const didRegistry = await DIDRegistry.deploy();
    await didRegistry.waitForDeployment();
    const didRegistryAddress = await didRegistry.getAddress();
    console.log(`DIDRegistry deployed to: ${didRegistryAddress}`);

    // Deploy CredentialStatus, passing the DIDRegistry address to its constructor
    const CredentialStatus = await ethers.getContractFactory("CredentialStatus");
    const credentialStatus = await CredentialStatus.deploy(didRegistryAddress);
    await credentialStatus.waitForDeployment();
    const credentialStatusAddress = await credentialStatus.getAddress();
    console.log(`CredentialStatus deployed to: ${credentialStatusAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});