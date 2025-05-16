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

     function withdraw() public {
    uint256 value = ethLentAmount[msg.sender];
    require(value > 0, "Nothing to withdraw");


    emit Debug("Withdraw function called", value);
    emit DebugAddress("Withdraw address", msg.sender);

    uint256 toTransfer = value;
    
    

    
    ethLentAmount[msg.sender] = 0;
    noOfEthLent -= value;
    lendTimestamps[msg.sender] = 0;

    payable(msg.sender).transfer(toTransfer);
    emit Withdraw();
}

    function lend(address _borrower, uint256 _amount) public payable {
    require(msg.value == _amount, "Sent ETH amount does not match the lend amount");
    require(_amount <= address(msg.sender).balance, "Not enough balance to lend");

    (bool userPresent, int256 userIndex) = helper.isUserIn(_borrower, borrowers);
    if (userPresent) {
        ethLentAmount[msg.sender] += _amount;
        noOfEthLent += _amount;
        emit Lend(
            msg.sender,
            _amount,
            noOfEthLent,
            userPresent,
            userIndex,
            lenders,
            ethLentAmount[msg.sender] // corectat pentru lender
        );
    } else {
        borrowers.push(_borrower);
        lenders.push(msg.sender); // adăugați lender în lista
        ethLentAmount[msg.sender] += _amount;
        noOfEthLent += _amount;
        emit Lend(
            msg.sender,
            _amount,
            noOfEthLent,
            userPresent,
            userIndex,
            lenders,
            ethLentAmount[msg.sender] // corectat pentru lender
        );
    }
}

    function createLoan(uint256 _amount,  uint _dueDate) public payable  {
        require(_amount > 0, "Invalid loan amount");
        require(noOfEthLent >= _amount, "Not enough ETH available for lending");

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

    uint256 amountToPay = activeLoans[_borrower][_index].amount + calculateInterest(activeLoans[_borrower][_index].amount, activeLoans[_borrower][_index].interest);

    
    activeLoans[_borrower][_index].isRepaid = true;
    paidLoans[_borrower].push(activeLoans[_borrower][_index]);

    noOfEthLent += activeLoans[_borrower][_index].amount;
    totalEthWon += calculateInterest(activeLoans[_borrower][_index].amount, activeLoans[_borrower][_index].interest);
}
}