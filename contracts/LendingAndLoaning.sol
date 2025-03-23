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


    event Lend(
        address sender,
        uint256 amountInDollars,
        uint256 totalAmountAvailableForLendInDollars,
        bool userPresent,
        int256 userIndex,
        address[] lenders,
        uint256 currentUserEthLentAmount
    );

    //event ApproveLoan(address sender, uint256 index, uint256 amount, uint256 interest, uint256 dueDate);
   // event RejectLoan(address sender, uint256 index, uint256 amount, uint256 interest, uint256 dueDate);
    event PayLoan(address sender, uint256 index, uint256 amount, uint256 interest, uint256 dueDate);

    event LoanMade(uint256 index,address sender, uint256 amount, uint256 interest, uint256 dueDate);
    event Debug(string message, uint256 value);
    event DebugAddress(string message, address addr);

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

    //mapping(address => Loan[]) public requestedLoans;
    mapping(address => Loan[]) public activeLoans;
    mapping(address => Loan[]) public paidLoans;

    constructor() {}


    function calculateInterest(uint256 _amount, uint256 _interest) public pure returns (uint256) {
        return (_amount * _interest) / 100;
    }

    function getLenders() public view returns (address[] memory) {
        return lenders;
    }

    function getNoEthLent() public view returns (uint256) {
        return noOfEthLent;
    }

    function getBorrowers() public view returns (address[] memory) {
        return borrowers;
    }

    function getMoney() public view returns (uint256) {
        return address(this).balance;
    }

    // function getRequestedLoans(address _borrower) public view returns (Loan[] memory) {
    //     return requestedLoans[_borrower];
    // }

    function getActiveLoans(address _borrower) public view returns (Loan[] memory) {
        return activeLoans[_borrower];
    }

    function getPaidLoans(address _borrower) public view returns (Loan[] memory) {
        return paidLoans[_borrower];
    }

    function getEthLentAmount(address _lender) public view returns (uint256) {
        return ethLentAmount[_lender];
    }

    function withdraw() public payable {
        require(address(this).balance >= ethLentAmount[msg.sender], "Insufficient lent amount");

        uint256 value = ethLentAmount[msg.sender];
        emit Debug("Withdraw function called", value);
        emit DebugAddress("Withdraw address", msg.sender);

        if (block.timestamp >= lendTimestamps[msg.sender] + 30 days) {
            uint256 ReciveValue = value + totalEthWon / lenders.length;
            ethLentAmount[msg.sender] = 0;
            totalEthWon -= totalEthWon / lenders.length;
            emit Debug("Withdraw amount with interest", ReciveValue);
            payable(msg.sender).transfer(ReciveValue);
        } else {
            ethLentAmount[msg.sender] = 0;
            emit Debug("Withdraw amount without interest", value);
            payable(msg.sender).transfer(value);
        }

        emit Withdraw();
    }

    function lend(address _borrower, uint256 _amount) public payable {
        require(msg.value == _amount, "Sent ETH amount does not match the lend amount");
        require(_amount < address(msg.sender).balance, "Nu sunt destui bani in cont");

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

    function createLoan(uint256 _amount,  uint _dueDate) public payable  {
        require(_amount > 0, "Invalid loan amount");
        require(_amount <= noOfEthLent, "Invalid due date");
        (bool userPresent, int256 userIndex) = helper.isUserIn(msg.sender, borrowers);
        userIndex = userIndex;
         activeLoans[msg.sender].push(Loan(_amount, 10, _dueDate, msg.sender, false, false));
        if (!userPresent) {
            borrowers.push(msg.sender);
        }
        
        ethBorrowedAmount[msg.sender] += _amount;
        noOfEthBorrowed += _amount;
        noOfEthLent -= _amount;
        
        payable(msg.sender).transfer(_amount);
    }

    function payLoan(address _borrower, uint256 _index) public payable {
        require(_index < activeLoans[_borrower].length, "Invalid index");
        require(activeLoans[_borrower][_index].isRepaid == false, "Loan already repaid");

       
        activeLoans[_borrower][_index].isRepaid = true;
        paidLoans[_borrower].push(activeLoans[_borrower][_index]);

        noOfEthLent += activeLoans[_borrower][_index].amount;
        totalEthWon +=  activeLoans[_borrower][_index].interest / 100;
    
    }

}