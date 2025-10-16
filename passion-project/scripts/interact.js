const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * Interactive script to demonstrate DAO functionality
 *
 * This script shows how to:
 * - Create proposals
 * - Vote on proposals
 * - Execute proposals
 * - Check balances and state
 */

async function main() {
  console.log("🎨 Creative Grants DAO - Interactive Demo\n");

  // Get signers
  const [owner, proposer, voter1, voter2] = await ethers.getSigners();

  // Replace these with your deployed contract addresses
  const GOVERNANCE_TOKEN_ADDRESS = "YOUR_TOKEN_ADDRESS";
  const PROPOSAL_NFT_ADDRESS = "YOUR_NFT_ADDRESS";
  const GRANTS_DAO_ADDRESS = "YOUR_DAO_ADDRESS";

  // Connect to deployed contracts
  console.log("📡 Connecting to contracts...");
  const governanceToken = await ethers.getContractAt("GovernanceToken", GOVERNANCE_TOKEN_ADDRESS);
  const proposalNFT = await ethers.getContractAt("ProposalNFT", PROPOSAL_NFT_ADDRESS);
  const grantsDAO = await ethers.getContractAt("GrantsDAO", GRANTS_DAO_ADDRESS);
  console.log("✅ Connected!\n");

  // Check treasury balance
  console.log("💰 Treasury Status:");
  const treasuryBalance = await grantsDAO.getTreasuryBalance();
  console.log(`   Balance: ${ethers.formatEther(treasuryBalance)} ETH\n`);

  // Check governance token distribution
  console.log("🪙 Token Distribution:");
  const ownerBalance = await governanceToken.balanceOf(owner.address);
  console.log(`   Owner: ${ethers.formatEther(ownerBalance)} tokens`);

  // Distribute tokens to other users if needed
  console.log("\n📤 Distributing tokens to community members...");
  if (ethers.formatEther(ownerBalance) > 1000) {
    await governanceToken.transfer(proposer.address, ethers.parseEther("500"));
    await governanceToken.transfer(voter1.address, ethers.parseEther("15000"));
    await governanceToken.transfer(voter2.address, ethers.parseEther("10000"));
    console.log("✅ Tokens distributed!");
  }

  // Create a proposal
  console.log("\n📝 Creating a new proposal...");
  const createTx = await grantsDAO.connect(proposer).createProposal(
    "Web3 Creative Platform",
    "A decentralized platform for showcasing creative work",
    "ipfs://QmExampleHash123",
    ethers.parseEther("1")
  );
  await createTx.wait();
  console.log("✅ Proposal created!");

  // Get proposal details
  const proposalCount = await grantsDAO.proposalCount();
  console.log(`   Proposal ID: ${proposalCount}`);

  const proposal = await grantsDAO.getProposal(proposalCount);
  console.log(`   Title: ${proposal.title}`);
  console.log(`   Amount: ${ethers.formatEther(proposal.requestedAmount)} ETH`);
  console.log(`   Proposer: ${proposal.proposer}`);

  // Vote on the proposal
  console.log("\n🗳️  Casting votes...");
  await grantsDAO.connect(voter1).castVote(proposalCount, true);
  console.log("   ✅ Voter 1 voted FOR");

  await grantsDAO.connect(voter2).castVote(proposalCount, true);
  console.log("   ✅ Voter 2 voted FOR");

  // Check voting results
  const updatedProposal = await grantsDAO.getProposal(proposalCount);
  console.log(`\n   For Votes: ${ethers.formatEther(updatedProposal.forVotes)} tokens`);
  console.log(`   Against Votes: ${ethers.formatEther(updatedProposal.againstVotes)} tokens`);

  // Note: In a real scenario, you'd wait for the voting period to end
  console.log("\n⏰ Waiting for voting period to end...");
  console.log("   (In production, this would be 7 days)");
  console.log("   (For demo, use Hardhat time helpers)");

  // Example of finalizing (would need time travel in real test)
  console.log("\n📊 After voting period ends:");
  console.log("   1. Call finalizeProposal()");
  console.log("   2. If successful, call executeProposal()");
  console.log("   3. Funds distributed + NFT minted!");

  console.log("\n🎉 Demo complete!");
  console.log("\n📖 Next steps:");
  console.log("   - Check QUICKSTART.md for more examples");
  console.log("   - Run tests: npm test");
  console.log("   - Deploy to testnet: see QUICKSTART.md");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
