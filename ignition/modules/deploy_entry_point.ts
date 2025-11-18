import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

// Info: (20251118 - Tzuhan) 定義 EntryPoint 部署模組
const EntryPointModule = buildModule('EntryPointModule', (m) => {
  // Info: (20251118 - Tzuhan) 部署 EntryPoint 合約
  const entryPoint = m.contract('EntryPointImportHelper');

  // Info: (20251118 - Tzuhan) 將合約實例回傳，讓其他模組可以使用
  return { entryPoint };
});

export default EntryPointModule;
