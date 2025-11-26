import { encodeFunctionData, concat, type Hex, type Address } from 'viem';

/**
 * Info: (20251126 - Tzuhan) Factory ABI
 * 只包含我們需要的 createAccount 和 getAddress
 */
export const factoryAbi = [
  {
    inputs: [
      { name: 'pubKeyX', type: 'uint256' },
      { name: 'pubKeyY', type: 'uint256' },
      { name: 'salt', type: 'uint256' },
    ],
    name: 'createAccount',
    outputs: [{ name: 'ret', type: 'address' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'pubKeyX', type: 'uint256' },
      { name: 'pubKeyY', type: 'uint256' },
      { name: 'salt', type: 'uint256' },
    ],
    name: 'getAddress',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Info: (20251126 - Tzuhan) 產生 ERC-4337 initCode
 * initCode = FactoryAddress (20 bytes) + FunctionCallData
 */
export function getInitCode(
  factoryAddress: Address,
  pubKeyX: bigint,
  pubKeyY: bigint,
  salt: bigint = BigInt(0)
): Hex {
  if (!factoryAddress) throw new Error('Factory address is required');

  const factoryData = encodeFunctionData({
    abi: factoryAbi,
    functionName: 'createAccount',
    args: [pubKeyX, pubKeyY, salt],
  });

  return concat([factoryAddress, factoryData]);
}
