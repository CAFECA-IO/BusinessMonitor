// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// [重要] 從 node_modules/@account-abstraction 導入
import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@account-abstraction/contracts/core/EntryPoint.sol";

/**
 * @title SCW (Smart Contract Wallet)
 * @dev [PoC 2] 最小可行智能合約錢包，符合 IAccount 介面
 */
contract SCW is IAccount {
    EntryPoint public immutable entryPoint;
    
    // 這裡將儲存 FIDO2 公鑰的 x, y 座標
    uint256 public ownerPubKeyX;
    uint256 public ownerPubKeyY;

    // SCW 需要知道 EntryPoint 的地址才能互動
    constructor(address payable _entryPoint, uint256 _pubKeyX, uint256 _pubKeyY) {
        entryPoint = EntryPoint(_entryPoint);
        ownerPubKeyX = _pubKeyX;
        ownerPubKeyY = _pubKeyY;
    }

    /**
     * @notice Validates a user operation.
     * @dev This is a stub and needs implementation.
     * * * */
    function validateUserOp(
        UserOperation calldata /* userOp */,
        bytes32 /* userOpHash */,
        uint256 /* missingAccountFunds */
    ) external pure returns (uint256) {
        // [PoC 2 - Stub]
        // 暫時返回 0 (VALIDATION_SUCCESS)
        // 真正的實作將在 Phase 2 中完成
        return 0; 
    }

    /**
     * @dev 執行交易。只有 SCW 自己 (透過 EntryPoint) 可以呼叫。
     */
    function execute(address dest, uint256 value, bytes calldata func) external {
        // 確保只有 EntryPoint (或自己) 可以呼叫
        require(msg.sender == address(this) || msg.sender == address(entryPoint), "SCW: unauthorized");
        
        (bool success, ) = dest.call{value: value}(func);
        require(success, "SCW: execution failed");
    }

    // 允許合約接收 ETH
    receive() external payable {}
}