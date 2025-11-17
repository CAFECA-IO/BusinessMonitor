import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

/**
 * @dev
 * 這個模組使用 Hardhat Ignition 來部署 EntryPoint 合S
 * "EntryPoint" 是合約的名稱 (來自編譯後的 artifact)，
 * 而不是 .sol 檔案的名稱。
 */
const EntryPointModule = buildModule('EntryPointModule', (m) => {
  // m.contract() 會部署 "EntryPoint" 合約
  const entryPoint = m.contract('EntryPointImportHelper');

  // 我們將部署後的合約實例回傳，
  // Ignition 會自動記錄它的地址。
  return { entryPoint };
});

export default EntryPointModule;
