# 🚀 Creative Grants DAO - Quick Start Guide

Welcome to the Creative Grants DAO! This guide will help you get up and running in minutes.

## ⚡ 5-Minute Setup

### 1. Install & Setup

```bash
# Clone and navigate to the project
cd passion-project

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 2. Compile & Test

```bash
# Compile the smart contracts
npm run compile

# Run tests to ensure everything works
npm test
```

Expected output: `✅ 38 passing`

### 3. Deploy Locally

```bash
# Terminal 1: Start local blockchain
npm run node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
```

🎉 **You're now running a local Creative Grants DAO!**

---

## 📖 How It Works

### The DAO Flow

```
1. 💰 Fund Treasury
   ↓
2. 📝 Create Proposal
   ↓
3. 🗳️  Community Votes (7 days)
   ↓
4. ✅ Finalize Proposal
   ↓
5. 💸 Execute & Distribute Funds
   ↓
6. 🎨 Receive Achievement NFT
```

---

## 🎯 Quick Examples

### Example 1: Create Your First Proposal

```javascript
// Connect to your deployed GrantsDAO
const grantsDAO = await ethers.getContractAt("GrantsDAO", GRANTS_DAO_ADDRESS);

// Create a proposal (need 100+ governance tokens)
const tx = await grantsDAO.createProposal(
  "Web3 Music Platform",                    // Title
  "Decentralized streaming for artists",    // Description
  "ipfs://QmYourIPFSHash",                   // Metadata URI
  ethers.parseEther("2")                     // Requesting 2 ETH
);

await tx.wait();
console.log("✅ Proposal created!");
```

### Example 2: Vote on a Proposal

```javascript
// Get governance tokens first
const governanceToken = await ethers.getContractAt("GovernanceToken", TOKEN_ADDRESS);

// Check your voting power
const votingPower = await governanceToken.balanceOf(yourAddress);
console.log(`Your voting power: ${ethers.formatEther(votingPower)} tokens`);

// Cast your vote (true = for, false = against)
const voteTx = await grantsDAO.castVote(1, true);
await voteTx.wait();
console.log("✅ Vote cast!");
```

### Example 3: Execute a Successful Proposal

```javascript
// After voting period ends (7 days)...

// 1. Finalize the proposal
await grantsDAO.finalizeProposal(1);

// 2. Check if it succeeded
const proposal = await grantsDAO.getProposal(1);
console.log("Proposal state:", proposal.state);
// State 3 = Succeeded

// 3. Execute and distribute funds
await grantsDAO.executeProposal(1);
console.log("✅ Funds distributed! NFT minted!");
```

---

## 💰 Managing Treasury

### Add Funds to Treasury

```javascript
// Method 1: Using depositFunds()
await grantsDAO.depositFunds({ value: ethers.parseEther("10") });

// Method 2: Direct ETH transfer
await signer.sendTransaction({
  to: GRANTS_DAO_ADDRESS,
  value: ethers.parseEther("10")
});

// Check treasury balance
const balance = await grantsDAO.getTreasuryBalance();
console.log(`Treasury: ${ethers.formatEther(balance)} ETH`);
```

---

## 🎨 NFT Achievements

Every funded project receives a unique NFT!

```javascript
const proposalNFT = await ethers.getContractAt("ProposalNFT", NFT_ADDRESS);

// Check your achievement NFTs
const myNFTs = await proposalNFT.tokensOfOwner(yourAddress);
console.log(`You have ${myNFTs.length} achievement NFTs!`);

// Get NFT details
for (let tokenId of myNFTs) {
  const info = await proposalNFT.getProposalInfo(tokenId);
  console.log(`NFT #${tokenId}: ${info.title}`);
  console.log(`  Created: ${new Date(info.mintedAt * 1000).toLocaleDateString()}`);
  console.log(`  Metadata: ${info.metadataURI}`);
}
```

---

## 🛠️ Common Tasks

### Get Governance Tokens

```javascript
// If you're the owner, you can mint tokens
const governanceToken = await ethers.getContractAt("GovernanceToken", TOKEN_ADDRESS);

// Mint tokens to an address
await governanceToken.mint(recipientAddress, ethers.parseEther("1000"));

// Or batch mint to multiple addresses
const recipients = [address1, address2, address3];
const amounts = [
  ethers.parseEther("500"),
  ethers.parseEther("500"),
  ethers.parseEther("500")
];
await governanceToken.batchMint(recipients, amounts);
```

### Check Proposal Status

```javascript
const proposal = await grantsDAO.getProposal(proposalId);

console.log("Proposal:", proposal.title);
console.log("Proposer:", proposal.proposer);
console.log("Requested Amount:", ethers.formatEther(proposal.requestedAmount), "ETH");
console.log("For Votes:", ethers.formatEther(proposal.forVotes));
console.log("Against Votes:", ethers.formatEther(proposal.againstVotes));

// State values:
// 0 = Pending, 1 = Active, 2 = Defeated
// 3 = Succeeded, 4 = Executed, 5 = Cancelled
console.log("State:", proposal.state);
```

### Cancel a Proposal

```javascript
// Only the proposer can cancel their active/pending proposal
await grantsDAO.cancelProposal(proposalId);
console.log("✅ Proposal cancelled");
```

---

## 📊 DAO Configuration

Default settings (can be updated by owner):

```javascript
// Check current parameters
const threshold = await grantsDAO.proposalThreshold();
const period = await grantsDAO.votingPeriod();
const quorum = await grantsDAO.quorumPercentage();

console.log(`Proposal Threshold: ${ethers.formatEther(threshold)} tokens`);
console.log(`Voting Period: ${period / (24 * 60 * 60)} days`);
console.log(`Quorum: ${quorum / 100}%`);

// Update parameters (owner only)
await grantsDAO.updateParameters(
  ethers.parseEther("200"),  // New threshold: 200 tokens
  14 * 24 * 60 * 60,         // New period: 14 days
  1500                       // New quorum: 15%
);
```

---

## 🔗 Testnet Deployment

### Deploy to Sepolia

1. **Get testnet ETH** from [Sepolia Faucet](https://sepoliafaucet.com/)

2. **Update `.env`:**
   ```
   SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
   PRIVATE_KEY=your_private_key
   ETHERSCAN_API_KEY=your_etherscan_key
   ```

3. **Deploy:**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

4. **Verify on Etherscan:**
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
   ```

---

## 🐛 Troubleshooting

### Issue: "Insufficient tokens to create proposal"
**Solution:** Make sure you have at least the threshold amount (default: 100 tokens)
```javascript
const balance = await governanceToken.balanceOf(yourAddress);
console.log("Your balance:", ethers.formatEther(balance));
```

### Issue: "Voting period has ended"
**Solution:** Proposals have a 7-day voting window. Check the proposal's `votingEndTime`
```javascript
const proposal = await grantsDAO.getProposal(proposalId);
const endTime = new Date(proposal.votingEndTime * 1000);
console.log("Voting ends:", endTime);
```

### Issue: "Insufficient treasury funds"
**Solution:** The DAO treasury needs enough ETH to fund the proposal
```javascript
const treasuryBalance = await grantsDAO.getTreasuryBalance();
console.log("Treasury has:", ethers.formatEther(treasuryBalance), "ETH");
```

### Issue: Tests failing
**Solution:** Clean and reinstall dependencies
```bash
rm -rf node_modules cache artifacts
npm install
npm run compile
npm test
```

---

## 📚 Next Steps

- **Read the full [README.md](README.md)** for detailed documentation
- **Explore the contracts** in the `contracts/` directory
- **Review tests** in `test/` to see usage examples
- **Customize parameters** in the deployment script
- **Create a frontend** to interact with your DAO

---

## 🤝 Need Help?

- Check out example interactions in `test/GrantsDAO.test.js`
- Review Hardhat docs: https://hardhat.org/docs
- OpenZeppelin docs: https://docs.openzeppelin.com/
- Open an issue if you encounter problems

---

**Happy building! 🎉**

*Created with passion for the web3 creative community*
