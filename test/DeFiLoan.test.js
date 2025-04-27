const truffleAssert = require('truffle-assertions');
const LendingAndLoaning = artifacts.require("LendingAndLoaning");

contract("LendingAndLoaning", (accounts) => {
    const lender = accounts[0]; // Adresa lender-ului
    const borrower = accounts[1]; // Adresa borrower-ului
    const lendAmount = web3.utils.toWei("1", "ether"); // Suma de Ã®mprumut (1 ETH)

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
});