// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GovernanceToken
 * @author Creative Grants DAO Team
 * @notice ERC20 token used for governance and voting in the GrantsDAO
 * @dev Standard ERC20 with burnable capability and initial distribution
 *
 * Key Features:
 * - Standard ERC20 functionality
 * - Burnable tokens to reduce supply
 * - Initial distribution to founder and community
 * - Can be used for voting power in proposals
 */
contract GovernanceToken is ERC20, ERC20Burnable, Ownable {
    /// @notice Maximum total supply of tokens
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18; // 1 million tokens

    /// @notice Emitted when tokens are minted
    event TokensMinted(address indexed recipient, uint256 amount);

    /**
     * @notice Contract constructor
     * @param _name Name of the token
     * @param _symbol Symbol of the token
     * @param _initialSupply Initial supply to mint to deployer
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply
    ) ERC20(_name, _symbol) Ownable(msg.sender) {
        require(_initialSupply <= MAX_SUPPLY, "Initial supply exceeds max supply");

        if (_initialSupply > 0) {
            _mint(msg.sender, _initialSupply);
            emit TokensMinted(msg.sender, _initialSupply);
        }
    }

    /**
     * @notice Mint new tokens (only owner)
     * @param _to Address to receive the tokens
     * @param _amount Amount of tokens to mint
     * @dev Cannot exceed MAX_SUPPLY
     */
    function mint(address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Cannot mint to zero address");
        require(totalSupply() + _amount <= MAX_SUPPLY, "Minting would exceed max supply");

        _mint(_to, _amount);
        emit TokensMinted(_to, _amount);
    }

    /**
     * @notice Batch mint tokens to multiple addresses
     * @param _recipients Array of addresses to receive tokens
     * @param _amounts Array of amounts corresponding to each recipient
     * @dev Useful for initial token distribution
     */
    function batchMint(address[] calldata _recipients, uint256[] calldata _amounts)
        external
        onlyOwner
    {
        require(_recipients.length == _amounts.length, "Arrays length mismatch");
        require(_recipients.length > 0, "Empty arrays");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _amounts.length; i++) {
            totalAmount += _amounts[i];
        }

        require(totalSupply() + totalAmount <= MAX_SUPPLY, "Batch minting would exceed max supply");

        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i] != address(0), "Cannot mint to zero address");
            _mint(_recipients[i], _amounts[i]);
            emit TokensMinted(_recipients[i], _amounts[i]);
        }
    }

    /**
     * @notice Get the remaining mintable supply
     * @return uint256 The amount of tokens that can still be minted
     */
    function remainingSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }

    /**
     * @notice Check if an address has voting power
     * @param _account Address to check
     * @return bool True if the address has at least 1 token
     */
    function hasVotingPower(address _account) external view returns (bool) {
        return balanceOf(_account) > 0;
    }

    /**
     * @notice Get voting power for an address
     * @param _account Address to check
     * @return uint256 The balance of tokens (voting power)
     */
    function getVotingPower(address _account) external view returns (uint256) {
        return balanceOf(_account);
    }
}
