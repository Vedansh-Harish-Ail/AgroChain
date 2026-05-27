// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./FarmerRegistry.sol";

contract ProductRegistry is AccessControl {
    bytes32 public constant TESTER_ROLE = keccak256("TESTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Product {
        uint256 lotNumber;
        uint256 farmerId;
        string cropName;
        string qualityGrade;
        uint256 price; // Price per unit or total price in Wei
        uint256 testDate;
        uint256 expiryDate;
        string certificationStatus;
        address testerAddress;
        bool exists;
    }

    mapping(uint256 => Product) public products;
    uint256[] public lotNumbers;
    
    FarmerRegistry public farmerRegistry;

    event ProductRegistered(
        uint256 indexed lotNumber,
        uint256 indexed farmerId,
        string cropName,
        string qualityGrade,
        uint256 price,
        address indexed tester
    );

    constructor(address _farmerRegistryAddress) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        farmerRegistry = FarmerRegistry(_farmerRegistryAddress);
    }

    function registerProduct(
        uint256 _lotNumber,
        uint256 _farmerId,
        string memory _cropName,
        string memory _qualityGrade,
        uint256 _price,
        uint256 _testDate,
        uint256 _expiryDate,
        string memory _certificationStatus
    ) public {
        require(hasRole(TESTER_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender), "Caller is not an authorized tester or admin");
        require(!products[_lotNumber].exists, "Lot number already registered");
        require(farmerRegistry.isFarmerApproved(_farmerId), "Farmer is not approved by Quality Authority");

        products[_lotNumber] = Product({
            lotNumber: _lotNumber,
            farmerId: _farmerId,
            cropName: _cropName,
            qualityGrade: _qualityGrade,
            price: _price,
            testDate: _testDate,
            expiryDate: _expiryDate,
            certificationStatus: _certificationStatus,
            testerAddress: msg.sender,
            exists: true
        });

        lotNumbers.push(_lotNumber);

        emit ProductRegistered(
            _lotNumber,
            _farmerId,
            _cropName,
            _qualityGrade,
            _price,
            msg.sender
        );
    }

    function getProduct(uint256 _lotNumber) public view returns (Product memory) {
        require(products[_lotNumber].exists, "Product lot does not exist");
        return products[_lotNumber];
    }

    function isProductExists(uint256 _lotNumber) public view returns (bool) {
        return products[_lotNumber].exists;
    }

    function getProductCount() public view returns (uint256) {
        return lotNumbers.length;
    }
}
