// SPDX-License-Identifier: UNLICENSED
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
     * Info: (20251120 - Tzuhan)
     * 驗證 UserOperation。
     * 關鍵修正：移除了 'pure'，並加入了付費邏輯。
     */
    function validateUserOp(
        UserOperation calldata,
        bytes32,
        uint256 missingAccountFunds
    ) external override returns (uint256) {
        // Info: (20251120 - Tzuhan) 這裡依舊是 Stub (不驗證簽名，直接回傳 0)
        // Info: (20251120 - Tzuhan) 但增加了 "付費" 的動作
        
        // Info: (20251120 - Tzuhan) 只有 EntryPoint 可以呼叫此函式
        require(msg.sender == address(entryPoint), "SCW: unauthorized");

        // Info: (20251120 - Tzuhan) 如果 EntryPoint 要求預付款，我們就付給它
        if (missingAccountFunds != 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            (success); // Info: (20251120 - Tzuhan) 忽略回傳值，如果失敗 EntryPoint 會自己處理
        }

        return 0; // Info: (20251120 - Tzuhan) 驗證成功
    }

    function execute(address dest, uint256 value, bytes calldata func) external {
        require(msg.sender == address(this) || msg.sender == address(entryPoint), "SCW: unauthorized");
        (bool success, ) = dest.call{value: value}(func);
        require(success, "SCW: execution failed");
    }

    // Info: (20251118 - Tzuhan) 允許合約接收 ETH
    receive() external payable {}
}
