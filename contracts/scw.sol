// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@account-abstraction/contracts/core/EntryPoint.sol";
import "./lib/fcl_ecdsa.sol";
import "./lib/utils/base64url.sol";

contract SCW is IAccount {
    EntryPoint public immutable entryPoint;

    uint256 public signerCount;
    
    /**
     * Info: (20251127 - Tzuhan) [PoC 4] 改用 Mapping 儲存多個 Signer
     * Key: keccak256(abi.encode(x, y))
     * Value: true (authorized) / false (unauthorized)
     */
    mapping(bytes32 => bool) public signers;

    event SignerAdded(bytes32 indexed pubKeyHash, uint256 x, uint256 y);
    event SignerRemoved(bytes32 indexed pubKeyHash, uint256 x, uint256 y);

    // Info: (20251127 - Tzuhan) 限制只能由合約自己呼叫 (透過 execute)
    modifier onlySelf() {
        require(msg.sender == address(this), "SCW: must call via UserOp");
        _;
    }

    constructor(address payable _entryPoint, uint256 _pubKeyX, uint256 _pubKeyY) {
        entryPoint = EntryPoint(_entryPoint);
        // Info: (20251127 - Tzuhan) 初始化時加入第一把鑰匙
        _addSigner(_pubKeyX, _pubKeyY);
    }

    /**
     * Info: (20251127 - Tzuhan) [PoC 4] 新增管理介面
     * 用戶可以發送 UserOp 呼叫此函式來授權新裝置
     */
    function addSigner(uint256 x, uint256 y) public onlySelf {
        _addSigner(x, y);
    }

    function removeSigner(uint256 x, uint256 y) public onlySelf {
        bytes32 hash = keccak256(abi.encode(x, y));
        if (signers[hash]) {
            // Info: (20251128 - Tzuhan) 安全檢查：確保移除後至少還剩一個 Signer
            require(signerCount > 1, "SCW: cannot remove last signer");
            
            signers[hash] = false;
            signerCount--;
            emit SignerRemoved(hash, x, y);
        }
    }

    function _addSigner(uint256 x, uint256 y) internal {
        bytes32 hash = keccak256(abi.encode(x, y));
        if (!signers[hash]) {
            signers[hash] = true;
            signerCount++;
            emit SignerAdded(hash, x, y);
        }
    }

    struct WebAuthnSignature {
        bytes authenticatorData;
        bytes clientDataJSON;
        uint256 challengeLocation;
        uint256 responseTypeLocation;
        uint256 r;
        uint256 s;
        // [PoC 4] 簽名中必須包含公鑰，以便合約知道要用哪把鑰匙驗證
        uint256 pubKeyX;
        uint256 pubKeyY;
    }

    /**
     * Info: (20251124 - Tzuhan) 
     * 驗證並支付 EntryPoint
     * @param missingAccountFunds EntryPoint 要求此合約支付的預付款 (Gas)
     */
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external override returns (uint256) {
        // Info: (20251124 - Tzuhan) 1. 安全檢查：只允許 EntryPoint 呼叫
        require(msg.sender == address(entryPoint), "SCW: unauthorized");

        /**
         * Info: (20251121 - Tzuhan) [資金流向] 支付 Gas 預付款
         * 這是用戶「歸墊」給 EntryPoint 的地方。
         *
         * ★★★ 關於 Relayer 全額買單 ★★★
         * 如果前端傳來的 UserOp 中 maxFeePerGas 為 0，
         * EntryPoint 計算出的 missingAccountFunds 就會是 0。
         * 下面的 if 條件就不會成立，SCW 就不會轉出任何代幣。
         * 這樣就實現了「不扣 SCW 錢」的目標。
         */
        if (missingAccountFunds != 0) {
            (bool success, ) = payable(msg.sender).call{value: missingAccountFunds}("");
            (success);
        }

        // Info: (20251124 - Tzuhan) 2. 驗證簽名
        if (!_verifyWebAuthnSignature(userOp.signature, userOpHash)) {
            return 1;
        }

        return 0;
    }

    function _verifyWebAuthnSignature(bytes calldata signature, bytes32 userOpHash) internal view returns (bool) {
        // Info: (20251127 - Tzuhan) 1. 解碼包含公鑰的簽名結構
        WebAuthnSignature memory sig = abi.decode(signature, (WebAuthnSignature));

        // Info: (20251127 - Tzuhan) 2. [PoC 4] 檢查公鑰是否為授權的 Signer
        bytes32 pubKeyHash = keccak256(abi.encode(sig.pubKeyX, sig.pubKeyY));
        if (!signers[pubKeyHash]) {
            return false; // 簽名者未授權
        }

        // Info: (20251127 - Tzuhan) 3. 驗證 Challenge (UserOpHash)
        string memory challengeBase64 = Base64Url.encode(abi.encodePacked(userOpHash));
        bytes memory challengeBytes = bytes(challengeBase64);

        // Info: (20251121 - Tzuhan) 防止越界讀取
        if (sig.challengeLocation + challengeBytes.length > sig.clientDataJSON.length) return false;
        
        // Info: (20251121 - Tzuhan) 比對內容
        for (uint i = 0; i < challengeBytes.length; i++) {
            if (sig.clientDataJSON[sig.challengeLocation + i] != challengeBytes[i]) {
                return false;
            }
        }

        // Info: (20251121 - Tzuhan) 2. 驗證 Type
        bytes memory expectedType = bytes("webauthn.get");
        if (sig.responseTypeLocation + expectedType.length > sig.clientDataJSON.length) return false;
        for (uint i = 0; i < expectedType.length; i++) {
            if (sig.clientDataJSON[sig.responseTypeLocation + i] != expectedType[i]) {
                return false;
            }
        }

        // Info: (20251127 - Tzuhan) 5. 驗證 P-256 簽名 (使用結構中傳入的 X, Y)
        bytes32 clientDataHash = sha256(sig.clientDataJSON);
        bytes32 messageHash = sha256(abi.encodePacked(sig.authenticatorData, clientDataHash));
        // Info: (20251120 - Tzuhan) 使用 FCL_ecdsa.ecdsa_verify
        return FCL_ecdsa.ecdsa_verify(messageHash, sig.r, sig.s, sig.pubKeyX, sig.pubKeyY);
    }

    function execute(address dest, uint256 value, bytes calldata func) external {
        require(msg.sender == address(this) || msg.sender == address(entryPoint), "SCW: unauthorized");
        (bool success, ) = dest.call{value: value}(func);
        require(success, "SCW: execution failed");
    }

    receive() external payable {}
}
