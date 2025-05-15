const truffleAssert = require('truffle-assertions');
const LendingAndLoaning = artifacts.require("LendingAndLoaning");

contract("LendingAndLoaning", (accounts) => {
    const lender = accounts[0]; 
    const borrower = accounts[1]; 
    const lendAmount = web3.utils.toWei("1", "ether"); 

    let lendingContract;

    beforeEach(async () => {
        lendingContract = await LendingAndLoaning.new();
    });

    it("should allow a lender to lend ETH", async () => {
        const result = await lendingContract.lend(borrower, lendAmount, { from: lender, value: lendAmount });

 
        console.log("Event Lend Emitted:", result.logs);

        truffleAssert.eventEmitted(result, 'Lend', (ev) => {
            console.log("Sender:", ev.sender);
            console.log("Amount In Dollars:", ev.amountInDollars.toString());
            console.log("Total Amount Available For Lend In Dollars:", ev.totalAmountAvailableForLendInDollars.toString());
            console.log("User Present:", ev.userPresent);
            console.log("User Index:", ev.userIndex.toString());
            
            return ev.sender === lender &&
                   ev.amountInDollars.toString() === lendAmount &&
                   ev.totalAmountAvailableForLendInDollars.toString() === lendAmount &&
                   ev.userPresent === false && 
                   ev.userIndex.toString() === "-1";
        });

        const lentAmount = await lendingContract.getEthLentAmount(lender);
        assert.equal(lentAmount.toString(), lendAmount, "Lent amount is incorrect");
    });

    it("should allow a borrower to take a loan", async () => {
        const loanAmount = web3.utils.toWei("1", "ether"); 
        const dueDate = Math.floor(Date.now() / 1000) + 3600; 
        
        await lendingContract.lend(borrower, lendAmount, { from: lender, value: lendAmount });
        
        await lendingContract.createLoan(loanAmount, dueDate, { from: borrower });
    
        const borrowerLoans = await lendingContract.getActiveLoans(borrower);
        assert.equal(borrowerLoans.length, 1);
        assert.equal(borrowerLoans[0].amount.toString(), loanAmount);
    });

    it("should allow a borrower to repay a loan", async () => {
    const loanAmount = web3.utils.toWei("1", "ether"); 
    const repayAmount = loanAmount; 
    const dueDate = Math.floor(Date.now() / 1000) + 3600; 


    await lendingContract.lend(borrower, loanAmount, { from: lender, value: lendAmount });
  
    await lendingContract.createLoan(loanAmount, dueDate, { from: borrower });
    var borrowerLoans = await lendingContract.getPaidLoans(borrower);


    await lendingContract.payLoan(borrower, borrowerLoans.length, { from: lender, value: repayAmount });
    borrowerLoans = await lendingContract.getPaidLoans(borrower);
    
    assert.equal(borrowerLoans.length, 1);
    assert.equal(borrowerLoans[0].amount.toString(), loanAmount);
    });

    it("should not allow repaying an already repaid loan", async () => {
        const loanAmount = web3.utils.toWei("1", "ether"); 
    const repayAmount = loanAmount; 
    const dueDate = Math.floor(Date.now() / 1000) + 3600; 


    await lendingContract.lend(borrower, loanAmount, { from: lender, value: lendAmount });
  
    await lendingContract.createLoan(loanAmount, dueDate, { from: borrower });
    var borrowerLoans = await lendingContract.getPaidLoans(borrower);


    await lendingContract.payLoan(borrower, borrowerLoans.length , { from: lender, value: repayAmount });
    borrowerLoans = await lendingContract.getPaidLoans(borrower);
    
    await truffleAssert.reverts(
        lendingContract.payLoan(borrower, borrowerLoans.length -1, { from: borrower, value: repayAmount }),
        "Loan already repaid",
        "Should not allow double repayment"
        );
    });
    
    //integritate test
    it("should allow full lending and borrowing cycle", async () => {
        const loanAmount = web3.utils.toWei("1", "ether");
        const dueDate = Math.floor(Date.now() / 1000) + 3600;
    
        
        await lendingContract.lend(borrower, loanAmount, { from: lender, value: loanAmount });
    
       
        await lendingContract.createLoan(loanAmount, dueDate, { from: borrower });
    
       
        await lendingContract.payLoan(borrower, 0, { from: lender, value: loanAmount });
    
        const paidLoans = await lendingContract.getPaidLoans(borrower);
        assert.equal(paidLoans.length, 1, "Loan should be marked as paid");
    });


    //performanta test
    it("should measure gas used for lending operation", async () => {
        const tx = await lendingContract.lend(borrower, lendAmount, { from: lender, value: lendAmount });
        console.log("Gas used for lending:", tx.receipt.gasUsed);
    
        assert.isBelow(tx.receipt.gasUsed, 200000, "Gas usage is too high");
    });
    it("should measure gas used for creating a loan", async () => {
        const dueDate = Math.floor(Date.now() / 1000) + 3600;
        
      
        await lendingContract.lend(borrower, lendAmount, {
            from: lender,
            value: lendAmount
        });
    
        const tx = await lendingContract.createLoan(lendAmount, dueDate, {
            from: borrower
        });
    
        console.log("Gas used for createLoan:", tx.receipt.gasUsed);
        assert.isBelow(tx.receipt.gasUsed, 200000, "Gas usage for createLoan is too high");
    });
    it("should measure gas used for paying back a loan", async () => {
        const dueDate = Math.floor(Date.now() / 1000) + 3600;
    
        
        await lendingContract.lend(borrower, lendAmount, {
            from: lender,
            value: lendAmount
        });
    
        await lendingContract.createLoan(lendAmount, dueDate, {
            from: borrower
        });
    
        const tx = await lendingContract.payLoan(borrower, 0, {
            from: lender,
            value: lendAmount
        });
    
        console.log("Gas used for payLoan:", tx.receipt.gasUsed);
        assert.isBelow(tx.receipt.gasUsed, 200000, "Gas usage for payLoan is too high");
    });
    it("should measure gas used for lending and taking back the lending", async () => {
        await lendingContract.lend(borrower, lendAmount, { from: lender, value: lendAmount });

        const tx = await lendingContract.withdraw();

        console.log("Gas used for withdraw:", tx.receipt.gasUsed);
    
        assert.isBelow(tx.receipt.gasUsed, 200000, "Gas usage is too high");
 
    });

});


///Chat GPT: 
/*
contract("LendingAndLoaning", (accounts) => {
  const lender = accounts[0];
  const borrower = accounts[1];
  const lendAmount = web3.utils.toWei("1", "ether");

  let instance;

  beforeEach(async () => {
    instance = await LendingAndLoaning.new();
  });

  it("should correctly record ETH lent and update lenders array", async () => {
    await instance.lend(borrower, lendAmount, { from: lender, value: lendAmount });

    const recordedAmount = await instance.getEthLentAmount(borrower);
    assert.equal(recordedAmount.toString(), lendAmount, "Lent amount is incorrect");

    const lenders = await instance.getLenders();
    assert.include(lenders, borrower, "Borrower not added to lenders list");
  });
});
*/