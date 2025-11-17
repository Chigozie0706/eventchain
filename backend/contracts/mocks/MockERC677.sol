// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IERC677Receiver {
    function onTokenTransfer(
        address from,
        uint256 value,
        bytes calldata data
    ) external returns (bool);
}

contract MockERC677 is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }

    function transferAndCall(
        address to,
        uint256 value,
        bytes calldata data
    ) external returns (bool) {
        require(transfer(to, value), "Transfer failed");

        if (to.code.length > 0) {
            IERC677Receiver receiver = IERC677Receiver(to);
            require(
                receiver.onTokenTransfer(msg.sender, value, data),
                "Callback failed"
            );
        }

        return true;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
