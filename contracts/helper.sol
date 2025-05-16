// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "@openzeppelin/contracts/access/Ownable.sol";



library helper {
      function isUserIn(address user, address[] storage list) internal view returns (bool, int256) {
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == user) {
                return (true, int256(i));
            }
        }
        return (false, -1);
    }

    function addressInList(address user, address[] storage list) internal view returns (bool) {
        for (uint256 i = 0; i < list.length; i++) {
            if (list[i] == user) {
                return true;
            }
        }
        return false;
    }

}