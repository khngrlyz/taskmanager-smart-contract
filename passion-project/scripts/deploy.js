const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * Main deployment script for Creative Grants DAO
 *
 * Deploys:
 * 1. GovernanceToken - ERC20 token for voting
 * 2. ProposalNFT - NFT for funded projects
 * 3. GrantsDAO - Main DAO contract
 *
 * After deployment, it:
 * - Links contracts together
 * - Funds the DAO treasury
 * - Distributes initial governance tokens
 */
async function main() {
  console.log("🚀 Starting Creative Grants DAO deployment...\n");

  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);

  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // ==================== DEPLOYMENT PARAMETERS ====================

  // Governance Token Parameters
  const TOKEN_NAME = "Creative DAO Token";
  const TOKEN_SYMBOL = "CREATE";
  const INITIAL_SUPPLY = ethers.parseEther("100000"); // 100,000 tokens

  // Proposal NFT Parameters
  const NFT_NAME = "Creative Grants Achievement";
  const NFT_SYMBOL = "CGA";

  // DAO Parameters
  const PROPOSAL_THRESHOLD = ethers.parseEther("100"); // Need 100 tokens to create proposal
  const VOTING_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds
  const QUORUM_PERCENTAGE = 1000; // 10% (in basis points)
  const INITIAL_TREASURY_FUNDING = ethers.parseEther("5"); // 5 ETH

  console.log("📋 Deployment Parameters:");
  console.log("   Token Name:", TOKEN_NAME);
  console.log("   Token Symbol:", TOKEN_SYMBOL);
  console.log("   Initial Supply:", ethers.formatEther(INITIAL_SUPPLY), TOKEN_SYMBOL);
  console.log("   Proposal Threshold:", ethers.formatEther(PROPOSAL_THRESHOLD), TOKEN_SYMBOL);
  console.log("   Voting Period:", VOTING_PERIOD / (24 * 60 * 60), "days");
  console.log("   Quorum:", QUORUM_PERCENTAGE / 100, "%");
  console.log("   Initial Treasury:", ethers.formatEther(INITIAL_TREASURY_FUNDING), "ETH\n");

  // ==================== DEPLOY GOVERNANCE TOKEN ====================

  console.log("🪙 Deploying GovernanceToken...");
  const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
  const governanceToken = await GovernanceToken.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    INITIAL_SUPPLY
  );
  await governanceToken.waitForDeployment();
  const tokenAddress = await governanceToken.getAddress();
  console.log("✅ GovernanceToken deployed to:", tokenAddress);
  console.log("   Total Supply:", ethers.formatEther(await governanceToken.totalSupply()), TOKEN_SYMBOL, "\n");

  // ==================== DEPLOY PROPOSAL NFT ====================

  console.log("🎨 Deploying ProposalNFT...");
  const ProposalNFT = await ethers.getContractFactory("ProposalNFT");
  const proposalNFT = await ProposalNFT.deploy(NFT_NAME, NFT_SYMBOL);
  await proposalNFT.waitForDeployment();
  const nftAddress = await proposalNFT.getAddress();
  console.log("✅ ProposalNFT deployed to:", nftAddress, "\n");

  // ==================== DEPLOY GRANTS DAO ====================

  console.log("🏛️  Deploying GrantsDAO...");
  const GrantsDAO = await ethers.getContractFactory("GrantsDAO");
  const grantsDAO = await GrantsDAO.deploy(
    tokenAddress,
    nftAddress,
    PROPOSAL_THRESHOLD,
    VOTING_PERIOD,
    QUORUM_PERCENTAGE
  );
  await grantsDAO.waitForDeployment();
  const daoAddress = await grantsDAO.getAddress();
  console.log("✅ GrantsDAO deployed to:", daoAddress, "\n");

  // ==================== SETUP & CONFIGURATION ====================

  console.log("⚙️  Configuring contracts...");

  // Set GrantsDAO address in ProposalNFT
  console.log("   🔗 Linking ProposalNFT to GrantsDAO...");
  const setDaoTx = await proposalNFT.setGrantsDAO(daoAddress);
  await setDaoTx.wait();
  console.log("   ✅ ProposalNFT linked to GrantsDAO");

  // Fund the DAO treasury
  if (INITIAL_TREASURY_FUNDING > 0) {
    console.log("   💸 Funding DAO treasury...");
    const fundTx = await deployer.sendTransaction({
      to: daoAddress,
      value: INITIAL_TREASURY_FUNDING,
    });
    await fundTx.wait();
    const treasuryBalance = await grantsDAO.getTreasuryBalance();
    console.log("   ✅ Treasury funded with:", ethers.formatEther(treasuryBalance), "ETH");
  }

  console.log("\n");

  // ==================== SUMMARY ====================

  console.log("═══════════════════════════════════════════════════════════");
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("\n📜 Deployed Contract Addresses:");
  console.log("   GovernanceToken:", tokenAddress);
  console.log("   ProposalNFT:    ", nftAddress);
  console.log("   GrantsDAO:      ", daoAddress);
  console.log("\n💾 Save these addresses for interaction!");
  console.log("\n📊 Next Steps:");
  console.log("   1. Distribute governance tokens to community members");
  console.log("   2. Create your first proposal");
  console.log("   3. Vote on proposals");
  console.log("   4. Execute successful proposals");
  console.log("\n🔍 Verify contracts on Etherscan (if on testnet/mainnet):");
  console.log(`   npx hardhat verify --network <network> ${tokenAddress} "${TOKEN_NAME}" "${TOKEN_SYMBOL}" ${INITIAL_SUPPLY}`);
  console.log(`   npx hardhat verify --network <network> ${nftAddress} "${NFT_NAME}" "${NFT_SYMBOL}"`);
  console.log(`   npx hardhat verify --network <network> ${daoAddress} ${tokenAddress} ${nftAddress} ${PROPOSAL_THRESHOLD} ${VOTING_PERIOD} ${QUORUM_PERCENTAGE}`);
  console.log("\n═══════════════════════════════════════════════════════════\n");

  // Return addresses for testing/scripting purposes
  return {
    governanceToken: tokenAddress,
    proposalNFT: nftAddress,
    grantsDAO: daoAddress,
  };
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
