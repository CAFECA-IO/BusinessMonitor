// Info: (20251118 - Tzuhan) SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

// Info: (20251118 - Tzuhan) 從 node_modules/@account-abstraction 導入
import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@account-abstraction/contracts/core/EntryPoint.sol";

/**
 * Info: (20251118 - Tzuhan) SCW (Smart Contract Wallet)
 * Info: (20251118 - Tzuhan) [PoC 2] 最小可行智能合約錢包，符合 IAccount 介面
 */
contract SCW is IAccount {
    EntryPoint public immutable entryPoint;
    
    // Info: (20251118 - Tzuhan) 這裡將儲存 FIDO2 公鑰的 x, y 座標
    uint256 public ownerPubKeyX;
    uint256 public ownerPubKeyY;

    // Info: (20251118 - Tzuhan) SCW 需要知道 EntryPoint 的地址才能互動
    constructor(address payable _entryPoint, uint256 _pubKeyX, uint256 _pubKeyY) {
        entryPoint = EntryPoint(_entryPoint);
        ownerPubKeyX = _pubKeyX;
        ownerPubKeyY = _pubKeyY;
    }

    /**
     * Info: (20251118 - Tzuhan) Validates a user operation.
     * Info: (20251118 - Tzuhan) This is a stub and needs implementation.
     * * * */
    function validateUserOp(
        UserOperation calldata /*Info: (20251118 - Tzuhan)  userOp */,
        bytes32 /* Info: (20251118 - Tzuhan) userOpHash */,
        uint256 /* Info: (20251118 - Tzuhan) missingAccountFunds */
    ) external pure returns (uint256) {
        // Info: (20251118 - Tzuhan) [PoC 2 - Stub]
        // Info: (20251118 - Tzuhan) 暫時返回 0 (VALIDATION_SUCCESS)
        // Info: (20251118 - Tzuhan) 真正的實作將在 Phase 2 中完成
        return 0; 
    }

    /**
     * Info: (20251118 - Tzuhan) 執行交易。只有 SCW 自己 (透過 EntryPoint) 可以呼叫。
     */
    function execute(address dest, uint256 value, bytes calldata func) external {
        // Info: (20251118 - Tzuhan) 確保只有 EntryPoint (或自己) 可以呼叫
        require(msg.sender == address(this) || msg.sender == address(entryPoint), "SCW: unauthorized");
        
        (bool success, ) = dest.call{value: value}(func);
        require(success, "SCW: execution failed");
    }

    // Info: (20251118 - Tzuhan) 允許合約接收 ETH
    receive() external payable {}
}