import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';

/**
 * Info: (20250911 - Tzuhan) 確保環境變數存在於文件內容中，如果不存在則附加。
 * @param content - 當前的 .env 文件內容
 * @param key - 要檢查的變數名
 * @param valueFn - 一個回傳變數值的函式（延遲執行以提高效率）
 * @returns 更新後的 .env 文件內容
 */
function ensureEnvVar(content: string, key: string, valueFn: () => string): string {
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (!regex.test(content)) {
    console.log(`  -> Adding missing environment variable: ${key}`);
    // Info: (20250911 - Tzuhan)  確保內容以換行符結尾，以便附加
    if (content.length > 0 && !content.endsWith('\n')) {
      content += '\n';
    }
    return `${content}${key}=${valueFn()}\n`;
  }
  return content;
}

async function initializeEnv() {
  console.log('Checking .env file for CAFECA Digital ID setup...');
  const envFile = path.resolve(process.cwd(), '.env');
  const sampleFile = path.resolve(process.cwd(), '.env.example');
  let originalContent = '';

  // Info: (20250911 - Tzuhan) 只讀取一次檔案，並處理檔案不存在的情況
  try {
    originalContent = await fs.readFile(envFile, 'utf-8');
  } catch (error) {
    // Info: (20250911 - Tzuhan) 如果 .env 不存在，嘗試從 .env.example 複製
    try {
      await fs.copyFile(sampleFile, envFile);
      originalContent = await fs.readFile(envFile, 'utf-8');
      console.log('Initialized .env from .env.example.');
    } catch {
      console.log('No .env or .env.example found. A new .env file will be created.');
    }
  }

  let modifiedContent = originalContent;

  // Info: (20250917 - Tzuhan) --- 確保所有必要的變數都存在 ---

  // Info: (20250917 - Tzuhan) 1. 通用應用程式變數
  modifiedContent = ensureEnvVar(modifiedContent, 'UUID', () => crypto.randomUUID());

  // Info: (20250917 - Tzuhan) 2. FIDO2 / WebAuthn 相關變數
  //    - NEXT_PUBLIC_ORIGIN 是 FIDO2 安全模型的核心，用於驗證請求來源。
  //    - NEXT_PUBLIC_ 前綴讓此變數在 Next.js 前端也能被讀取。
  modifiedContent = ensureEnvVar(
    modifiedContent,
    'NEXT_PUBLIC_ORIGIN',
    () => 'http://localhost:3000'
  );

  // Info: (20250917 - Tzuhan)3. 安全與加密金鑰
  //    - JWT_SECRET 用於簽發和驗證 DeWT (JWT)，是 API 安全的基礎。
  modifiedContent = ensureEnvVar(modifiedContent, 'JWT_SECRET', () =>
    crypto.randomBytes(32).toString('base64url')
  );

  //    - ENCRYPTION_KEY 用於在資料庫中加密敏感資料（如以太坊私鑰）。
  modifiedContent = ensureEnvVar(modifiedContent, 'ENCRYPTION_KEY', () =>
    crypto.randomBytes(32).toString('base64url')
  );

  // Info: (20250911 - Tzuhan) 只在內容有變動時才寫入檔案
  if (modifiedContent !== originalContent) {
    await fs.writeFile(envFile, modifiedContent, 'utf-8');
    console.log('.env file has been updated successfully.');
  } else {
    console.log('.env file is already up to date. No changes were made.');
  }

  // Info: (20250911 - Tzuhan) 檢查 DATABASE_URL 是否存在，如果不存在則給予提醒
  if (!/^DATABASE_URL=.*$/m.test(modifiedContent)) {
    console.warn('\n[!] IMPORTANT: Please manually set your DATABASE_URL in the .env file.');
  }
}

// Info: (20250911 - Tzuhan) 執行主函式
initializeEnv().catch((error) => {
  console.error('An error occurred during .env initialization:', error);
  process.exit(1);
});
