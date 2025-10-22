import { fido2ClientService } from '@/lib/fido2-client';
import { ethers } from 'ethers';

// Info: (20251020 - Tzuhan) 輔助函式：將 ArrayBuffer 轉換為 Hex 字串
function ab2hex(ab: ArrayBuffer): string {
  return Array.from(new Uint8Array(ab))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Info: (20251020 - Tzuhan)
 * 首次生成區塊鏈私鑰，並使用 FIDO2 派生的金鑰對其進行加密。
 * @param userId - 當前登入的使用者 ID
 * @returns {Promise<{encryptedPrivateKey: string, publicKey: string, address: string, derivationNonce: string}>}
 * 加密後的私鑰、公鑰和地址，準備存儲到後端。
 */
export async function createAndEncryptBlockchainKey(userId: string) {
  logger.debug('[DEBUG] --- createAndEncryptBlockchainKey ---');
  try {
    // Info: (20251020 - Tzuhan) 1. 生成一個全新的、真正隨機的以太坊錢包
    const wallet = ethers.Wallet.createRandom();
    logger.debug('[DEBUG] 1. 原始 Private Key:', wallet.privateKey);

    // Info: (20251020 - Tzuhan) 2. 構造包含 "cafeca" 前綴和意圖的 Challenge
    const nonce = ethers.hexlify(ethers.randomBytes(32));
    const derivationChallenge = `cafeca-key_encryption-${userId}-${nonce}`;
    logger.debug('[DEBUG] 2. 加密 Challenge:', derivationChallenge);

    // --- (A) 驗證簽章是否穩定 ---
    logger.debug('[DEBUG] 3a. 正在請求第一次簽章 (用於確定性檢查)');
    const authentication1 = await fido2ClientService.startLogin({
      challenge: derivationChallenge,
      userVerification: 'required',
    });
    const signature1 = authentication1.response.signature;
    logger.debug('[DEBUG] 3b. 第一次簽章 Signature:', signature1);

    logger.debug('[DEBUG] 3c. 正在請求第二次簽章 (用於確定性檢查)');
    const authentication2 = await fido2ClientService.startLogin({
      challenge: derivationChallenge,
      userVerification: 'required',
    });
    const signature2 = authentication2.response.signature;
    logger.debug('[DEBUG] 3d. 第二次簽章 Signature:', signature2);

    if (signature1 === signature2) {
      logger.debug('[DEBUG] ✅ 簽章是確定的！');
    } else {
      console.error('[DEBUG] ❌ 簽章不確定！這很可能是導致解密失敗的原因。');
      // 可以考慮在此拋出錯誤，因為後續流程基於錯誤假設
      throw new Error(
        'FIDO2 signature is non-deterministic, cannot derive stable key based on this design.'
      );
    }
    // --- 使用第一次簽章繼續流程 ---
    const signature = signature1;

    // Info: (20251020 - Tzuhan) 4. 使用 Keccak256 將簽章轉換為一個 32 位元組的對稱加密金鑰
    const encryptionKeyMaterial = ethers.keccak256(ethers.toUtf8Bytes(signature));
    logger.debug('[DEBUG] 4a. 加密 Key Material (Keccak Hash):', encryptionKeyMaterial);
    const encryptionKey = new Uint8Array(ethers.getBytes(encryptionKeyMaterial));
    logger.debug('[DEBUG] 4b. 加密 AES Key (Uint8Array):', encryptionKey);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    logger.debug('[DEBUG] 4c. 加密 IV (Hex):', ab2hex(iv.buffer));

    // Info: (20251020 - Tzuhan) 5. 使用 Web Crypto API (AES-GCM) 加密私鑰
    const key = await window.crypto.subtle.importKey(
      'raw',
      encryptionKey,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new Uint8Array(ethers.getBytes(wallet.privateKey)) // 將私鑰轉為 Uint8Array 加密
    );
    logger.debug('[DEBUG] 5. 加密 Encrypted Data (Hex):', ab2hex(encrypted));

    // Info: (20251020 - Tzuhan) 6. 組合加密結果以便儲存
    const encryptedPayload = {
      iv: ab2hex(iv.buffer),
      encryptedData: ab2hex(encrypted),
    };
    console.log('[DEBUG] 6. 最終儲存的 Payload:', JSON.stringify(encryptedPayload));

    return {
      encryptedPrivateKey: JSON.stringify(encryptedPayload),
      publicKey: wallet.publicKey,
      address: wallet.address,
      derivationNonce: nonce,
    };
  } catch (error) {
    logger.error('生成並加密區塊鏈金鑰時失敗:', error);
    if (error instanceof Error && error.name === 'NotAllowedError') {
      throw new Error('使用者取消了 FIDO2 驗證操作。');
    }
    throw error;
  } finally {
    logger.debug('[DEBUG] --- createAndEncryptBlockchainKey END ---');
  }
}

/**
 * 使用 FIDO2 驗證來解密已儲存的區塊鏈私鑰。
 * @param userId - 當前登入的使用者 ID
 * @param encryptedPrivateKeyPayload - 從後端獲取的加密 payload (包含 iv 和 encryptedData)
 * @param derivationNonce - 從後端獲取的、當初用於派生的 nonce
 * @returns {Promise<ethers.Wallet>} 解密後的 ethers.js Wallet 物件，可用於簽署
 */
export async function decryptAndUseBlockchainKey(
  userId: string,
  encryptedPrivateKeyPayload: string,
  derivationNonce: string
): Promise<ethers.Wallet> {
  logger.debug('[DEBUG] --- decryptAndUseBlockchainKey ---');
  try {
    const { iv, encryptedData } = JSON.parse(encryptedPrivateKeyPayload);
    logger.debug('[DEBUG] 0. 收到的 Payload:', { iv, encryptedData });

    // Info: (20251020 - Tzuhan) 1. 重新構造完全相同的 Challenge
    const derivationChallenge = `cafeca-key_encryption-${userId}-${derivationNonce}`;
    logger.debug('[DEBUG] 1. 解密 Challenge:', derivationChallenge);

    // Info: (20251020 - Tzuhan) 2. 觸發 FIDO2 驗證 (解鎖)
    const authentication = await fido2ClientService.startLogin({
      challenge: derivationChallenge,
      userVerification: 'required',
    });
    const signature = authentication.response.signature;
    logger.debug('[DEBUG] 2. 解密 Signature:', signature);

    // Info: (20251020 - Tzuhan) 3. 派生出完全相同的對稱加密金鑰
    const encryptionKeyMaterial = ethers.keccak256(ethers.toUtf8Bytes(signature));
    logger.debug('[DEBUG] 3a. 解密 Key Material (Keccak Hash):', encryptionKeyMaterial);
    const encryptionKey = new Uint8Array(ethers.getBytes(encryptionKeyMaterial));
    logger.debug('[DEBUG] 3b. 解密 AES Key (Uint8Array):', encryptionKey);

    // Info: (20251020 - Tzuhan) 4. 使用 Web Crypto API (AES-GCM) 解密私鑰
    logger.debug('[DEBUG] 4a. 解密 IV (Hex):', iv);
    logger.debug('[DEBUG] 4b. 解密 Encrypted Data (Hex):', encryptedData);

    const key = await window.crypto.subtle.importKey(
      'raw',
      encryptionKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // 將 Hex IV 和 Hex EncryptedData 轉回 Uint8Array
    const ivBytes = new Uint8Array(ethers.getBytes('0x' + iv));
    const encryptedBytes = new Uint8Array(ethers.getBytes('0x' + encryptedData));

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      encryptedBytes
    );
    logger.debug('[DEBUG] 4c. 解密後的 ArrayBuffer:', decrypted);

    // Info: (20251020 - Tzuhan) 5. 用解密出的私鑰創建 Wallet 物件並回傳
    const privateKey = ethers.hexlify(new Uint8Array(decrypted)); // 將 ArrayBuffer 轉為 Uint8Array 再轉為 Hex
    logger.debug('[DEBUG] 5. 解密後 Private Key:', privateKey);

    const wallet = new ethers.Wallet(privateKey);
    logger.debug('[DEBUG] 創建 Wallet 成功，地址:', wallet.address);
    return wallet;
  } catch (error) {
    logger.error('解密區塊鏈金鑰時失敗:', error);
    if (error instanceof Error && error.name === 'NotAllowedError') {
      throw new Error('使用者取消了 FIDO2 驗證操作。');
    }
    // 可以加入更詳細的錯誤判斷，例如解密失敗時的 Tag mismatch 錯誤
    if (error instanceof DOMException && error.name === 'OperationError') {
      logger.error(
        '[DEBUG] AES-GCM 解密失敗，很可能是因為金鑰不匹配 (簽章不一致?) 或密文/IV/Tag 被竄改。'
      );
    }
    throw error;
  } finally {
    logger.debug('[DEBUG] --- decryptAndUseBlockchainKey END ---');
  }
}
