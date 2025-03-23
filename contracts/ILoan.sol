// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ILoan {
    struct Loan {
        uint amount;
        uint interest; 
        uint dueDate;
        address borrower;
        bool isRepaid; 
    }
    function createLoan( uint _amount, uint _dueDate) external payable;
    function getActiveLoans(address _borrower) external view returns (Loan[] memory);
    function repayLoan(address _borrower, uint _index) external payable;
}
