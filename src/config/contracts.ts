import { Address, parseAbi } from 'viem';

export const ORIGIN = process.env.NEXT_PUBLIC_ORIGIN;
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.isuncoin.com';
// Info: (20251216 - Tzuhan) 從 Ignition 部署檔獲取的地址 (Chain 8017)
// 建議: 若專案設定允許引用 src 外部檔案，可直接 import JSON；否則在此定義常量
export const CONTRACT_ADDRESSES = {
  ENTRY_POINT: (process.env.NEXT_PUBLIC_ENTRY_POINT_ADDRESS || '') as Address,
  FACTORY: (process.env.NEXT_PUBLIC_SCW_FACTORY_ADDRESS || '') as Address,
  SCW: (process.env.NEXT_PUBLIC_SCW_ADDRESS || '') as Address,
} as const;

export const ABIS = {
  ENTRY_POINT: parseAbi([
    'struct UserOperation { address sender; uint256 nonce; bytes initCode; bytes callData; uint256 callGasLimit; uint256 verificationGasLimit; uint256 preVerificationGas; uint256 maxFeePerGas; uint256 maxPriorityFeePerGas; bytes paymasterAndData; bytes signature; }',
    'function handleOps(UserOperation[] calldata ops, address payable beneficiary)',
    'function getNonce(address sender, uint192 key) external view returns (uint256 nonce)',
    'function getUserOpHash((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) userOp) external view returns (bytes32)',
    'function getSenderAddress(bytes calldata initCode) external view returns (address)',
    'error FailedOp(uint256 opIndex, string reason)',
  ]),
  FACTORY: parseAbi([
    'function getAddress(uint256 pubKeyX, uint256 pubKeyY, uint256 salt) external view returns (address)',
  ]),
  SCW: parseAbi([
    'function signers(bytes32 hash) view returns (bool)',
    'function addSigner(uint256 x, uint256 y) external',
    'function removeSigner(uint256 x, uint256 y) external',
    'function execute(address dest, uint256 value, bytes func) external',
  ]),
};
