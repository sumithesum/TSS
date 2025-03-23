const { assert } = require("chai")

const DeFiLoan = artifacts.require('./DeFiLoan.sol')

contract('DeFiLoan', (accounts) => {
    before(async () => {
        this.defiLoan =  await DeFiLoan.deployed()
    })

    it('deployed successfully', async () => {
        const address = await this.defiLoan.address
        assert.notEqual(address, 0x0)
        assert.notEqual(address, '')
        assert.notEqual(address, null)
        assert.notEqual(address, undefined)
    })

    it('create loans', async () => {
        const dueDate = Math.floor(Date.now() / 1000) + 3600; 
        var nrContracts = await this.defiLoan.getActiveLoans(accounts[0])
        nrContracts = nrContracts.length
        const result = await this.defiLoan.createLoan(5, dueDate);
        const loans = await this.defiLoan.getActiveLoans(accounts[0]);
        assert.equal(loans.length, nrContracts + 1, 'Loan was not added correctly')

        const event = result.logs[0].args
        assert.equal(Number(event.amount), 5, 'Amount is not 5');
        assert.equal(Number(event.interest), 10, 'Interest rate is incorrect');
        assert.equal(event.dueDate, dueDate, 'Due date must be in the future');
        assert.equal(event.borrower, accounts[0], 'Borrower address is incorrect');
        assert.equal(event.isRepaid, false, 'Loan should not be repaid initially');
    })

    it('list loans', async () => {
        const dueDate = Math.floor(Date.now() / 1000) + 3600; // 1 oră de la momentul actual
        
        var nrContracts = await this.defiLoan.getActiveLoans(accounts[0])
        nrContracts = nrContracts.length
        await this.defiLoan.createLoan(5, dueDate);
        const loans = await this.defiLoan.getActiveLoans(accounts[0]);
        
        assert.equal(loans.length, nrContracts + 1, 'Loan was not added correctly');

        for(var i = 0; i < nrContracts + 1; i++){
            assert.isAbove(Number(loans[i].amount), 0, 'Amount must be greater than 0');
            assert.equal(Number(loans[i].interest), 10, 'Interest rate is incorrect');
            assert.isAbove(loans[i].dueDate * 1000, Date.now(), 'Due date must be in the future');
            assert.equal(loans[i].borrower, accounts[0], 'Borrower address is incorrect');
            assert.equal(loans[i].isRepaid, false, 'Loan should not be repaid initially');
        }
        
    })

    it('toggles loan completion', async () => {
        const loansA = await this.defiLoan.getActiveLoans(accounts[0]);
        const loanA = loansA[0];

        
        const amountInWei = web3.utils.toBN(loanA.amount);
        const interestInWei = amountInWei.mul(web3.utils.toBN(loanA.interest)).div(web3.utils.toBN(100));
        const totalPayment = amountInWei.add(interestInWei);
        const result = await this.defiLoan.repayLoan(accounts[0], 0, { from: accounts[0], value: totalPayment });

        const loans = await this.defiLoan.getPaidLoans(accounts[0]);
        const loan = loans[0];

        assert.equal(loan.isRepaid, true, 'Loan should be marked as repaid');

        const event = result.logs[0].args;
        //console.log(event);
        assert.equal(event.borrower, accounts[0], 'Borrower address is incorrect');
        assert.isAbove(Number(event.loanIndex), -1, 'Loan should be repaid');
    })
})