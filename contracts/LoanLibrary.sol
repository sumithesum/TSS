// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

library LoanLibrary {
    
    function calculateInterest(uint256 amount, uint256 rate) public pure returns (uint256) {
        return (amount * rate) / 100;
    }
}
