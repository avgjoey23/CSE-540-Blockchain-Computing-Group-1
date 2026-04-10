import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";

export default {
  solidity: "0.8.28",
  networks: {
    localhost: {
      gas: 12000000,
    },
  },
} satisfies HardhatUserConfig;