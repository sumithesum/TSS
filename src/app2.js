App = {
    loading: false,
    contracts: {},
    observers: [],

    addObserver: function (observer) {
        this.observers.push(observer);
    },

    notifyObservers: function (event) {
        this.observers.forEach(observer => observer.update(event));
    },

    load: async () => {
        await App.loadWeb3();
        await App.loadAccount();
        await App.loadContract();
        await App.render();
    },

    loadWeb3: async () => {
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            window.web3 = new Web3(window.ethereum);
            try {
                await window.ethereum.enable();
            } catch (error) {
                console.error("User denied account access");
            }
        } else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
            window.web3 = new Web3(window.web3.currentProvider);
        } else {
            console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
        }
    },

    loadAccount: async () => {
        const accounts = await web3.eth.getAccounts();
        App.account = accounts[0];
        console.log("Active account:", App.account);
    },

    loadContract: async () => {
      try {

  
        
        const LendingAndLoaning = await $.getJSON('LendingAndLoaning.json');
      
      
       
        App.contracts.LendingAndLoaning = TruffleContract(LendingAndLoaning);
        App.contracts.LendingAndLoaning.setProvider(App.web3Provider);

  

    
        App.LendingAndLoaning = await App.contracts.LendingAndLoaning.deployed();
        
      
  
        console.log("Contracte încărcate:", App.LendingAndLoaning);
      } catch (error) {
        console.error("Eroare la încărcarea contractului:", error);
      }
    },
    render: async () => {
        if (App.loading) return;
        App.setLoading(true);

        $('#account').html(App.account);

        await App.renderLoans();

        await App.renderLended();

        App.setLoading(false);
    },

    renderLended : async () => {
      try {
        const lended = await App.LendingAndLoaning.getEthLentAmount(App.account);
        document.getElementById('lended').innerHTML = web3.utils.fromWei(lended.toString(), 'ether').toString() + " ETH"; 
        const total = await App.LendingAndLoaning.getMoney();
        console.log("Banii: " + web3.utils.fromWei(total.toString(), 'ether').toString());
    } catch (error) {
        console.error('Eroare la randarea împrumuturilor:', error);
      }
    },

    renderLoans: async () => {
        try {
            const activeLoans = await App.LendingAndLoaning.getActiveLoans(App.account);
            const paidLoans = await App.LendingAndLoaning.getPaidLoans(App.account);

            const $activeLoansList = $('#activeLoansList');
            const $paidLoansList = $('#paidLoansList');

            $activeLoansList.empty();
            $paidLoansList.empty();

            activeLoans.forEach((loan, index) => {
                const amount = loan.amount / 10**18;
                const interest = loan.interest;
                const dueDate = loan.dueDate;
                const isRepaid = loan.isRepaid;
                if(isRepaid == false){
                const loanElement = `<li>Index: ${index}, Amount: ${amount}, Interest: ${interest}, Due Date: ${new Date(dueDate * 1000).toLocaleString()}, Repaid: ${isRepaid}</li>`;
                $activeLoansList.append(loanElement);
                }
            });

            paidLoans.forEach((loan, index) => {
                const amount = loan.amount / 10**18;
                const interest = loan.interest;
                const dueDate = loan.dueDate;
                const isRepaid = loan.isRepaid;
                
                const loanElement = `<li>Index: ${index}, Amount: ${amount}, Interest: ${interest}, Due Date: ${new Date(dueDate * 1000).toLocaleString()}, Repaid: ${isRepaid}</li>`;
                $paidLoansList.append(loanElement);
            });
        } catch (error) {
            console.error('Eroare la randarea împrumuturilor:', error);
        }
    },

    requestLoan: async (amount) => {
        try {
            App.setLoading(true);
            const dueDate = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
            const weiAmount = web3.utils.toWei(amount, 'ether');
    
            console.log("Requesting loan with amount (in ether):", amount);
            console.log("Due date:", dueDate);
            console.log("From account:", App.account);
            console.log("Value (in wei):", weiAmount);
            
            let gasCost = await App.LendingAndLoaning.createLoan.estimateGas(weiAmount,dueDate, {
                from: App.account,
            });

            gasCost = gasCost * 1.5;
            console.log("Estimated gas cost:", gasCost);


            await App.LendingAndLoaning.createLoan(weiAmount,dueDate, {
                from: App.account,
            });

            console.log("Loan request transaction sent");

            //await App.LendingAndLoaning.GiveMoney(weiAmount,{from: App.account});

    
            console.log("Loan request transaction sent");
            alert("Împrumut creat cu succes!");
            window.location.reload();
        } catch (error) {
            console.error("Eroare la crearea împrumutului:", error);
            alert("A apărut o eroare la crearea împrumutului.");
        }
        App.setLoading(false);
    },
    payLoan: async (index) => {
        try {
            App.setLoading(true);
            let borrower = App.account;
            let active  = await App.LendingAndLoaning.getActiveLoans(borrower);
            let loan = active[index];
            let amount = loan[0];
            console.log("Paying loan with index:", amount);
    
            await App.LendingAndLoaning.payLoan(borrower, index, {
                from: App.account,
                value: amount
            });

            alert("Loan repaid successfully!");
            window.location.reload();
        } catch (error) {
            console.error("Error repaying loan:", error);
            alert("An error occurred while repaying the loan.");
        }
        App.setLoading(false);
    },

    lend: async (amount) => {
      try {
          App.setLoading(true);
          let borrower = App.account;
          let weiAmount = web3.utils.toWei(amount, 'ether');
          await App.LendingAndLoaning.lend(borrower, weiAmount, {
              from: App.account,
              value: weiAmount
          });
  
          alert("Money lent successfully!");
          window.location.reload();
      } catch (error) {
          console.error("Error lending:", error);
          alert("An error occurred while lending.");
      }
      App.setLoading(false);
  },
  withdraw: async () => {
    try {
        App.setLoading(true);

        await App.LendingAndLoaning.withdraw( {
            from: App.account
        });

        alert("Withdrawal successful!");
        window.location.reload();
    } catch (error) {
        console.error("Error withdrawing:", error);
        alert("An error occurred while withdrawing.");
    }
    App.setLoading(false);
  },


    setLoading: (boolean) => {
        App.loading = boolean;
        const loader = $('#loader');
        const content = $('#content');
        if (boolean) {
            loader.show();
            content.hide();
        } else {
            loader.hide();
            content.show();
        }
    }
};

$(() => {
    $(window).on("load", () => {
        App.load();
    });
});