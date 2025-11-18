import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

// Info: (20251118 - Tzuhan) 步驟 1: 匯入剛剛部署 EntryPoint 用的模組
// Info: (20251118 - Tzuhan) 這會告訴 Ignition，SCW "依賴" EntryPoint
import EntryPointModule from './deploy_entry_point';

const SCWModule = buildModule('SCWModule', (m) => {
  // Info: (20251118 - Tzuhan) 步驟 2: 取得部署者的錢包地址 (作為 _owner 參數)
  const owner = m.getAccount(0);

  // Info: (20251118 - Tzuhan) 步驟 3: 從 EntryPoint 模組中，取得已部署的合約實例
  // Info: (20251118 - Tzuhan) Ignition 會自動傳入 EntryPoint 的地址
  const { entryPoint } = m.useModule(EntryPointModule);

  // Info: (20251118 - Tzuhan) 步驟 4: 定義第 3 個參數 (_value)
  const value = 123n; // Info: (20251118 - Tzuhan) 123 (n 代表它是 BigInt/uint256)

  // Info: (20251118 - Tzuhan) 步驟 5: 呼叫合約，並傳入三個參數
  const scw = m.contract('SCW', [
    entryPoint, // Info: (20251118 - Tzuhan) 參數 1: EntryPoint 地址
    owner, // Info: (20251118 - Tzuhan) 參數 2: 錢包地址
    value, // Info: (20251118 - Tzuhan) 參數 3: 數字
  ]);

  return { scw };
});

export default SCWModule;
