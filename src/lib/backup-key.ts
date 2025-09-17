import { hash, compare } from 'bcryptjs';

export const generateBackupKey = (): string => {
  // Info: (20250917 - Tzuhan) 生成一個簡單的、易於讀寫的備份碼
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const hashBackupKey = async (backupKey: string): Promise<string> => {
  const saltRounds = 10;
  return hash(backupKey, saltRounds);
};

export const verifyBackupKey = async (backupKey: string, hash: string): Promise<boolean> => {
  return compare(backupKey, hash);
};
