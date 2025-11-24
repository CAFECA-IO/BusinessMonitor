import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import EntryPointModule from './deploy_entry_point';
import 'dotenv/config';

const SCWModule = buildModule('SCWModule', (m) => {
  const { entryPoint } = m.useModule(EntryPointModule);

  // Info: (20251121 - Tzuhan) [流程說明] 1. 讀取用戶身分
  // 這裡是將用戶手機 Passkey 的公鑰 (X, Y) 寫入合約的「出廠設定」。
  // 這確保了只有擁有對應私鑰 (手機) 的人，才能控制這個合約。
  // SCW_FACTORY 完成後會移除這些參數，確保安全性。
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

  // Info: (20251121 - Tzuhan) [資金流向] 部署階段
  // 部署這個合約的 Gas 費用是由執行此腳本的帳戶 (Relayer/Deployer) 支付的。
  // 此時 SCW 還沒產生，所以還不會扣 SCW 的錢。
  const scw = m.contract('SCW', [entryPoint, pubKeyX, pubKeyY]);

  return { scw };
});

export default SCWModule;
