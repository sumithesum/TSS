// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./helper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LendingAndLoaning is Ownable {
    address[] public borrowers;
    address[] public lenders;

    mapping(address => uint256) public ethLentAmount;
    mapping(address => uint256) public ethBorrowedAmount;
    mapping(address => uint256) public lendTimestamps;

    event Withdraw();
    event PayLoan(address _from, address _to, uint256 _index);

    event Borrow(
        address sender,
        uint256 amountInDollars,
        uint256 totalAmountAvailableForBorrowInDollars,
        bool userPresent,
        int256 userIndex,
        address[] borrowers,
        uint256 currentUserEthBorrowedAmount
    );

    event Lend(
        address sender,
        uint256 amountInDollars,
        uint256 totalAmountAvailableForLendInDollars,
        bool userPresent,
        int256 userIndex,
        address[] lenders,
        uint256 currentUserEthLentAmount
    );
    event RequestLoan(
        address sender,
        uint256 amountInDollars,
        uint256 interest,
        uint256 dueDate,
        uint256 totalAmountAvailableForBorrowInDollars,
        bool userPresent,
        int256 userIndex,
        address[] borrowers,
        uint256 currentUserEthBorrowedAmount
    );
    event ApproveLoan(address sender, uint256 index, uint256 amount, uint256 interest, uint256 dueDate);
    event RejectLoan(address sender, uint256 index, uint256 amount, uint256 interest, uint256 dueDate);
    event PayLoan(address sender, uint256 index, uint256 amount, uint256 interest, uint256 dueDate);

    uint256 public noOfEthLent = 0;
    uint256 public noOfEthBorrowed = 0;
    uint256 public totalEthWon = 0;

    struct Loan {
        uint256 amount;
        uint256 interest;
        uint256 dueDate;
        address borrower;
        bool isRepaid;
        bool approved;
    }

    mapping(address => Loan[]) public requestedLoans;
    mapping(address => Loan[]) public activeLoans;
    mapping(address => Loan[]) public paidLoans;

    constructor() {}

    function calculateInterest(uint256 _amount, uint256 _interest) public pure returns (uint256) {
        return (_amount * _interest) / 100;
    }

    function getLenders() public view returns (address[] memory) {
        return lenders;
    }

    function getBorrowers() public view returns (address[] memory) {
        return borrowers;
    }

    function getRequestedLoans(address _borrower) public view returns (Loan[] memory) {
        return requestedLoans[_borrower];
    }

    function getActiveLoans(address _borrower) public view returns (Loan[] memory) {
        return activeLoans[_borrower];
    }

    function getPaidLoans(address _borrower) public view returns (Loan[] memory) {
        return paidLoans[_borrower];
    }

    function withdraw() public {
        require(0 <= ethLentAmount[msg.sender], "Insufficient lent amount");
        if(block.timestamp >= lendTimestamps[msg.sender] + 30 days)
        {
            uint256 value = ethLentAmount[msg.sender] ;
            ethLentAmount[msg.sender] = 0;
            uint256 ReciveValue = value + totalEthWon / (lenders.length);
            totalEthWon -= totalEthWon / (lenders.length);
            payable(msg.sender).transfer(ReciveValue);
        }
        else
        {
            uint256 value = ethLentAmount[msg.sender] ;
            ethLentAmount[msg.sender] = 0;
            payable(msg.sender).transfer(value);
        }

        emit Withdraw();
    }

    function lend(address _borrower, uint256 _amount) public payable {
require(msg.value == _amount, "Sent ETH amount does not match the lend amount");

        (bool userPresent, int256 userIndex) = helper.isUserIn(_borrower, borrowers);
        if (userPresent) {
            ethLentAmount[_borrower] += _amount;
            noOfEthLent += _amount;
            emit Lend(
                msg.sender,
                _amount,
                noOfEthLent,
                userPresent,
                userIndex,
                lenders,
                ethLentAmount[_borrower]
            );
        } else {
            lenders.push(_borrower);
            ethLentAmount[_borrower] += _amount;
            noOfEthLent += _amount;
            emit Lend(
                msg.sender,
                _amount,
                noOfEthLent,
                userPresent,
                userIndex,
                lenders,
                ethLentAmount[_borrower]
            );
        }
    }

    function requestLoan(uint256 _amount, uint256 _interest, uint256 _dueDate) public {
        require(_amount > 0, "Amount should be greater than 0");
        require(_interest > 0, "Interest should be greater than 0");
        require(_dueDate > block.timestamp, "Due date should be greater than current date");
        require(_amount <= noOfEthLent, "Amount should be less than total amount to lent");

        (bool userPresent, int256 userIndex) = helper.isUserIn(msg.sender, borrowers);
        if (userPresent) {
            ethBorrowedAmount[msg.sender] += _amount;
            noOfEthBorrowed += _amount;
            emit RequestLoan(
                msg.sender,
                _amount,
                _interest,
                _dueDate,
                noOfEthBorrowed,
                userPresent,
                userIndex,
                borrowers,
                ethBorrowedAmount[msg.sender]
            );
        } else {
            borrowers.push(msg.sender);
            ethBorrowedAmount[msg.sender] += _amount;
            noOfEthBorrowed += _amount;
            emit RequestLoan(
                msg.sender,
                _amount,
                _interest,
                _dueDate,
                noOfEthBorrowed,
                userPresent,
                userIndex,
                borrowers,
                ethBorrowedAmount[msg.sender]
            );
        }
    }

    function approveLoan(address _borrower, uint256 _index) public payable {
        require(_index < requestedLoans[_borrower].length, "Invalid index");
        require(requestedLoans[_borrower][_index].approved == false, "Loan already approved");

        requestedLoans[_borrower][_index].approved = true;
        activeLoans[_borrower].push(requestedLoans[_borrower][_index]);

        // Transfer ETH from contract to borrower
        uint256 loanAmount = requestedLoans[_borrower][_index].amount;
        require(address(this).balance >= loanAmount, "Insufficient contract balance");
        payable(_borrower).transfer(loanAmount);

        emit ApproveLoan(
            msg.sender,
            _index,
            requestedLoans[_borrower][_index].amount,
            requestedLoans[_borrower][_index].interest,
            requestedLoans[_borrower][_index].dueDate
        );
    }

    function rejectLoan(address _borrower, uint256 _index) public {
        require(_index < requestedLoans[_borrower].length, "Invalid index");
        require(requestedLoans[_borrower][_index].approved == false, "Loan already approved");

        requestedLoans[_borrower][_index].approved = false;
        emit RejectLoan(
            msg.sender,
            _index,
            requestedLoans[_borrower][_index].amount,
            requestedLoans[_borrower][_index].interest,
            requestedLoans[_borrower][_index].dueDate
        );
    }

    function payLoan(address _borrower, uint256 _index) public payable {
        require(_index < activeLoans[_borrower].length, "Invalid index");
        require(activeLoans[_borrower][_index].isRepaid == false, "Loan already repaid");

        uint256 repaymentAmount = activeLoans[_borrower][_index].amount + calculateInterest(activeLoans[_borrower][_index].amount, activeLoans[_borrower][_index].interest);
        require(msg.value >= repaymentAmount, "Insufficient repayment amount");

        activeLoans[_borrower][_index].isRepaid = true;
        paidLoans[_borrower].push(activeLoans[_borrower][_index]);

        // Transfer ETH from borrower to contract
        ethLentAmount[msg.sender] += repaymentAmount;

        noOfEthLent += activeLoans[_borrower][_index].amount;
        totalEthWon += calculateInterest(activeLoans[_borrower][_index].amount, activeLoans[_borrower][_index].interest);
        emit PayLoan(
            msg.sender,
            _index,
            activeLoans[_borrower][_index].amount,
            activeLoans[_borrower][_index].interest,
            activeLoans[_borrower][_index].dueDate
        );
    }
}