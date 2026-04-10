import "@nomicfoundation/hardhat-ethers";
import pkg from "hardhat";
import fs from "fs";
import path from "path";
const { ethers } = pkg;

async function main() {
    const DIDRegistry = await ethers.getContractFactory("DIDRegistry");
    const didRegistry = await DIDRegistry.deploy();
    await didRegistry.waitForDeployment();
    const didRegistryAddress = await didRegistry.getAddress();
    console.log(`DIDRegistry deployed to: ${didRegistryAddress}`);

    const CredentialStatus = await ethers.getContractFactory("CredentialStatus");
    const credentialStatus = await CredentialStatus.deploy(didRegistryAddress);
    await credentialStatus.waitForDeployment();
    const credentialStatusAddress = await credentialStatus.getAddress();
    console.log(`CredentialStatus deployed to: ${credentialStatusAddress}`);

    // Write addresses directly to backend config.js
    const configPath = path.resolve("../backend/config.js");
    const configContent = `module.exports = {
    DID_REGISTRY_ADDRESS: '${didRegistryAddress}',
    CREDENTIAL_STATUS_ADDRESS: '${credentialStatusAddress}',
    RPC_URL: 'http://127.0.0.1:8545'
}\n`;

    fs.writeFileSync(configPath, configContent);
    console.log("config.js updated with new contract addresses.");
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});