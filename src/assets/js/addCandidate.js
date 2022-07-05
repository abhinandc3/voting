App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      const ethEnabled = () => {
        if (window.ethereum) {
          window.web3 = new Web3(window.ethereum);
          return true;
        }
        return false;
      };
      if (!ethEnabled()) {
        alert(
          'Please install an Ethereum-compatible browser or extension like MetaMask to use this dApp!'
        );
      }
      web3 = window.web3;
      App.web3Provider = web3.currentProvider;
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider(
        'http://localhost:7545'
      );
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function () {
    $.getJSON('./Election.json', function (election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      return App.render();
    });
  },

  getVotingStatus: () => {
    App.contracts.Election.deployed().then((instance) => {
      instance.isVotingStarted().then((isVotingStarted) => {
        $('#votingStatus').text(
          `Voting Status : ${isVotingStarted ? 'On' : 'Off'}`
        );
        $('#votingToggle').text(isVotingStarted ? 'Turn Off' : 'Turn On');
      });
    });
  },

  render: async () => {
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      App.account = accounts[0];
      $('#accountAddress').html('Your Account: ' + App.account);
    } catch (error) {
      if (error.code === 4001) {
        // User rejected request
      }
      console.log(error);
    }

    App.getVotingStatus();

    $('#votingToggle').on('click', () => {
      App.contracts.Election.deployed().then((instance) => {
        instance.toggleVoting({ from: App.account }).then((result) => {
          console.log('Voting Toggled', result);
          alert('Voting Toggled');

          App.getVotingStatus();
        });
      });
    });

    $('#frmContact').on('submit', (e) => {
      e.preventDefault();
      const name = $('#name').val();
      const party = $('#cparty').val();
      if (name.trim() == '') {
        alert('Enter name');
        return false;
      } else if (party.trim() == '') {
        alert('Enter candidate party');
        return false;
      } else {
        App.contracts.Election.deployed().then((instance) => {
          instance
            .addCandidate(name, party, { from: App.account })
            .then((result) => {
              console.log('Candiate Added', result);
              alert('Candiate Added');
              $('#name').val('');
              $('#cparty').val('');
            });
        });
      }
      return false;
    });
  },
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
