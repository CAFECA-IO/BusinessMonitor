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
  try {
    // Info: (20251020 - Tzuhan) 1. 生成一個全新的、真正隨機的以太坊錢包
    const wallet = ethers.Wallet.createRandom();

    // Info: (20251020 - Tzuhan) 2. 構造包含 "cafeca" 前綴和意圖的 Challenge
    const nonce = ethers.hexlify(ethers.randomBytes(32));
    const derivationChallenge = `cafeca-key_encryption-${userId}-${nonce}`;

    // Info: (20251020 - Tzuhan) 3. 觸發 FIDO2 簽章
    const authentication = await fido2ClientService.startLogin({
      challenge: derivationChallenge,
      userVerification: 'required',
    });
    const signature = authentication.response.signature;

    // Info: (20251020 - Tzuhan) 4. 使用 Keccak256 將簽章轉換為一個 32 位元組的對稱加密金鑰
    const encryptionKeyMaterial = ethers.keccak256(ethers.toUtf8Bytes(signature));
    const encryptionKey = new Uint8Array(ethers.getBytes(encryptionKeyMaterial));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

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
      new Uint8Array(ethers.getBytes(wallet.privateKey))
    );

    // Info: (20251020 - Tzuhan) 6. 組合加密結果以便儲存
    const encryptedPayload = {
      iv: ab2hex(iv.buffer),
      encryptedData: ab2hex(encrypted),
    };

    return {
      encryptedPrivateKey: JSON.stringify(encryptedPayload),
      publicKey: wallet.publicKey,
      address: wallet.address,
      derivationNonce: nonce,
    };
  } catch (error) {
    console.error('生成並加密區塊鏈金鑰時失敗:', error);
    if (error instanceof Error && error.name === 'NotAllowedError') {
      throw new Error('使用者取消了 FIDO2 驗證操作。');
    }
    throw error;
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
  try {
    const { iv, encryptedData } = JSON.parse(encryptedPrivateKeyPayload);

    // Info: (20251020 - Tzuhan) 1. 重新構造完全相同的 Challenge
    const derivationChallenge = `cafeca-key_encryption-${userId}-${derivationNonce}`;

    // Info: (20251020 - Tzuhan) 2. 觸發 FIDO2 驗證 (解鎖)
    const authentication = await fido2ClientService.startLogin({
      challenge: derivationChallenge,
      userVerification: 'required',
    });
    const signature = authentication.response.signature;

    // Info: (20251020 - Tzuhan) 3. 派生出完全相同的對稱加密金鑰
    const encryptionKeyMaterial = ethers.keccak256(ethers.toUtf8Bytes(signature));
    const encryptionKey = new Uint8Array(ethers.getBytes(encryptionKeyMaterial));

    // Info: (20251020 - Tzuhan) 4. 使用 Web Crypto API (AES-GCM) 解密私鑰
    const key = await window.crypto.subtle.importKey(
      'raw',
      encryptionKey,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(ethers.getBytes('0x' + iv)) },
      key,
      new Uint8Array(ethers.getBytes('0x' + encryptedData))
    );

    // Info: (20251020 - Tzuhan) 5. 用解密出的私鑰創建 Wallet 物件並回傳
    const privateKey = ethers.hexlify(new Uint8Array(decrypted));
    return new ethers.Wallet(privateKey);
  } catch (error) {
    console.error('解密區塊鏈金鑰時失敗:', error);
    if (error instanceof Error && error.name === 'NotAllowedError') {
      throw new Error('使用者取消了 FIDO2 驗證操作。');
    }
    throw error;
  }
}
