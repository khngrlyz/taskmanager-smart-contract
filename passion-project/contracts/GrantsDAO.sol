// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./GovernanceToken.sol";
import "./ProposalNFT.sol";

/**
 * @title GrantsDAO
 * @author Creative Grants DAO Team
 * @notice A decentralized autonomous organization for funding creative projects in the web3 space
 * @dev Implements a governance system where token holders can create, vote on, and fund grant proposals
 *
 * Key Features:
 * - Democratic proposal creation and voting
 * - NFT minting for successful proposals as proof of achievement
 * - Transparent treasury management
 * - Configurable voting periods and quorum requirements
 * - Milestone-based fund distribution
 */
contract GrantsDAO is Ownable, ReentrancyGuard {
    /// @notice The governance token used for voting
    GovernanceToken public governanceToken;

    /// @notice The NFT contract for minting proposal achievement NFTs
    ProposalNFT public proposalNFT;

    /// @notice Minimum tokens required to create a proposal
    uint256 public proposalThreshold;

    /// @notice Duration of voting period in seconds (default 7 days)
    uint256 public votingPeriod;

    /// @notice Minimum percentage of total supply that must vote (in basis points, 1000 = 10%)
    uint256 public quorumPercentage;

    /// @notice Counter for proposal IDs
    uint256 public proposalCount;

    /// @notice Enum representing the state of a proposal
    enum ProposalState {
        Pending,      // Proposal created, voting not started
        Active,       // Voting is active
        Defeated,     // Proposal failed to reach quorum or majority
        Succeeded,    // Proposal passed
        Executed,     // Funds distributed
        Cancelled     // Proposal cancelled by creator
    }

    /// @notice Struct representing a grant proposal
    struct Proposal {
        uint256 id;
        address proposer;
        string title;
        string description;
        string metadataURI;      // IPFS URI for detailed proposal
        uint256 requestedAmount;
        uint256 votingStartTime;
        uint256 votingEndTime;
        uint256 forVotes;
        uint256 againstVotes;
        ProposalState state;
        bool fundsReleased;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) voteWeight;
    }

    /// @notice Mapping from proposal ID to Proposal struct
    mapping(uint256 => Proposal) public proposals;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string title,
        uint256 requestedAmount,
        uint256 votingStartTime,
        uint256 votingEndTime
    );

    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        bool support,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId, uint256 amount);
    event ProposalCancelled(uint256 indexed proposalId);
    event FundsDeposited(address indexed depositor, uint256 amount);
    event ParametersUpdated(uint256 proposalThreshold, uint256 votingPeriod, uint256 quorumPercentage);

    /**
     * @notice Contract constructor
     * @param _governanceToken Address of the governance token contract
     * @param _proposalNFT Address of the proposal NFT contract
     * @param _proposalThreshold Minimum tokens needed to create a proposal
     * @param _votingPeriod Duration of voting period in seconds
     * @param _quorumPercentage Minimum percentage of votes needed (in basis points)
     */
    constructor(
        address _governanceToken,
        address _proposalNFT,
        uint256 _proposalThreshold,
        uint256 _votingPeriod,
        uint256 _quorumPercentage
    ) Ownable(msg.sender) {
        require(_governanceToken != address(0), "Invalid governance token address");
        require(_proposalNFT != address(0), "Invalid NFT address");
        require(_quorumPercentage <= 10000, "Quorum cannot exceed 100%");

        governanceToken = GovernanceToken(_governanceToken);
        proposalNFT = ProposalNFT(_proposalNFT);
        proposalThreshold = _proposalThreshold;
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
    }

    /**
     * @notice Create a new grant proposal
     * @param _title Title of the proposal
     * @param _description Brief description of the proposal
     * @param _metadataURI IPFS URI containing detailed proposal information
     * @param _requestedAmount Amount of ETH requested for the grant
     * @return proposalId The ID of the newly created proposal
     */
    function createProposal(
        string memory _title,
        string memory _description,
        string memory _metadataURI,
        uint256 _requestedAmount
    ) external returns (uint256) {
        require(
            governanceToken.balanceOf(msg.sender) >= proposalThreshold,
            "Insufficient tokens to create proposal"
        );
        require(_requestedAmount > 0, "Requested amount must be greater than 0");
        require(_requestedAmount <= address(this).balance, "Insufficient treasury funds");
        require(bytes(_title).length > 0, "Title cannot be empty");

        proposalCount++;
        uint256 proposalId = proposalCount;

        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.title = _title;
        newProposal.description = _description;
        newProposal.metadataURI = _metadataURI;
        newProposal.requestedAmount = _requestedAmount;
        newProposal.votingStartTime = block.timestamp;
        newProposal.votingEndTime = block.timestamp + votingPeriod;
        newProposal.state = ProposalState.Active;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            _title,
            _requestedAmount,
            newProposal.votingStartTime,
            newProposal.votingEndTime
        );

        return proposalId;
    }

    /**
     * @notice Cast a vote on an active proposal
     * @param _proposalId The ID of the proposal to vote on
     * @param _support True for voting in favor, false for voting against
     */
    function castVote(uint256 _proposalId, bool _support) external {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.state == ProposalState.Active, "Proposal is not active");
        require(block.timestamp <= proposal.votingEndTime, "Voting period has ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 weight = governanceToken.balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        proposal.hasVoted[msg.sender] = true;
        proposal.voteWeight[msg.sender] = weight;

        if (_support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        emit VoteCast(msg.sender, _proposalId, _support, weight);
    }

    /**
     * @notice Finalize a proposal after voting period ends
     * @param _proposalId The ID of the proposal to finalize
     * @dev Updates proposal state based on voting results and quorum
     */
    function finalizeProposal(uint256 _proposalId) external {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.state == ProposalState.Active, "Proposal is not active");
        require(block.timestamp > proposal.votingEndTime, "Voting period not ended");

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes;
        uint256 totalSupply = governanceToken.totalSupply();
        uint256 quorumVotes = (totalSupply * quorumPercentage) / 10000;

        // Check if quorum is met and proposal has majority support
        if (totalVotes >= quorumVotes && proposal.forVotes > proposal.againstVotes) {
            proposal.state = ProposalState.Succeeded;
        } else {
            proposal.state = ProposalState.Defeated;
        }
    }

    /**
     * @notice Execute a successful proposal and distribute funds
     * @param _proposalId The ID of the proposal to execute
     * @dev Transfers funds to proposer and mints achievement NFT
     */
    function executeProposal(uint256 _proposalId) external nonReentrant {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[_proposalId];

        require(proposal.state == ProposalState.Succeeded, "Proposal not succeeded");
        require(!proposal.fundsReleased, "Funds already released");
        require(address(this).balance >= proposal.requestedAmount, "Insufficient contract balance");

        proposal.fundsReleased = true;
        proposal.state = ProposalState.Executed;

        // Mint NFT to proposer as proof of funded project
        proposalNFT.mintProposalNFT(
            proposal.proposer,
            proposal.title,
            proposal.metadataURI
        );

        // Transfer funds to proposer
        (bool success, ) = payable(proposal.proposer).call{value: proposal.requestedAmount}("");
        require(success, "Transfer failed");

        emit ProposalExecuted(_proposalId, proposal.requestedAmount);
    }

    /**
     * @notice Cancel a proposal (only by proposer before execution)
     * @param _proposalId The ID of the proposal to cancel
     */
    function cancelProposal(uint256 _proposalId) external {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[_proposalId];

        require(msg.sender == proposal.proposer, "Only proposer can cancel");
        require(
            proposal.state == ProposalState.Active || proposal.state == ProposalState.Pending,
            "Cannot cancel proposal in current state"
        );

        proposal.state = ProposalState.Cancelled;
        emit ProposalCancelled(_proposalId);
    }

    /**
     * @notice Get proposal details
     * @param _proposalId The ID of the proposal
     * @return id Proposal ID
     * @return proposer Address of proposer
     * @return title Proposal title
     * @return description Proposal description
     * @return metadataURI IPFS metadata URI
     * @return requestedAmount Requested funding amount
     * @return votingStartTime Start time of voting period
     * @return votingEndTime End time of voting period
     * @return forVotes Number of votes in favor
     * @return againstVotes Number of votes against
     * @return state Current proposal state
     * @return fundsReleased Whether funds have been released
     */
    function getProposal(uint256 _proposalId)
        external
        view
        returns (
            uint256 id,
            address proposer,
            string memory title,
            string memory description,
            string memory metadataURI,
            uint256 requestedAmount,
            uint256 votingStartTime,
            uint256 votingEndTime,
            uint256 forVotes,
            uint256 againstVotes,
            ProposalState state,
            bool fundsReleased
        )
    {
        require(_proposalId > 0 && _proposalId <= proposalCount, "Invalid proposal ID");
        Proposal storage proposal = proposals[_proposalId];

        return (
            proposal.id,
            proposal.proposer,
            proposal.title,
            proposal.description,
            proposal.metadataURI,
            proposal.requestedAmount,
            proposal.votingStartTime,
            proposal.votingEndTime,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.state,
            proposal.fundsReleased
        );
    }

    /**
     * @notice Check if an address has voted on a proposal
     * @param _proposalId The proposal ID
     * @param _voter The voter address
     * @return bool True if the address has voted
     */
    function hasVoted(uint256 _proposalId, address _voter) external view returns (bool) {
        return proposals[_proposalId].hasVoted[_voter];
    }

    /**
     * @notice Update DAO parameters (only owner)
     * @param _proposalThreshold New proposal threshold
     * @param _votingPeriod New voting period
     * @param _quorumPercentage New quorum percentage
     */
    function updateParameters(
        uint256 _proposalThreshold,
        uint256 _votingPeriod,
        uint256 _quorumPercentage
    ) external onlyOwner {
        require(_quorumPercentage <= 10000, "Quorum cannot exceed 100%");

        proposalThreshold = _proposalThreshold;
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;

        emit ParametersUpdated(_proposalThreshold, _votingPeriod, _quorumPercentage);
    }

    /**
     * @notice Deposit funds into the DAO treasury
     * @dev Anyone can contribute to the treasury
     */
    function depositFunds() external payable {
        require(msg.value > 0, "Must send ETH");
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Get the current treasury balance
     * @return uint256 The balance of the contract in wei
     */
    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Receive function to accept ETH deposits
     */
    receive() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Fallback function
     */
    fallback() external payable {
        emit FundsDeposited(msg.sender, msg.value);
    }
}
