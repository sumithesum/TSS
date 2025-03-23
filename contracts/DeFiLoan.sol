// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "./ILoan.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeFiLoan is ILoan {
    address payable public owner;
    IERC20 public token;

    mapping(address => Loan[]) public activeLoans;
    mapping(address => Loan[]) public paidLoans;
    

    event LoanCreated(address indexed borrower, uint amount, uint interest, uint dueDate, bool isRepaid);
    event LoanRepaid(address indexed borrower, uint loanIndex);
    event OwnerAddress(address owner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    constructor(address _tokenAddress) {
        owner = payable(msg.sender); //adresa celui care a creat contractul
        token = IERC20(_tokenAddress);
        emit OwnerAddress(owner);
    }

    // Adaugă un nou împrumut
    function createLoan(uint _amount, uint _dueDate) public payable override {
        require(_amount > 0, "Amount must be greater than 0");
        require(_dueDate > block.timestamp, "Due date must be in the future");
        require(token.balanceOf(msg.sender) >= _amount, "Insufficient token balance");

        // Transfer token-uri de la împrumutat la contract
        token.transferFrom(msg.sender, address(this), _amount);

        // Adaugă împrumutul în mapping-ul activeLoans
        activeLoans[msg.sender].push(Loan({
            amount: _amount,
            interest: 10,
            dueDate: _dueDate,
            borrower: msg.sender,
            isRepaid: false
        }));

        // Transferă ETH către împrumutat
        require(address(this).balance >= msg.value, "Contract does not have enough ETH");
        (bool success, ) = payable(msg.sender).call{value: msg.value}("");
        require(success, "Transfer failed");

        emit LoanCreated(msg.sender, _amount, 10, _dueDate, false);
    }

    // Obține împrumuturile active ale unui utilizator
    function getActiveLoans(address _borrower) external view override returns (Loan[] memory) {
        return activeLoans[_borrower];
    }

    function getPaidLoans(address _borrower) external view returns (Loan[] memory) {
        return paidLoans[_borrower];
    }

    // Permite rambursarea unui împrumut
    function repayLoan(address _borrower, uint256 _index) public payable override {
        require(_index < activeLoans[_borrower].length, "Loan does not exist");

        Loan storage loan = activeLoans[_borrower][_index];
        uint256 interestAmount = calculateInterest(loan.amount, loan.interest);
        uint256 totalRepayment = loan.amount + interestAmount;

        require(token.balanceOf(msg.sender) >= totalRepayment, "Insufficient token balance");
        require(token.allowance(msg.sender, address(this)) >= totalRepayment, "Token allowance too low");

        token.transferFrom(msg.sender, owner, totalRepayment);

        loan.isRepaid = true;
        paidLoans[_borrower].push(loan);

        emit LoanRepaid(_borrower, _index);
    }

    function depositFunds() external payable onlyOwner {
        require(msg.value > 0, "Must send ETH to deposit.");
    }

    function getContractBalance() public view returns (uint) {
        return address(this).balance;
    }

    function getBorrowerBalance(address _borrower) public view returns (uint) {
        return _borrower.balance;
    }

    function calculateInterest(uint256 _amount, uint256 _interest) public pure returns (uint256) {
        return (_amount * _interest) / 100;
    }
}