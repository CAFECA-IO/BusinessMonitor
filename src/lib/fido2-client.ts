'use client';

// Info: (20250917 - Tzuhan) 從外部函式庫導入核心 client 物件和確切的類型
import { client } from '@passwordless-id/webauthn';
import type {
  RegisterOptions, // Info: (20250917 - Tzuhan) 用於註冊
  AuthenticateOptions, // Info: (20250917 - Tzuhan) 用於登入
  RegistrationJSON, // Info: (20250917 - Tzuhan) 註冊成功後的回應類型
  AuthenticationJSON, // Info: (20250917 - Tzuhan) 登入成功後的回應類型
} from '@passwordless-id/webauthn/dist/esm/types';

/**
 * Info: (20250917 - Tzuhan)啟動瀏覽器端的 FIDO2 註冊流程。
 * @param {RegisterOptions} options - 由我們後端 API 生成的註冊選項。
 * @returns {Promise<RegistrationJSON>} 返回一個 Promise，解析後為 RegistrationJSON 物件，需發送到後端進行驗證。
 */
export const startRegistration = async (options: RegisterOptions): Promise<RegistrationJSON> => {
  try {
    // Info: (20250917 - Tzuhan) 呼叫 client.register 並傳入完整的 options 物件
    const registration = await client.register(options);
    return registration;
  } catch (error) {
    // Info: (20250917 - Tzuhan) 統一處理錯誤，例如用戶點擊了「取消」
    console.error('FIDO2 Registration failed:', error);
    // Info: (20250917 - Tzuhan) 拋出錯誤，讓呼叫它的 UI 元件可以捕獲並顯示對應的錯誤訊息
    throw error;
  }
};

/**
 * Info: (20250917 - Tzuhan) 啟動瀏覽器端的 FIDO2 登入(認證)流程。
 * @param {AuthenticationOptions} options - 由我們後端 API 生成的登入選項。
 * @returns {Promise<AuthenticationJSON>} 返回一個 Promise，解析後為 AuthenticationJSON 物件，需發送到後端進行驗證。
 */
export const startLogin = async (options: AuthenticateOptions): Promise<AuthenticationJSON> => {
  try {
    // Info: (20250917 - Tzuhan) 根據 .d.ts 檔案，`authenticate` 函數接收一個單一的 options 物件
    const authentication = await client.authenticate(options);
    return authentication;
  } catch (error) {
    console.error('FIDO2 Authentication failed:', error);
    throw error;
  }
};
