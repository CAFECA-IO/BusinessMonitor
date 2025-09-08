import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

const envFile = path.resolve(process.cwd(), '.env');
const sampleFile = path.resolve(process.cwd(), '.env.example');
// Info: (20250904 - Luphia) 檢查是否有 .env 檔案，若無則複製 .env.sample
if (!fs.existsSync(envFile) && fs.existsSync(sampleFile)) {
  fs.copyFileSync(sampleFile, envFile);
}

// Info: (20250904 - Luphia) 讀取現有內容
let envContent = fs.readFileSync(envFile, 'utf-8');

// Info: (20250904 - Luphia) 確保有 UUID，否則生成一個並放在檔案開頭
if (!/^UUID=.*$/m.test(envContent)) {
  // Info: (20250904 - Luphia) randomUUID 需使用 Node.js 14.17.0 以上版本
  const uuid = crypto.randomUUID();
  envContent = `UUID=${uuid}\n` + envContent;
  fs.writeFileSync(envFile, envContent);
}
