import { ethers } from 'ethers';

/**
 * 首次生成區塊鏈私鑰，並使用使用者提供的密碼對其進行加密。
 * @param password - 用於加密錢包的密碼。
 * @returns {Promise<{encryptedPrivateKey: string, publicKey: string, address: string}>}
 * 加密後的 JSON Keystore、公鑰和地址。
 */
export async function createAndEncryptBlockchainKey(password: string): Promise<{
  encryptedPrivateKey: string;
  publicKey: string;
  address: string;
}> {
  try {
    // 1. 生成一個全新的、真正隨機的以太坊錢包
    const wallet = ethers.Wallet.createRandom();

    // 2. 使用 ethers.js 的標準函式，以密碼加密私鑰
    //    第三個參數是可選的回呼函式，用於顯示進度
    const encryptedJson = await wallet.encrypt(password, (progress) => {
      console.log('Encrypting...', Math.round(progress * 100));
    });

    return {
      encryptedPrivateKey: encryptedJson, // 這是一個 JSON 字串
      publicKey: wallet.publicKey,
      address: wallet.address,
    };
  } catch (error) {
    console.error('生成並加密區塊鏈金鑰時失敗:', error);
    throw error;
  }
}

/**
 * 使用密碼解密已儲存的 JSON Keystore。
 * @param encryptedJson - 從後端獲取的加密 JSON Keystore 字串。
 * @param password - 用戶輸入的解密密碼。
 * @returns {Promise<ethers.Wallet | ethers.HDNodeWallet>} 解密後的 ethers.js Wallet 物件，可用於簽署。
 */
export async function decryptKeyWithPassword(
  encryptedJson: string,
  password: string
): Promise<ethers.Wallet | ethers.HDNodeWallet> {
  try {
    // 使用 ethers.js 的標準函式，從加密的 JSON 和密碼中恢復錢包
    const wallet = await ethers.Wallet.fromEncryptedJson(encryptedJson, password, (progress) => {
      console.log('Decrypting...', Math.round(progress * 100));
    });
    return wallet;
  } catch (error) {
    console.error('解密區塊鏈金鑰時失敗:', error);
    // ethers.js 在密碼錯誤時會拋出特定錯誤，可以進行更精細的處理
    if (error instanceof Error && error.message.includes('invalid password')) {
      throw new Error('錢包密碼錯誤。');
    }
    throw error;
  }
}
