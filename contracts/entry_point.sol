// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * Info: (20251118 - Tzuhan)
 * 這個檔案的目的，是為了強制 Hardhat 在執行 'compile' 時，
 * 能夠找到並編譯 node_modules 裡的 EntryPoint 合約，
 * 這樣 Ignition 才能取得它生成的 artifact (合約 ABI 和 bytecode)。
 */
import "@account-abstraction/contracts/core/EntryPoint.sol";

contract EntryPointImportHelper is EntryPoint {
    constructor() EntryPoint() {}
}

