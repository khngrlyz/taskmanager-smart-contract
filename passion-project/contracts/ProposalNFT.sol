// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ProposalNFT
 * @author Creative Grants DAO Team
 * @notice NFT contract that mints achievement tokens for successfully funded proposals
 * @dev Each NFT represents a funded creative project and serves as an on-chain proof of achievement
 *
 * Key Features:
 * - Unique NFTs for each funded proposal
 * - Metadata stored on IPFS
 * - Non-transferable soul-bound tokens (optional)
 * - Historical record of funded projects
 */
contract ProposalNFT is ERC721, ERC721URIStorage, Ownable {
    /// @notice Counter for token IDs
    uint256 private _tokenIdCounter;

    /// @notice Address of the GrantsDAO contract
    address public grantsDAO;

    /// @notice Mapping from token ID to proposal details
    mapping(uint256 => ProposalInfo) public proposalInfo;

    /// @notice Struct containing proposal information for an NFT
    struct ProposalInfo {
        string title;
        address creator;
        uint256 mintedAt;
        string metadataURI;
    }

    /// @notice Emitted when a new proposal NFT is minted
    event ProposalNFTMinted(
        uint256 indexed tokenId,
        address indexed recipient,
        string title,
        string metadataURI
    );

    /// @notice Modifier to restrict function calls to the GrantsDAO contract only
    modifier onlyGrantsDAO() {
        require(msg.sender == grantsDAO, "Only GrantsDAO can call this function");
        _;
    }

    /**
     * @notice Contract constructor
     * @param _name Name of the NFT collection
     * @param _symbol Symbol of the NFT collection
     */
    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
        Ownable(msg.sender)
    {}

    /**
     * @notice Set the GrantsDAO contract address
     * @param _grantsDAO Address of the GrantsDAO contract
     * @dev Only owner can set this, typically called once after deployment
     */
    function setGrantsDAO(address _grantsDAO) external onlyOwner {
        require(_grantsDAO != address(0), "Invalid GrantsDAO address");
        require(grantsDAO == address(0), "GrantsDAO already set");
        grantsDAO = _grantsDAO;
    }

    /**
     * @notice Mint a new proposal NFT to a recipient
     * @param _recipient Address to receive the NFT
     * @param _title Title of the funded proposal
     * @param _metadataURI IPFS URI containing NFT metadata
     * @return tokenId The ID of the newly minted NFT
     * @dev Can only be called by the GrantsDAO contract
     */
    function mintProposalNFT(
        address _recipient,
        string memory _title,
        string memory _metadataURI
    ) external onlyGrantsDAO returns (uint256) {
        require(_recipient != address(0), "Cannot mint to zero address");
        require(bytes(_title).length > 0, "Title cannot be empty");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(_recipient, tokenId);
        _setTokenURI(tokenId, _metadataURI);

        proposalInfo[tokenId] = ProposalInfo({
            title: _title,
            creator: _recipient,
            mintedAt: block.timestamp,
            metadataURI: _metadataURI
        });

        emit ProposalNFTMinted(tokenId, _recipient, _title, _metadataURI);

        return tokenId;
    }

    /**
     * @notice Get the total number of NFTs minted
     * @return uint256 The total supply of NFTs
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Get detailed information about a proposal NFT
     * @param _tokenId The ID of the NFT
     * @return title Proposal title
     * @return creator Address of the proposal creator
     * @return mintedAt Timestamp when the NFT was minted
     * @return metadataURI IPFS metadata URI
     */
    function getProposalInfo(uint256 _tokenId)
        external
        view
        returns (
            string memory title,
            address creator,
            uint256 mintedAt,
            string memory metadataURI
        )
    {
        require(_ownerOf(_tokenId) != address(0), "Token does not exist");

        ProposalInfo memory info = proposalInfo[_tokenId];
        return (info.title, info.creator, info.mintedAt, info.metadataURI);
    }

    /**
     * @notice Get all token IDs owned by an address
     * @param _owner Address to query
     * @return tokenIds Array of token IDs owned by the address
     * @dev This is gas-intensive for addresses with many NFTs, use with caution
     */
    function tokensOfOwner(address _owner) external view returns (uint256[] memory) {
        uint256 totalTokens = _tokenIdCounter;
        uint256 ownedCount = 0;

        // First pass: count owned tokens
        for (uint256 i = 1; i <= totalTokens; i++) {
            if (_ownerOf(i) == _owner) {
                ownedCount++;
            }
        }

        // Second pass: collect token IDs
        uint256[] memory tokenIds = new uint256[](ownedCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= totalTokens; i++) {
            if (_ownerOf(i) == _owner) {
                tokenIds[index] = i;
                index++;
            }
        }

        return tokenIds;
    }

    // The following functions are overrides required by Solidity

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
