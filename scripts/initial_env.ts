import { promises as fs } from 'fs';
import crypto from 'crypto';
import path from 'path';
import { generateKeyPair, exportPKCS8 } from 'jose';

/**
 * Info: (20250925 - Tzuhan) 【更新】確保環境變數存在且有值。如果不存在或值為空，則會移除舊行並添加新行。
 * @param content - 當前的 .env 文件內容
 * @param key - 要檢查的變數名
 * @param valueFn - 一個回傳變數值的函式
 * @returns 更新後的 .env 文件內容
 */
async function ensureEnvVar(
  content: string,
  key: string,
  valueFn: () => string | Promise<string>
): Promise<string> {
  // Info: (20250925 - Tzuhan) 正則表達式現在檢查 key 後面是否至少有一個字符 (.+)
  const hasKeyWithNonEmptyValue = new RegExp(`^${key}=.+$`, 'm');

  // Info: (20250925 - Tzuhan) 如果變數已存在且有值，直接返回，不做任何操作。
  if (hasKeyWithNonEmptyValue.test(content)) {
    return content;
  }

  // Info: (20250925 - Tzuhan) 如果代碼執行到這裡，表示 key 不存在或其值為空。
  // 我們先移除可能存在的無效行 (例如 DEWT_PRIVATE_KEY_PEM=)。
  const contentWithoutKey = content.replace(new RegExp(`^${key}=.*\n?`, 'm'), '');

  console.log(`  -> Setting or updating environment variable: ${key}`);

  let newContent = contentWithoutKey;
  if (newContent.length > 0 && !newContent.endsWith('\n')) {
    newContent += '\n';
  }
  const value = await valueFn();
  return `${newContent}${key}=${value}\n`;
}

/**
 * Info: (20250925 - Tzuhan) 生成 ES256 金鑰對並回傳格式化後的 PEM 私鑰。
 */
async function generateFormattedPrivateKey(): Promise<string> {
  // Info: (20250925 - Tzuhan) 【修正】新增 { extractable: true } 選項，允許私鑰被匯出。
  const { privateKey } = await generateKeyPair('ES256', { extractable: true });
  const pem = await exportPKCS8(privateKey);
  return `"${pem.replace(/\n/g, '\\n')}"`;
}

async function initializeEnv() {
  console.log('Checking .env file for CAFECA Digital ID setup...');
  const envFile = path.resolve(process.cwd(), '.env');
  const sampleFile = path.resolve(process.cwd(), '.env.example');
  let originalContent = '';

  try {
    originalContent = await fs.readFile(envFile, 'utf-8');
  } catch {
    try {
      await fs.copyFile(sampleFile, envFile);
      originalContent = await fs.readFile(envFile, 'utf-8');
      console.log('Initialized .env from .env.example.');
    } catch {
      console.log('No .env or .env.example found. A new .env file will be created.');
    }
  }

  let modifiedContent = originalContent;

  modifiedContent = await ensureEnvVar(modifiedContent, 'UUID', () => crypto.randomUUID());
  modifiedContent = await ensureEnvVar(
    modifiedContent,
    'NEXT_PUBLIC_ORIGIN',
    () => '"http://localhost:3000"'
  );
  modifiedContent = await ensureEnvVar(
    modifiedContent,
    'ENCRYPTION_KEY',
    () => `"${crypto.randomBytes(32).toString('base64url')}"`
  );
  modifiedContent = await ensureEnvVar(
    modifiedContent,
    'DEWT_PRIVATE_KEY_PEM',
    generateFormattedPrivateKey
  );

  const hasJwtSecret = /^JWT_SECRET=.*$/m.test(modifiedContent);
  if (modifiedContent.trim() !== originalContent.trim() || hasJwtSecret) {
    if (hasJwtSecret) {
      modifiedContent = modifiedContent.replace(/^JWT_SECRET=.*\n?/m, '');
      console.log('  -> Removed obsolete JWT_SECRET.');
    }

    await fs.writeFile(envFile, modifiedContent.trim(), 'utf-8');
    console.log('.env file has been updated successfully.');
  } else {
    console.log('.env file is already up to date. No changes were made.');
  }

  if (!/^DATABASE_URL=.*$/m.test(modifiedContent)) {
    console.warn('\n[!] IMPORTANT: Please manually set your DATABASE_URL in the .env file.');
  }
}

initializeEnv().catch((error) => {
  console.error('An error occurred during .env initialization:', error);
  process.exit(1);
});
