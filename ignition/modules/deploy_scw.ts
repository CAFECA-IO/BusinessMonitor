import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import EntryPointModule from './deploy_entry_point';
import 'dotenv/config';

const SCWModule = buildModule('SCWModule', (m) => {
  const { entryPoint } = m.useModule(EntryPointModule);

  // Info: (20251120 - Tzuhan) 改為從環境變數讀取公鑰，避免 Hardcoding
  const pubKeyX = process.env.SCW_OWNER_PUBLIC_KEY_X;
  const pubKeyY = process.env.SCW_OWNER_PUBLIC_KEY_Y;

  if (!pubKeyX || !pubKeyY) {
    throw new Error(
      '❌ 錯誤：請在 .env 檔案中設定 SCW_OWNER_PUBLIC_KEY_X 和 SCW_OWNER_PUBLIC_KEY_Y'
    );
  }

  console.log('正在部署 SCW...');
  console.log('使用擁有者公鑰 X:', pubKeyX);
  console.log('使用擁有者公鑰 Y:', pubKeyY);

  const scw = m.contract('SCW', [entryPoint, pubKeyX, pubKeyY]);

  return { scw };
});

export default SCWModule;
