// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@account-abstraction/contracts/core/EntryPoint.sol";
import "./lib/fcl_ecdsa.sol";
import "./lib/utils/base64url.sol";

contract SCW is IAccount {
    EntryPoint public immutable entryPoint;
    uint256 public ownerPubKeyX;
    uint256 public ownerPubKeyY;

    constructor(address payable _entryPoint, uint256 _pubKeyX, uint256 _pubKeyY) {
        entryPoint = EntryPoint(_entryPoint);
        ownerPubKeyX = _pubKeyX;
        ownerPubKeyY = _pubKeyY;
    }

    struct WebAuthnSignature {
        bytes authenticatorData;
        bytes clientDataJSON;
        uint256 challengeLocation;
        uint256 responseTypeLocation;
        uint256 r;
        uint256 s;
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
        WebAuthnSignature memory sig = abi.decode(signature, (WebAuthnSignature));

        // Info: (20251121 - Tzuhan) 1. 驗證 Challenge (使用 Base64Url.encode 確保格式正確)
        string memory challengeBase64 = Base64Url.encode(abi.encodePacked(userOpHash));
        bytes memory challengeBytes = bytes(challengeBase64);

        // Info: (20251121 - Tzuhan) 防止越界讀取
        if (sig.challengeLocation + challengeBytes.length > sig.clientDataJSON.length) return false;
        
        // Info: (20251121 - Tzuhan) 比對內容
        for (uint i = 0; i < challengeBytes.length; i++) {
            if (sig.clientDataJSON[sig.challengeLocation + i] != challengeBytes[i]) {
                return false; // Info: (20251121 - Tzuhan) Challenge 不匹配 (這就是導致 AA24 的原因)
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

        // Info: (20251121 - Tzuhan) 3. 驗證 P-256 簽名
        bytes32 clientDataHash = sha256(sig.clientDataJSON);
        bytes32 messageHash = sha256(abi.encodePacked(sig.authenticatorData, clientDataHash));
        // Info: (20251120 - Tzuhan) 使用 FCL_ecdsa.ecdsa_verify
        return FCL_ecdsa.ecdsa_verify(messageHash, sig.r, sig.s, ownerPubKeyX, ownerPubKeyY);
    }

    function execute(address dest, uint256 value, bytes calldata func) external {
        require(msg.sender == address(this) || msg.sender == address(entryPoint), "SCW: unauthorized");
        (bool success, ) = dest.call{value: value}(func);
        require(success, "SCW: execution failed");
    }

    receive() external payable {}
}
