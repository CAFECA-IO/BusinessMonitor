/**
 * Info: (20250926 - Tzuhan) 備份碼相關的核心函式庫
 * - 負責生成使用者易於讀寫的備份碼，以及對其進行安全的雜湊與驗證。
 */
import { randomBytes, createHash, timingSafeEqual } from 'crypto';

const BACKUP_KEY_LENGTH_BYTES = 16; // 16 bytes = 128 bits of entropy
const BACKUP_KEY_CHUNK_SIZE = 4;

/**
 * Info: (20250926 - Tzuhan) 生成一個對使用者友善、密碼學安全的備份碼。
 * - 使用 crypto.randomBytes 確保隨機性。
 * - 格式：XXXX-XXXX-XXXX-XXXX
 * @returns {string} 使用者可讀的備份碼。
 */
export function generateBackupKey(): string {
  const bytes = randomBytes(BACKUP_KEY_LENGTH_BYTES);
  const hex = bytes.toString('hex').toUpperCase();
  const chunks: string[] = [];
  for (let i = 0; i < hex.length; i += BACKUP_KEY_CHUNK_SIZE) {
    chunks.push(hex.substring(i, i + BACKUP_KEY_CHUNK_SIZE));
  }
  return chunks.join('-');
}

/**
 * Info: (20250926 - Tzuhan) 對使用者輸入的備份碼進行標準化處理。
 * - 移除所有非字母數字字元並轉為大寫，使其對格式不敏感。
 * @param {string} key - 使用者輸入的備份碼。
 * @returns {string} 標準化後的金鑰。
 */
function normalizeKey(key: string): string {
  return key.replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

/**
 * Info: (20250926 - Tzuhan) 對標準化後的備份碼進行 SHA-256 雜湊。
 * @param {string} normalizedKey - 經過 normalizeKey 處理的備份碼。
 * @returns {Buffer} 雜湊後的 Buffer 物件。
 */
function sha256(normalizedKey: string): Buffer {
  return createHash('sha256').update(normalizedKey).digest();
}

/**
 * Info: (20250926 - Tzuhan) 對使用者輸入的備份碼進行雜湊，以便儲存至資料庫。
 * @param {string} key - 使用者輸入的備份碼。
 * @returns {Promise<string>} 雜湊後的備份碼 (hex 格式)。
 */
export async function hashBackupKey(key: string): Promise<string> {
  const normalized = normalizeKey(key);
  return sha256(normalized).toString('hex');
}

/**
 * Info: (20250926 - Tzuhan) 【新增】安全地驗證使用者輸入的備份碼與資料庫中的雜湊值。
 * - 使用 timingSafeEqual 防止時序攻擊。
 * @param {string} plainKey - 使用者在恢復流程中輸入的明文備份碼。
 * @param {string} storedHashHex - 從資料庫中讀取的、以 hex 格式儲存的雜湊值。
 * @returns {Promise<boolean>} 如果備份碼有效，則回傳 true。
 */
export async function verifyBackupKey(plainKey: string, storedHashHex: string): Promise<boolean> {
  try {
    const normalized = normalizeKey(plainKey);
    const inputHash = sha256(normalized);
    const storedHash = Buffer.from(storedHashHex, 'hex');

    // Info: (20250926 - Tzuhan) 確保兩個 buffer 長度相同，並使用時序安全的方式進行比較
    return inputHash.length === storedHash.length && timingSafeEqual(inputHash, storedHash);
  } catch (error) {
    // Info: (20250926 - Tzuhan) 如果 storedHashHex 不是有效的 hex 字串，Buffer.from 會拋出錯誤
    console.error('Error verifying backup key:', error);
    return false;
  }
}
