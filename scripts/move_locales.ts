import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Info: (20250808 - Julian) 用 import.meta.url 取得目前檔案的路徑
const __filename = fileURLToPath(import.meta.url);
// Info: (20250808 - Julian) 用 path.dirname 取得目前檔案所在的目錄
const __dirname = path.dirname(__filename);

// Info: (20250808 - Julian) i18n 來源目錄 (i18nexus 預設：根目錄)
const sourceDir = path.join(__dirname, '../locales');
// Info: (20250808 - Julian) 目標目錄 (/src)
const targetDir = path.join(__dirname, '../src/locales');

function copyDirSync(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    let destName = entry.name;

    // Info: (20250808 - Julian) 將預設的 zh 改成 tw
    if (destName === 'zh') {
      destName = 'tw';
    }

    const destPath = path.join(dest, destName);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function removeDirSync(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// Info: (20250808 - Julian) 執行搬移
removeDirSync(targetDir);
copyDirSync(sourceDir, targetDir);
console.log(`Locales moved from ${sourceDir} to ${targetDir} with 'zh' → 'tw' rename.`);

// Info: (20250808 - Julian) 刪除原本 public/locales
removeDirSync(sourceDir);
