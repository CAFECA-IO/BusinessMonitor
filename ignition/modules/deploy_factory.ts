import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';
import EntryPointModule from './deploy_entry_point';

// Info: (20251125 - Tzuhan) 定義 SCWFactory 部署模組
const SCWFactoryModule = buildModule('SCWFactoryModule', (m) => {
  // Info: (20251125 - Tzuhan) 1. 取得 EntryPoint 依賴
  // Info: (20251125 - Tzuhan) 確保 EntryPoint 先部署，並取得其地址
  const { entryPoint } = m.useModule(EntryPointModule);

  // Info: (20251125 - Tzuhan) 2. 部署 SCWFactory
  // Info: (20251125 - Tzuhan) 將固定的 EntryPoint 地址傳入 Factory 的建構子
  const factory = m.contract('SCWFactory', [entryPoint]);

  return { factory };
});

export default SCWFactoryModule;
