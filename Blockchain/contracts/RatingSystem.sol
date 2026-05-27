// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./FarmerRegistry.sol";

contract RatingSystem {
    struct Rating {
        uint256 ratingId;
        address consumer;
        uint256 farmerId;
        uint256 lotNumber;
        uint8 reliability; // 1 to 5
        uint8 productQuality; // 1 to 5
        uint8 deliverySatisfaction; // 1 to 5
        string comment;
        uint256 timestamp;
    }

    Rating[] public ratings;
    mapping(uint256 => uint256[]) public farmerRatings;
    
    FarmerRegistry public farmerRegistry;

    event RatingAdded(
        uint256 indexed ratingId,
        address indexed consumer,
        uint256 indexed farmerId,
        uint256 lotNumber,
        uint8 reliability,
        uint8 productQuality,
        uint8 deliverySatisfaction,
        uint256 timestamp
    );

    constructor(address _farmerRegistryAddress) {
        farmerRegistry = FarmerRegistry(_farmerRegistryAddress);
    }

    function addRating(
        uint256 _farmerId,
        uint256 _lotNumber,
        uint8 _reliability,
        uint8 _productQuality,
        uint8 _deliverySatisfaction,
        string memory _comment
    ) public {
        require(farmerRegistry.isFarmerApproved(_farmerId), "Farmer must be approved by authority");
        require(
            _reliability >= 1 && _reliability <= 5 &&
            _productQuality >= 1 && _productQuality <= 5 &&
            _deliverySatisfaction >= 1 && _deliverySatisfaction <= 5,
            "Ratings must be between 1 and 5"
        );

        uint256 newRatingId = ratings.length;
        
        ratings.push(Rating({
            ratingId: newRatingId,
            consumer: msg.sender,
            farmerId: _farmerId,
            lotNumber: _lotNumber,
            reliability: _reliability,
            productQuality: _productQuality,
            deliverySatisfaction: _deliverySatisfaction,
            comment: _comment,
            timestamp: block.timestamp
        }));

        farmerRatings[_farmerId].push(newRatingId);

        emit RatingAdded(
            newRatingId,
            msg.sender,
            _farmerId,
            _lotNumber,
            _reliability,
            _productQuality,
            _deliverySatisfaction,
            block.timestamp
        );
    }

    function getFarmerRatingCount(uint256 _farmerId) public view returns (uint256) {
        return farmerRatings[_farmerId].length;
    }

    function getFarmerAverageRating(uint256 _farmerId) public view returns (uint256) {
        uint256 count = farmerRatings[_farmerId].length;
        if (count == 0) return 0;
        
        uint256 total = 0;
        for (uint256 i = 0; i < count; i++) {
            uint256 rId = farmerRatings[_farmerId][i];
            total += (ratings[rId].reliability + ratings[rId].productQuality + ratings[rId].deliverySatisfaction) / 3;
        }
        
        // Return average scaled by 10 (e.g. 45 represents 4.5) to keep precision
        return (total * 10) / count;
    }
}
