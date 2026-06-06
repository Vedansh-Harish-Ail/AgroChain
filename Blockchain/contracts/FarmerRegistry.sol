// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract FarmerRegistry is AccessControl {
    bytes32 public constant TESTER_ROLE = keccak256("TESTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    struct Farmer {
        uint256 farmerId;
        string farmerName;
        string farmLocation;
        string farmSize;
        string farmingType; // organic / non-organic
        string cropType;
        uint256 expectedYield;
        uint256 cultivationDate;
        address walletAddress;
        bool isRegistered;
        bool isApproved;
    }

    mapping(uint256 => Farmer) public farmers;
    uint256[] public farmerIds;

    event FarmerRegistered(
        uint256 indexed farmerId,
        string farmerName,
        address indexed walletAddress,
        string cropType
    );

    event FarmerApproved(uint256 indexed farmerId, address indexed verifier);
    event FarmerRejected(uint256 indexed farmerId, address indexed verifier);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    function registerFarmer(
        uint256 _farmerId,
        string memory _name,
        string memory _location,
        string memory _size,
        string memory _farmingType,
        string memory _cropType,
        uint256 _expectedYield,
        uint256 _cultivationDate
    ) public {
        require(!farmers[_farmerId].isRegistered, "Farmer ID already registered");

        farmers[_farmerId] = Farmer({
            farmerId: _farmerId,
            farmerName: _name,
            farmLocation: _location,
            farmSize: _size,
            farmingType: _farmingType,
            cropType: _cropType,
            expectedYield: _expectedYield,
            cultivationDate: _cultivationDate,
            walletAddress: msg.sender,
            isRegistered: true,
            isApproved: false
        });

        farmerIds.push(_farmerId);

        emit FarmerRegistered(_farmerId, _name, msg.sender, _cropType);
    }

    function approveFarmer(uint256 _farmerId) public {
        require(hasRole(TESTER_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender), "Caller is not an authorized tester or admin");
        require(farmers[_farmerId].isRegistered, "Farmer not registered");
        require(!farmers[_farmerId].isApproved, "Farmer already approved");

        farmers[_farmerId].isApproved = true;

        emit FarmerApproved(_farmerId, msg.sender);
    }

    function approveFarmer(
        uint256 _farmerId,
        string memory _name,
        string memory _location,
        string memory _size,
        string memory _farmingType,
        string memory _cropType,
        uint256 _expectedYield,
        uint256 _cultivationDate,
        address _farmerWallet
    ) public {
        require(hasRole(TESTER_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender), "Caller is not an authorized tester or admin");
        
        if (!farmers[_farmerId].isRegistered) {
            farmers[_farmerId] = Farmer({
                farmerId: _farmerId,
                farmerName: _name,
                farmLocation: _location,
                farmSize: _size,
                farmingType: _farmingType,
                cropType: _cropType,
                expectedYield: _expectedYield,
                cultivationDate: _cultivationDate,
                walletAddress: _farmerWallet,
                isRegistered: true,
                isApproved: true
            });
            farmerIds.push(_farmerId);
            emit FarmerRegistered(_farmerId, _name, _farmerWallet, _cropType);
        } else {
            require(!farmers[_farmerId].isApproved, "Farmer already approved");
            farmers[_farmerId].isApproved = true;
        }

        emit FarmerApproved(_farmerId, msg.sender);
    }

    function rejectFarmer(uint256 _farmerId) public {
        require(hasRole(TESTER_ROLE, msg.sender) || hasRole(ADMIN_ROLE, msg.sender), "Caller is not an authorized tester or admin");
        require(farmers[_farmerId].isRegistered, "Farmer not registered");
        
        farmers[_farmerId].isRegistered = false;
        farmers[_farmerId].isApproved = false;

        emit FarmerRejected(_farmerId, msg.sender);
    }

    function getFarmer(uint256 _farmerId) public view returns (Farmer memory) {
        require(farmers[_farmerId].isRegistered, "Farmer not registered");
        return farmers[_farmerId];
    }

    function getFarmerCount() public view returns (uint256) {
        return farmerIds.length;
    }

    function isFarmerApproved(uint256 _farmerId) public view returns (bool) {
        return farmers[_farmerId].isApproved;
    }
}
