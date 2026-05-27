// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FarmerRegistry.sol";
import "./ProductRegistry.sol";

contract MicroFinance is Ownable {
    struct Investment {
        uint256 investmentId;
        address investor;
        uint256 farmerId;
        uint256 lotNumber;
        uint256 amount; // Amount funded in Wei
        uint256 timestamp;
        uint256 profitPercentage; // Profit margin set for investor
        string status; // "ACTIVE", "COMPLETED", "REFUNDED"
    }

    Investment[] public investments;
    mapping(uint256 => uint256[]) public farmerInvestments;
    mapping(address => uint256[]) public investorInvestments;

    FarmerRegistry public farmerRegistry;
    ProductRegistry public productRegistry;

    event InvestmentMade(
        uint256 indexed investmentId,
        address indexed investor,
        uint256 indexed farmerId,
        uint256 lotNumber,
        uint256 amount,
        uint256 timestamp
    );

    event InvestmentStatusUpdated(
        uint256 indexed investmentId,
        string status
    );

    constructor(address _farmerRegistryAddress, address _productRegistryAddress) {
        farmerRegistry = FarmerRegistry(_farmerRegistryAddress);
        productRegistry = ProductRegistry(_productRegistryAddress);
    }

    function invest(
        uint256 _farmerId,
        uint256 _lotNumber,
        uint256 _profitPercentage
    ) public payable {
        require(msg.value > 0, "Investment amount must be greater than zero");
        
        // Verify Farmer is approved
        require(farmerRegistry.isFarmerApproved(_farmerId), "Farmer must be approved by authority");
        
        // Verify Farmer wallet address
        address farmerWallet = farmerRegistry.getFarmer(_farmerId).walletAddress;
        require(farmerWallet != address(0), "Farmer wallet address not found");
        require(farmerWallet != msg.sender, "Farmers cannot invest in their own crops");

        // Verify product lot exists
        require(productRegistry.isProductExists(_lotNumber), "Product lot does not exist");

        uint256 newInvestmentId = investments.length;
        
        investments.push(Investment({
            investmentId: newInvestmentId,
            investor: msg.sender,
            farmerId: _farmerId,
            lotNumber: _lotNumber,
            amount: msg.value,
            timestamp: block.timestamp,
            profitPercentage: _profitPercentage,
            status: "ACTIVE"
        }));

        farmerInvestments[_farmerId].push(newInvestmentId);
        investorInvestments[msg.sender].push(newInvestmentId);

        // Forward the ETH directly to the farmer
        (bool success, ) = payable(farmerWallet).call{value: msg.value}("");
        require(success, "Failed to transfer funds to farmer");

        emit InvestmentMade(
            newInvestmentId,
            msg.sender,
            _farmerId,
            _lotNumber,
            msg.value,
            block.timestamp
        );
    }

    function updateInvestmentStatus(uint256 _investmentId, string memory _status) public {
        require(_investmentId < investments.length, "Invalid investment ID");
        
        // Only the farmer of this crop, or the contract owner can update status
        uint256 farmerId = investments[_investmentId].farmerId;
        address farmerWallet = farmerRegistry.getFarmer(farmerId).walletAddress;
        
        require(msg.sender == farmerWallet || msg.sender == owner(), "Only the farmer or owner can update status");
        
        investments[_investmentId].status = _status;
        
        emit InvestmentStatusUpdated(_investmentId, _status);
    }

    // Custom getter to return a full Investment struct to bypass tuple restrictions
    function getInvestment(uint256 _investmentId) public view returns (Investment memory) {
        require(_investmentId < investments.length, "Invalid investment ID");
        return investments[_investmentId];
    }

    function getInvestmentCount() public view returns (uint256) {
        return investments.length;
    }

    function getFarmerInvestments(uint256 _farmerId) public view returns (uint256[] memory) {
        return farmerInvestments[_farmerId];
    }

    // Helper to check if an address has investments
    function getInvestorInvestments(address _investor) public view returns (uint256[] memory) {
        return investorInvestments[_investor];
    }
}
