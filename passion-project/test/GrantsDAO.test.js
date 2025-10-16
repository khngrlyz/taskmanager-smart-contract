const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Creative Grants DAO - Complete Test Suite", function () {
  let governanceToken;
  let proposalNFT;
  let grantsDAO;
  let owner;
  let proposer;
  let voter1;
  let voter2;
  let voter3;

  const TOKEN_NAME = "Creative DAO Token";
  const TOKEN_SYMBOL = "CREATE";
  const INITIAL_SUPPLY = ethers.parseEther("100000");
  const NFT_NAME = "Creative Grants Achievement";
  const NFT_SYMBOL = "CGA";
  const PROPOSAL_THRESHOLD = ethers.parseEther("100");
  const VOTING_PERIOD = 7 * 24 * 60 * 60; // 7 days
  const QUORUM_PERCENTAGE = 1000; // 10%

  beforeEach(async function () {
    // Get signers
    [owner, proposer, voter1, voter2, voter3] = await ethers.getSigners();

    // Deploy GovernanceToken
    const GovernanceToken = await ethers.getContractFactory("GovernanceToken");
    governanceToken = await GovernanceToken.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      INITIAL_SUPPLY
    );
    await governanceToken.waitForDeployment();

    // Deploy ProposalNFT
    const ProposalNFT = await ethers.getContractFactory("ProposalNFT");
    proposalNFT = await ProposalNFT.deploy(NFT_NAME, NFT_SYMBOL);
    await proposalNFT.waitForDeployment();

    // Deploy GrantsDAO
    const GrantsDAO = await ethers.getContractFactory("GrantsDAO");
    grantsDAO = await GrantsDAO.deploy(
      await governanceToken.getAddress(),
      await proposalNFT.getAddress(),
      PROPOSAL_THRESHOLD,
      VOTING_PERIOD,
      QUORUM_PERCENTAGE
    );
    await grantsDAO.waitForDeployment();

    // Link ProposalNFT to GrantsDAO
    await proposalNFT.setGrantsDAO(await grantsDAO.getAddress());

    // Distribute tokens for testing
    await governanceToken.transfer(proposer.address, ethers.parseEther("500"));
    await governanceToken.transfer(voter1.address, ethers.parseEther("15000"));
    await governanceToken.transfer(voter2.address, ethers.parseEther("10000"));
    await governanceToken.transfer(voter3.address, ethers.parseEther("5000"));

    // Fund the DAO
    await owner.sendTransaction({
      to: await grantsDAO.getAddress(),
      value: ethers.parseEther("10"),
    });
  });

  describe("🏗️  Deployment", function () {
    it("Should deploy all contracts successfully", async function () {
      expect(await governanceToken.getAddress()).to.be.properAddress;
      expect(await proposalNFT.getAddress()).to.be.properAddress;
      expect(await grantsDAO.getAddress()).to.be.properAddress;
    });

    it("Should set correct initial parameters", async function () {
      expect(await grantsDAO.proposalThreshold()).to.equal(PROPOSAL_THRESHOLD);
      expect(await grantsDAO.votingPeriod()).to.equal(VOTING_PERIOD);
      expect(await grantsDAO.quorumPercentage()).to.equal(QUORUM_PERCENTAGE);
    });

    it("Should have correct token distribution", async function () {
      expect(await governanceToken.balanceOf(proposer.address)).to.equal(
        ethers.parseEther("500")
      );
      expect(await governanceToken.balanceOf(voter1.address)).to.equal(
        ethers.parseEther("15000")
      );
    });

    it("Should have correct treasury balance", async function () {
      expect(await grantsDAO.getTreasuryBalance()).to.equal(
        ethers.parseEther("10")
      );
    });
  });

  describe("🪙 Governance Token", function () {
    it("Should have correct name and symbol", async function () {
      expect(await governanceToken.name()).to.equal(TOKEN_NAME);
      expect(await governanceToken.symbol()).to.equal(TOKEN_SYMBOL);
    });

    it("Should allow owner to mint new tokens", async function () {
      const mintAmount = ethers.parseEther("1000");
      await governanceToken.mint(voter1.address, mintAmount);
      expect(await governanceToken.balanceOf(voter1.address)).to.equal(
        ethers.parseEther("16000")
      );
    });

    it("Should not allow minting beyond max supply", async function () {
      const maxSupply = await governanceToken.MAX_SUPPLY();
      const currentSupply = await governanceToken.totalSupply();
      const excessAmount = maxSupply - currentSupply + BigInt(1);

      await expect(
        governanceToken.mint(voter1.address, excessAmount)
      ).to.be.revertedWith("Minting would exceed max supply");
    });

    it("Should allow token burning", async function () {
      const burnAmount = ethers.parseEther("100");
      await governanceToken.connect(voter1).burn(burnAmount);
      expect(await governanceToken.balanceOf(voter1.address)).to.equal(
        ethers.parseEther("14900")
      );
    });

    it("Should check voting power correctly", async function () {
      expect(await governanceToken.hasVotingPower(voter1.address)).to.be.true;
      expect(await governanceToken.getVotingPower(voter1.address)).to.equal(
        ethers.parseEther("15000")
      );
    });
  });

  describe("📝 Proposal Creation", function () {
    it("Should allow eligible users to create proposals", async function () {
      const tx = await grantsDAO
        .connect(proposer)
        .createProposal(
          "Build a Web3 Art Gallery",
          "A decentralized platform for artists",
          "ipfs://QmTest123",
          ethers.parseEther("1")
        );

      await expect(tx)
        .to.emit(grantsDAO, "ProposalCreated")
        .withArgs(
          1,
          proposer.address,
          "Build a Web3 Art Gallery",
          ethers.parseEther("1"),
          await time.latest(),
          (await time.latest()) + VOTING_PERIOD
        );

      expect(await grantsDAO.proposalCount()).to.equal(1);
    });

    it("Should reject proposals from users without enough tokens", async function () {
      const signers = await ethers.getSigners();
      const noTokenUser = signers[10]; // Use a signer that has no tokens
      await expect(
        grantsDAO
          .connect(noTokenUser)
          .createProposal(
            "Test",
            "Test",
            "ipfs://test",
            ethers.parseEther("1")
          )
      ).to.be.revertedWith("Insufficient tokens to create proposal");
    });

    it("Should reject proposals exceeding treasury balance", async function () {
      await expect(
        grantsDAO
          .connect(proposer)
          .createProposal(
            "Expensive Project",
            "Too expensive",
            "ipfs://test",
            ethers.parseEther("100")
          )
      ).to.be.revertedWith("Insufficient treasury funds");
    });

    it("Should reject proposals with empty title", async function () {
      await expect(
        grantsDAO
          .connect(proposer)
          .createProposal("", "Description", "ipfs://test", ethers.parseEther("1"))
      ).to.be.revertedWith("Title cannot be empty");
    });
  });

  describe("🗳️  Voting", function () {
    beforeEach(async function () {
      // Create a proposal
      await grantsDAO
        .connect(proposer)
        .createProposal(
          "Test Proposal",
          "Test Description",
          "ipfs://test",
          ethers.parseEther("1")
        );
    });

    it("Should allow token holders to vote", async function () {
      await expect(grantsDAO.connect(voter1).castVote(1, true))
        .to.emit(grantsDAO, "VoteCast")
        .withArgs(voter1.address, 1, true, ethers.parseEther("15000"));

      const proposal = await grantsDAO.getProposal(1);
      expect(proposal.forVotes).to.equal(ethers.parseEther("15000"));
    });

    it("Should not allow voting twice", async function () {
      await grantsDAO.connect(voter1).castVote(1, true);
      await expect(
        grantsDAO.connect(voter1).castVote(1, true)
      ).to.be.revertedWith("Already voted");
    });

    it("Should correctly count for and against votes", async function () {
      await grantsDAO.connect(voter1).castVote(1, true);
      await grantsDAO.connect(voter2).castVote(1, true);
      await grantsDAO.connect(voter3).castVote(1, false);

      const proposal = await grantsDAO.getProposal(1);
      expect(proposal.forVotes).to.equal(ethers.parseEther("25000"));
      expect(proposal.againstVotes).to.equal(ethers.parseEther("5000"));
    });

    it("Should not allow voting after period ends", async function () {
      await time.increase(VOTING_PERIOD + 1);
      await expect(
        grantsDAO.connect(voter1).castVote(1, true)
      ).to.be.revertedWith("Voting period has ended");
    });

    it("Should track if an address has voted", async function () {
      await grantsDAO.connect(voter1).castVote(1, true);
      expect(await grantsDAO.hasVoted(1, voter1.address)).to.be.true;
      expect(await grantsDAO.hasVoted(1, voter2.address)).to.be.false;
    });
  });

  describe("✅ Proposal Finalization", function () {
    beforeEach(async function () {
      await grantsDAO
        .connect(proposer)
        .createProposal(
          "Test Proposal",
          "Test Description",
          "ipfs://test",
          ethers.parseEther("1")
        );
    });

    it("Should succeed when quorum is met and majority votes yes", async function () {
      // 15000 tokens is 15% of 100000, which exceeds 10% quorum
      await grantsDAO.connect(voter1).castVote(1, true);
      await time.increase(VOTING_PERIOD + 1);
      await grantsDAO.finalizeProposal(1);

      const proposal = await grantsDAO.getProposal(1);
      expect(proposal.state).to.equal(3); // Succeeded
    });

    it("Should fail when quorum is not met", async function () {
      // 500 tokens is only 0.5%, below 10% quorum
      await grantsDAO.connect(proposer).castVote(1, true);
      await time.increase(VOTING_PERIOD + 1);
      await grantsDAO.finalizeProposal(1);

      const proposal = await grantsDAO.getProposal(1);
      expect(proposal.state).to.equal(2); // Defeated
    });

    it("Should fail when more votes against than for", async function () {
      await grantsDAO.connect(voter1).castVote(1, false); // 15000 against
      await grantsDAO.connect(voter2).castVote(1, true); // 10000 for
      await time.increase(VOTING_PERIOD + 1);
      await grantsDAO.finalizeProposal(1);

      const proposal = await grantsDAO.getProposal(1);
      expect(proposal.state).to.equal(2); // Defeated
    });

    it("Should not finalize before voting period ends", async function () {
      await grantsDAO.connect(voter1).castVote(1, true);
      await expect(grantsDAO.finalizeProposal(1)).to.be.revertedWith(
        "Voting period not ended"
      );
    });
  });

  describe("💰 Proposal Execution", function () {
    beforeEach(async function () {
      await grantsDAO
        .connect(proposer)
        .createProposal(
          "Test Proposal",
          "Test Description",
          "ipfs://test",
          ethers.parseEther("1")
        );
      await grantsDAO.connect(voter1).castVote(1, true);
      await time.increase(VOTING_PERIOD + 1);
      await grantsDAO.finalizeProposal(1);
    });

    it("Should execute successful proposal and transfer funds", async function () {
      const initialBalance = await ethers.provider.getBalance(proposer.address);

      await expect(grantsDAO.executeProposal(1))
        .to.emit(grantsDAO, "ProposalExecuted")
        .withArgs(1, ethers.parseEther("1"));

      const finalBalance = await ethers.provider.getBalance(proposer.address);
      expect(finalBalance - initialBalance).to.equal(ethers.parseEther("1"));
    });

    it("Should mint NFT to proposer upon execution", async function () {
      await grantsDAO.executeProposal(1);

      const nftBalance = await proposalNFT.balanceOf(proposer.address);
      expect(nftBalance).to.equal(1);

      const tokenId = 1;
      expect(await proposalNFT.ownerOf(tokenId)).to.equal(proposer.address);
    });

    it("Should not allow double execution", async function () {
      await grantsDAO.executeProposal(1);
      await expect(grantsDAO.executeProposal(1)).to.be.revertedWith(
        "Proposal not succeeded"
      );
    });

    it("Should not execute defeated proposal", async function () {
      // Create and defeat a proposal
      await grantsDAO
        .connect(proposer)
        .createProposal(
          "Failed Proposal",
          "Will fail",
          "ipfs://fail",
          ethers.parseEther("0.5")
        );
      await grantsDAO.connect(proposer).castVote(2, true); // Not enough for quorum
      await time.increase(VOTING_PERIOD + 1);
      await grantsDAO.finalizeProposal(2);

      await expect(grantsDAO.executeProposal(2)).to.be.revertedWith(
        "Proposal not succeeded"
      );
    });
  });

  describe("🎨 Proposal NFT", function () {
    it("Should mint NFT with correct metadata", async function () {
      await grantsDAO
        .connect(proposer)
        .createProposal(
          "NFT Test Proposal",
          "Testing NFT minting",
          "ipfs://nfttest",
          ethers.parseEther("1")
        );
      await grantsDAO.connect(voter1).castVote(1, true);
      await time.increase(VOTING_PERIOD + 1);
      await grantsDAO.finalizeProposal(1);
      await grantsDAO.executeProposal(1);

      const info = await proposalNFT.getProposalInfo(1);
      expect(info.title).to.equal("NFT Test Proposal");
      expect(info.creator).to.equal(proposer.address);
      expect(info.metadataURI).to.equal("ipfs://nfttest");
    });

    it("Should return tokens owned by address", async function () {
      // Create and execute two proposals
      for (let i = 0; i < 2; i++) {
        await grantsDAO
          .connect(proposer)
          .createProposal(
            `Proposal ${i + 1}`,
            "Test",
            `ipfs://test${i}`,
            ethers.parseEther("0.5")
          );
        await grantsDAO.connect(voter1).castVote(i + 1, true);
        await time.increase(VOTING_PERIOD + 1);
        await grantsDAO.finalizeProposal(i + 1);
        await grantsDAO.executeProposal(i + 1);
      }

      const tokens = await proposalNFT.tokensOfOwner(proposer.address);
      expect(tokens.length).to.equal(2);
      expect(tokens[0]).to.equal(1);
      expect(tokens[1]).to.equal(2);
    });

    it("Should show correct total supply", async function () {
      expect(await proposalNFT.totalSupply()).to.equal(0);

      await grantsDAO
        .connect(proposer)
        .createProposal(
          "Supply Test",
          "Test",
          "ipfs://supply",
          ethers.parseEther("1")
        );
      await grantsDAO.connect(voter1).castVote(1, true);
      await time.increase(VOTING_PERIOD + 1);
      await grantsDAO.finalizeProposal(1);
      await grantsDAO.executeProposal(1);

      expect(await proposalNFT.totalSupply()).to.equal(1);
    });
  });

  describe("❌ Proposal Cancellation", function () {
    beforeEach(async function () {
      await grantsDAO
        .connect(proposer)
        .createProposal(
          "Cancellable Proposal",
          "Can be cancelled",
          "ipfs://cancel",
          ethers.parseEther("1")
        );
    });

    it("Should allow proposer to cancel their proposal", async function () {
      await expect(grantsDAO.connect(proposer).cancelProposal(1))
        .to.emit(grantsDAO, "ProposalCancelled")
        .withArgs(1);

      const proposal = await grantsDAO.getProposal(1);
      expect(proposal.state).to.equal(5); // Cancelled
    });

    it("Should not allow non-proposer to cancel", async function () {
      await expect(
        grantsDAO.connect(voter1).cancelProposal(1)
      ).to.be.revertedWith("Only proposer can cancel");
    });

    it("Should not cancel executed proposal", async function () {
      await grantsDAO.connect(voter1).castVote(1, true);
      await time.increase(VOTING_PERIOD + 1);
      await grantsDAO.finalizeProposal(1);

      await expect(
        grantsDAO.connect(proposer).cancelProposal(1)
      ).to.be.revertedWith("Cannot cancel proposal in current state");
    });
  });

  describe("⚙️  DAO Administration", function () {
    it("Should allow owner to update parameters", async function () {
      const newThreshold = ethers.parseEther("200");
      const newPeriod = 14 * 24 * 60 * 60;
      const newQuorum = 1500;

      await expect(
        grantsDAO.updateParameters(newThreshold, newPeriod, newQuorum)
      )
        .to.emit(grantsDAO, "ParametersUpdated")
        .withArgs(newThreshold, newPeriod, newQuorum);

      expect(await grantsDAO.proposalThreshold()).to.equal(newThreshold);
      expect(await grantsDAO.votingPeriod()).to.equal(newPeriod);
      expect(await grantsDAO.quorumPercentage()).to.equal(newQuorum);
    });

    it("Should not allow non-owner to update parameters", async function () {
      await expect(
        grantsDAO
          .connect(voter1)
          .updateParameters(
            ethers.parseEther("200"),
            14 * 24 * 60 * 60,
            1500
          )
      ).to.be.revertedWithCustomError(grantsDAO, "OwnableUnauthorizedAccount");
    });

    it("Should accept ETH deposits via depositFunds", async function () {
      await expect(
        grantsDAO.connect(voter1).depositFunds({ value: ethers.parseEther("2") })
      )
        .to.emit(grantsDAO, "FundsDeposited")
        .withArgs(voter1.address, ethers.parseEther("2"));

      expect(await grantsDAO.getTreasuryBalance()).to.equal(
        ethers.parseEther("12")
      );
    });

    it("Should accept ETH via receive function", async function () {
      await expect(
        voter1.sendTransaction({
          to: await grantsDAO.getAddress(),
          value: ethers.parseEther("1"),
        })
      )
        .to.emit(grantsDAO, "FundsDeposited")
        .withArgs(voter1.address, ethers.parseEther("1"));
    });
  });

  describe("📊 View Functions", function () {
    beforeEach(async function () {
      await grantsDAO
        .connect(proposer)
        .createProposal(
          "View Test",
          "Testing views",
          "ipfs://viewtest",
          ethers.parseEther("1")
        );
    });

    it("Should return complete proposal details", async function () {
      const proposal = await grantsDAO.getProposal(1);

      expect(proposal.id).to.equal(1);
      expect(proposal.proposer).to.equal(proposer.address);
      expect(proposal.title).to.equal("View Test");
      expect(proposal.description).to.equal("Testing views");
      expect(proposal.requestedAmount).to.equal(ethers.parseEther("1"));
      expect(proposal.state).to.equal(1); // Active
    });

    it("Should revert for invalid proposal ID", async function () {
      await expect(grantsDAO.getProposal(999)).to.be.revertedWith(
        "Invalid proposal ID"
      );
    });
  });
});
