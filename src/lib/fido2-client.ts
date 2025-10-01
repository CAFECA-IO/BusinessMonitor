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
 * Info: (20251001-tzuhan)
 * 封裝 FIDO2 WebAuthn 客戶端邏輯的單例服務。
 * 透過 isAvailable() 方法檢查 WebAuthn 功能是否可用。
 */
class Fido2ClientService {
  private client: typeof client | null;

  constructor() {
    // Info: (20251001-tzuhan) 在建構函式中立即檢查 client 是否存在
    this.client = client ?? null;
  }

  /**
   * Info: (20251001-tzuhan) 檢查 WebAuthn 是否在此環境中可用
   * (例如，在不安全的來源上，client 會是 null)
   * @returns {boolean}
   */
  public isAvailable(): boolean {
    return this.client !== null;
  }

  private getClientOrThrow(): typeof client {
    if (!this.client) {
      throw new Error(
        'WebAuthn is not available in this browser or context (e.g., non-secure origin).'
      );
    }
    return this.client;
  }

  /**
   * Info: (20250917 - Tzuhan) 啟動 FIDO2 註冊流程。
   * @param options - 從伺服器獲取的註冊選項。
   * @returns {Promise<RegistrationEncoded>} 註冊成功後的憑證資訊。
   */
  public async startRegistration(options: RegisterOptions): Promise<RegistrationJSON> {
    const client = this.getClientOrThrow();
    try {
      const registration = await client.register(options);
      console.log('FIDO2 Registration successful:', registration);
      return registration;
    } catch (error) {
      console.error('FIDO2 Registration failed:', error);
      throw error;
    }
  }

  /**
   * Info: (20250917 - Tzuhan) 啟動 FIDO2 登入流程。
   * @param options - 從伺服器獲取的登入選項。
   * @returns {Promise<AuthenticationEncoded>} 登入成功後的驗證資訊。
   */
  public async startLogin(options: AuthenticateOptions): Promise<AuthenticationJSON> {
    const client = this.getClientOrThrow();
    try {
      const authentication = await client.authenticate(options);
      return authentication;
    } catch (error) {
      console.error('FIDO2 Authentication failed:', error);
      throw error;
    }
  }
}

// Info: (20251001-tzuhan) 導出單例實例，確保整個應用程式只使用一個 Fido2ClientService
export const fido2ClientService = new Fido2ClientService();
