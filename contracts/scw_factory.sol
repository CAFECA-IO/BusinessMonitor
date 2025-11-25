// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@account-abstraction/contracts/core/EntryPoint.sol";
import "./scw.sol";

/**
 * Info: (20251125 - Tzuhan) 
 * @title SCWFactory
 * @dev 負責使用 CREATE2 確定性地部署 SCW 合約
 */
contract SCWFactory {
    address payable public immutable entryPoint;

    // Info: (20251125 - Tzuhan) [重要] 讓後端/Graph 可以索引到新帳戶的建立
    event AccountCreated(address indexed scw, uint256 pubKeyX, uint256 pubKeyY, uint256 salt);

    constructor(address payable _entryPoint) {
        entryPoint = _entryPoint;
    }

    /**
     * Info: (20251125 - Tzuhan)
     * 預先計算 SCW 合約地址 (Deterministic Address)。
     * 這讓前端可以在不發送交易的情況下，就知道用戶未來的錢包地址。
     *
     * @param pubKeyX Passkey 公鑰 X
     * @param pubKeyY Passkey 公鑰 Y
     * @param salt 隨機鹽值 (通常由前端生成，用於區分同一用戶的不同帳戶)
     */
    function getAddress(uint256 pubKeyX, uint256 pubKeyY, uint256 salt) public view returns (address) {
        // Info: (20251125 - Tzuhan) 1. 取得 SCW 的 Creation Code (包含合約編譯後的 Bytecode)
        bytes memory bytecode = type(SCW).creationCode;

        // Info: (20251125 - Tzuhan) 2. 將 constructor 參數打包 (EntryPoint, PubKeyX, PubKeyY)
        // 重要：這些參數會影響合約的初始化代碼 Hash，必須與 createAccount 傳入的一致
        bytes memory constructorArgs = abi.encode(address(entryPoint), pubKeyX, pubKeyY);

        // Info: (20251125 - Tzuhan) 3. 拼接: Creation Code + Constructor Args
        bytes memory fullBytecode = abi.encodePacked(bytecode, constructorArgs);

        // Info: (20251125 - Tzuhan) 4. 計算 Bytecode Hash
        bytes32 bytecodeHash = keccak256(fullBytecode);

        // Info: (20251125 - Tzuhan) 5. 使用 CREATE2 公式計算: keccak256(0xff + sender + salt + bytecodeHash)
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),     // Info: (20251125 - Tzuhan) sender (工廠地址)
                salt,              // Info: (20251125 - Tzuhan) salt
                bytecodeHash       // Info: (20251125 - Tzuhan) init code hash
            )
        );

        // Info: (20251125 - Tzuhan) 6. 取後 20 bytes 轉為 address
        return address(uint160(uint256(hash)));
    }

    /**
     * Info: (20251125 - Tzuhan) 
     * @dev 部署 SCW 合約
     * 這是 Lazy Deployment 中，Bundler 會透過 UserOp 的 initCode 呼叫的函式
     */
    function createAccount(uint256 pubKeyX, uint256 pubKeyY, uint256 salt) external returns (SCW ret) {
        // Info: (20251125 - Tzuhan) 1. 計算預期地址
        address addr = getAddress(pubKeyX, pubKeyY, salt);

        // Info: (20251125 - Tzuhan) 2. 檢查是否已經部署 (使用 Solidity 0.8+ 內建語法，更乾淨)
        if (addr.code.length > 0) {
            return SCW(payable(addr));
        }

        // Info: (20251125 - Tzuhan) 3. 使用 CREATE2 進行部署
        ret = new SCW{salt: bytes32(salt)}(entryPoint, pubKeyX, pubKeyY);

        // Info: (20251125 - Tzuhan) 4. 安全檢查：確保計算的地址與實際部署地址一致
        require(address(ret) == addr, "Factory: address mismatch");

        // Info: (20251125 - Tzuhan) 5. 發送事件
        emit AccountCreated(address(ret), pubKeyX, pubKeyY, salt);
    }
}
