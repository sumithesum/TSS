// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

contract LoanProxy {
    address public loanLogic; // Adresa contractului logic (DeFiLoan)
    address public owner;

    constructor(address _loanLogic) {
        loanLogic = _loanLogic;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    
    function upgrade(address _newLogic) public onlyOwner {
        loanLogic = _newLogic;
    }

    
    receive() external payable {}

   
    fallback() external payable {
        (bool success, ) = loanLogic.delegatecall(msg.data);
        require(success, "Delegatecall failed");
    }
}
