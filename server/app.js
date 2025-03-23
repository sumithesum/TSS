class LoanEventObserver {
    update(event) {
      console.log('Received event:', event);
    }
  }
  
  
  class LoanRepaymentObserver extends LoanEventObserver {
    update(event) {
      if (event.type === 'loanCreated') {
        console.log('Împrumut creat:', event.data);
        window.location.reload();
  
      } else if (event.type === 'loansUpdated') {
        console.log('Împrumuturi actualizate:', event.data);
  
      }
    }
  }
  
  
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
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          console.log("Ethereum wallet connected!");
        } catch (error) {
          console.error("User denied account access:", error);
          alert("Trebuie să permiți accesul la MetaMask pentru a folosi această aplicație.");
        }
      } else if (window.web3) {
        App.web3Provider = window.web3.currentProvider;
        window.web3 = new Web3(window.web3.currentProvider);
        console.log("Using legacy dapp browser's provider.");
      } else {
        alert("Non-Ethereum browser detected. Instalează MetaMask!");
      }
    },
  
    loadAccount: async () => {
      try {
        const accounts = await web3.eth.getAccounts();
        if (accounts.length === 0) {
          alert("Nu s-au găsit conturi MetaMask. Asigură-te că ești conectat.");
          return;
        }
        App.account = accounts[0];
        console.log("Cont activ:", App.account);
      } catch (error) {
        console.error("Eroare la încărcarea contului:", error);
      }
    },
  
    loadContract: async () => {
      try {
        const DeFiLoanAddress = '0xf779725C14C10b7c03cC96F8EA93Fd10257937E1';
        const proxyAddress = '0x4466Bb46607B92367c6bD90beB20eE7afd0fbc30';
  
        const DeFiLoan = await $.getJSON('DeFiLoan.json');
        App.contracts.DeFiLoan = TruffleContract(DeFiLoan);
        App.contracts.DeFiLoan.setProvider(App.web3Provider);
  
        const loanProxy = await $.getJSON('LoanProxy.json');
        App.contracts.LoanProxy = TruffleContract(loanProxy);
        App.contracts.LoanProxy.setProvider(App.web3Provider);
  
        App.DeFiLoan = await App.contracts.DeFiLoan.at(DeFiLoanAddress);
        App.loanProxy = await App.contracts.LoanProxy.at(proxyAddress);
  
        console.log("Contracte încărcate:", App.DeFiLoan, App.loanProxy);
      } catch (error) {
        console.error("Eroare la încărcarea contractului:", error);
      }
    },
  
    render: async () => {
      if (App.loading) return;
      App.setLoading(true);
  
      $('#account').html(App.account);
  
      await App.renderLoans();
      
      App.setLoading(false);
    },
  
    renderLoans: async () => {
      try {
        const owner = await App.DeFiLoan.owner();
        console.log("Owner contract:", owner);
  
        const loansOwner = await App.DeFiLoan.getActiveLoans(owner);
  
  
  
        App.notifyObservers({ type: 'loansUpdated', data: loansOwner });
  
        const $loanTemplate = $('.loanTemplate');
        $('#loanList').empty();
        $('#paidLoanList').empty();
  
  
  
        loansOwner.forEach((loan, index) => {
          const amount = loan[0];
          const interest = loan[1];
          const dueDate = loan[2];
          const isRepaid = loan[4];
  
          const $newLoanTemplate = $loanTemplate.clone();
          $newLoanTemplate.find('.content').html(`Index: ${index}, Sumă: ${amount}, Dobândă: ${interest}, Scadență: ${new Date(dueDate * 1000).toLocaleString()}, Platit: ${isRepaid}`);
          $newLoanTemplate.find('input')
            .prop('amount', amount)
            .prop('interest', interest)
            .on('click', App.toggleRepaid);
  
          if (isRepaid) {
            $('#paidLoanList').append($newLoanTemplate);
            $newLoanTemplate.show();
          } else {
            $('#loanList').append($newLoanTemplate);
            $newLoanTemplate.show();
          }
        });
      } catch (error) {
        console.error('Eroare la randarea împrumuturilor:', error);
      }
    },
  
    createLoans: async () => {
      try {
        App.setLoading(true);
    
        const content = $('#newLoan').val();
        if (!content || isNaN(content)) {
          alert("Introdu o sumă validă pentru împrumut.");
          App.setLoading(false);
          return;
        }
    
        const dueDate = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
    
        console.log("Creare împrumut:", content, dueDate);
    
        const accounts = await web3.eth.getAccounts();
        
   
  
        const gasEstimate = await App.DeFiLoan.createLoan.estimateGas(content, dueDate, { from: accounts[0] });
        
    
        const gasLimit = gasEstimate + 10000;
    
        await App.DeFiLoan.createLoan( content, dueDate, {
          from: accounts[0],
          gas: gasLimit,
        });
    
  
      
  
  
        const newLoanEvent = { type: 'loanCreated', data: { amount: content, dueDate: dueDate } };
        App.notifyObservers(newLoanEvent);
    
        alert("Împrumut creat cu succes!");
      } catch (error) {
        console.error("Eroare la crearea împrumutului:", error.message);
        alert("A apărut o eroare la crearea împrumutului.");
      }
      App.setLoading(false);
    },
  
  
    handleRepayment: async (event) => {
      event.preventDefault();
      App.setLoading(true);
    
      const loanId = document.getElementById('loanId').value;
      const paymentValue = document.getElementById('paymentValue').value;
      
    
      console.log(loanId + " " + paymentValue);
    
      try {
        const accounts = await web3.eth.getAccounts();
        const valueInWei = web3.utils.toWei(paymentValue, 'ether');
    
        const owner = await App.DeFiLoan.owner();
        const loansOwner = await App.DeFiLoan.getActiveLoans(owner);
    
        if (!loansOwner[loanId]) {
          alert("Împrumutul nu există!");
          throw ("împrumut inexistent");
        }
          console.log("loan  " + loansOwner[loanId][4] )
        if (loansOwner[loanId][4] === true) {
          alert("Împrumutul a fost deja plătit");
          throw ("deja platit");
        }
        console.log(Number(loansOwner[loanId][0]) * Number(loansOwner[loanId][1]) / 100 + Number(loansOwner[loanId][0]))
          if(Number(loansOwner[loanId][0]) * Number(loansOwner[loanId][1]) / 100 + Number(loansOwner[loanId][0])  != Number( paymentValue)){
            throw ("not egal")
          }
          
          const gasEstimate = await App.DeFiLoan.repayLoan.estimateGas(accounts[0], loanId, { from: accounts[0], value: valueInWei });
          console.log('Estimare gas cost pentru rambursare: '+gasEstimate);
    
          
          const gasLimit = gasEstimate + 10000;
    
          await App.DeFiLoan.repayLoan(accounts[0], loanId, {
            from: accounts[0],
            value: valueInWei,
            gas: gasLimit,
          });
    
    
    
        alert('Împrumutul a fost rambursat cu succes!');
        window.location.reload();
      }
      catch (error) {
  
        switch (error){
          
          case "not egal" :
            console.error(error);
            alert("Not egal amounts!");
            break;
  
          case "împrumut inexistent":
            console.error('împrumut inexistent', error);
            alert('Imprumut inexistent!');
            break;
          case "deja platit" :
            console.error('Deja platit!', error);
            alert('Deja platit!');
            break;
          default:  
          console.error('Eroare la rambursarea împrumutului:', error);
          alert('A apărut o eroare la procesarea împrumutului.');
          break;
        }
  
        
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
  
  
      var loanRepaymentObserver = new LoanRepaymentObserver();
      App.addObserver(loanRepaymentObserver);
    });
  });