const LendingAndLoaning = artifacts.require("LendingAndLoaning");

module.exports = function(deployer) {
  deployer.deploy(LendingAndLoaning);
};



