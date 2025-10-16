# 🎨 Creative Grants DAO

> A decentralized autonomous organization for funding creative projects in the web3 space

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.22.0-yellow)](https://hardhat.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.1.0-purple)](https://openzeppelin.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

## 🌟 Overview

Creative Grants DAO is a fully decentralized platform that empowers communities to fund innovative creative projects through democratic governance. Built with transparency and inclusivity at its core, the DAO allows token holders to propose, vote on, and fund projects that push the boundaries of art, technology, and culture in web3.

### Key Features

- **🗳️ Democratic Governance**: Token-based voting system where community members decide which projects get funded
- **🎨 NFT Achievement Tokens**: Successful proposals are commemorated with unique NFTs minted to project creators
- **💰 Transparent Treasury**: On-chain treasury management with full visibility into fund allocation
- **⏱️ Time-Locked Voting**: Configurable voting periods with quorum requirements to ensure fair participation
- **📊 Proposal Lifecycle**: Clear states from proposal creation through execution
- **🔒 Secure Architecture**: Built with OpenZeppelin contracts and comprehensive test coverage

## 📋 Table of Contents

- [Architecture](#-architecture)
- [Smart Contracts](#-smart-contracts)
- [Getting Started](#-getting-started)
- [Usage](#-usage)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

## 🏗️ Architecture

The Creative Grants DAO consists of three main smart contracts:

```
┌─────────────────────────────────────────┐
│          GovernanceToken (ERC20)         │
│  - Voting power                          │
│  - Token distribution                    │
└────────────┬─────────────────────────────┘
             │
             │ Used for voting
             ▼
┌─────────────────────────────────────────┐
│            GrantsDAO (Main)              │
│  - Proposal management                   │
│  - Voting mechanism                      │
│  - Treasury management                   │
│  - Proposal execution                    │
└────────────┬─────────────────────────────┘
             │
             │ Mints on success
             ▼
┌─────────────────────────────────────────┐
│         ProposalNFT (ERC721)             │
│  - Achievement NFTs                      │
│  - Proposal history                      │
└─────────────────────────────────────────┘
```

## 📜 Smart Contracts

### GrantsDAO

The main contract managing the entire DAO lifecycle.

**Key Functions:**
- `createProposal()`: Submit a new grant proposal
- `castVote()`: Vote on active proposals
- `finalizeProposal()`: Finalize voting after period ends
- `executeProposal()`: Execute successful proposals and distribute funds
- `cancelProposal()`: Cancel proposals (proposer only)

**Configuration:**
- **Proposal Threshold**: Minimum tokens required to create a proposal
- **Voting Period**: Duration of voting in seconds
- **Quorum Percentage**: Minimum participation required (in basis points)

### GovernanceToken

ERC20 token representing voting power in the DAO.

**Features:**
- Maximum supply cap (1,000,000 tokens)
- Burnable tokens
- Batch minting capability
- Voting power queries

### ProposalNFT

ERC721 NFT contract that mints achievement tokens for funded projects.

**Features:**
- Unique NFTs for each funded proposal
- IPFS metadata storage
- Historical record of funded projects
- Token enumeration for creators

## 🚀 Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd passion-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```
   SEPOLIA_RPC_URL=your_alchemy_or_infura_url
   PRIVATE_KEY=your_deployment_private_key
   ETHERSCAN_API_KEY=your_etherscan_api_key
   REPORT_GAS=true
   ```

4. **Compile contracts**
   ```bash
   npm run compile
   ```

5. **Run tests**
   ```bash
   npm test
   ```

## 💡 Usage

### Creating a Proposal

To create a proposal, you need to hold at least the threshold amount of governance tokens:

```javascript
const tx = await grantsDAO.createProposal(
  "Build a Web3 Art Gallery",
  "A decentralized platform for artists to showcase their work",
  "ipfs://QmYourMetadataHash",
  ethers.parseEther("5") // Requesting 5 ETH
);
```

### Voting on Proposals

Any token holder can vote on active proposals:

```javascript
// Vote in favor
await grantsDAO.castVote(proposalId, true);

// Vote against
await grantsDAO.castVote(proposalId, false);
```

### Executing Proposals

After the voting period ends and a proposal succeeds:

```javascript
// Finalize the proposal
await grantsDAO.finalizeProposal(proposalId);

// Execute and distribute funds
await grantsDAO.executeProposal(proposalId);
```

### Contributing to Treasury

Anyone can contribute ETH to the DAO treasury:

```javascript
// Using depositFunds function
await grantsDAO.depositFunds({ value: ethers.parseEther("10") });

// Or send ETH directly
await signer.sendTransaction({
  to: grantsDAOAddress,
  value: ethers.parseEther("10")
});
```

## 🧪 Testing

The project includes comprehensive test coverage (38 tests covering all major functionality):

```bash
# Run all tests
npm test

# Run tests with gas reporting
REPORT_GAS=true npm test

# Run tests with coverage
npx hardhat coverage
```

### Test Coverage Areas

- ✅ Contract deployment
- ✅ Governance token functionality
- ✅ Proposal creation and validation
- ✅ Voting mechanism
- ✅ Proposal finalization
- ✅ Proposal execution and fund distribution
- ✅ NFT minting for successful proposals
- ✅ Proposal cancellation
- ✅ DAO administration
- ✅ Treasury management

## 🚢 Deployment

### Local Deployment

1. **Start a local Hardhat node**
   ```bash
   npm run node
   ```

2. **Deploy contracts (in a new terminal)**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

### Testnet Deployment (Sepolia)

1. **Configure your `.env` file** with Sepolia RPC URL and private key

2. **Deploy to Sepolia**
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```

3. **Verify contracts on Etherscan**
   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
   ```

### Deployment Output

The deployment script will output:
- Contract addresses for all three contracts
- Treasury balance
- Initial token distribution
- Verification commands for Etherscan

## 🔒 Security

### Best Practices

- ✅ Uses OpenZeppelin's audited contract implementations
- ✅ Implements ReentrancyGuard for external calls
- ✅ Includes comprehensive input validation
- ✅ Follows checks-effects-interactions pattern
- ✅ Extensive test coverage

### Known Considerations

- The DAO owner has special privileges (minting tokens, updating parameters)
- Consider implementing a timelock for owner functions in production
- Proposal threshold should be set carefully to prevent spam
- For production, consider implementing delegation for voting power

### Auditing

⚠️ **This code has NOT been professionally audited.** Do NOT deploy to mainnet without a thorough security audit.

## 📊 Project Statistics

- **Total Contracts**: 3
- **Lines of Solidity**: ~800
- **Test Cases**: 38
- **Test Coverage**: High (all critical paths covered)
- **OpenZeppelin Dependencies**: 10+

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Hardhat](https://hardhat.org/)
- Secured by [OpenZeppelin](https://openzeppelin.com/)
- Inspired by the amazing web3 community

## 📞 Contact & Resources

- **Documentation**: See [QUICKSTART.md](QUICKSTART.md) for a quick start guide
- **Issues**: Open an issue for bugs or feature requests
- **Discussions**: Share ideas and ask questions in Discussions

---

**Made with ❤️ for the creative web3 community**

