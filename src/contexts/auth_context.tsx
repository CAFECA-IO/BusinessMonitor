'use client';

import { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import type { IdentityAccount } from '@prisma/client';
import { routes } from '@/config/api-routes';
import { logger } from '@/lib/logger';

// Info: (20251014 - Tzuhan) 步驟 1: 定義 Context 將提供的資料結構
interface IAuthContext {
  user: IdentityAccount | null;
  isLoading: boolean;
  login: (dewt: string) => Promise<void>;
  logout: () => void;
}

// Info: (20251014 - Tzuhan) 建立 Context，並提供一個預設值
const AuthContext = createContext<IAuthContext | undefined>(undefined);

// Info: (20251014 - Tzuhan) 步驟 2: 建立 AuthProvider 組件
interface IAuthProviderProps {
  children: ReactNode;
}

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

export function AuthProvider({ children }: IAuthProviderProps) {
  const [user, setUser] = useState<IdentityAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Info: (20251014 - Tzuhan) 初始時為 true，因為需要檢查登入狀態

  // Info: (20251014 - Tzuhan) 定義登出邏輯，使用 useCallback 避免不必要的重新渲染
  const logout = useCallback(() => {
    localStorage.removeItem('dewt');
    setUser(null);
  }, []);

  // Info: (20251014 - Tzuhan) 在組件首次掛載時檢查 localStorage 中是否存在 DeWT
  useEffect(() => {
    const checkAuthStatus = async () => {
      const dewt = localStorage.getItem('dewt');
      if (!dewt) {
        setIsLoading(false);
        return;
      }

      try {
        // Info: (20251014 - Tzuhan) 呼叫 /api/v1/secure/me API 來驗證 token
        const res = await fetch(`${origin}${routes.auth.me()}`, {
          headers: {
            Authorization: `Bearer ${dewt}`,
          },
        });

        if (!res.ok) {
          throw new Error('Token verification failed.');
        }

        const userData: IdentityAccount = await res.json();
        setUser(userData); // Info: (20251014 - Tzuhan) 獲取成功後，更新 user 狀態
      } catch (error) {
        logger.warn('Auth check failed, logging out.', { error: String(error) });
        logout(); // Info: (20251014 - Tzuhan) 獲取失敗後（例如 token 過期），自動登出
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, [logout]);

  // Info: (20251014 - Tzuhan) 定義登入邏輯
  const login = async (dewt: string) => {
    setIsLoading(true);
    try {
      localStorage.setItem('dewt', dewt);
      const res = await fetch(`${origin}${routes.auth.me()}`, {
        headers: {
          Authorization: `Bearer ${dewt}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch user after login.');
      }

      const userData: IdentityAccount = await res.json();
      setUser(userData);
    } catch (error) {
      logger.error('Login process failed.', { error: String(error) });
      logout(); // Info: (20251014 - Tzuhan) 如果登入後獲取使用者資訊失敗，也執行登出
    } finally {
      setIsLoading(false);
    }
  };

  // Info: (20251014 - Tzuhan) 將 user, isLoading, login, logout 透過 Context Provider 傳遞
  const value = { user, isLoading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Info: (20251014 - Tzuhan) 步驟 3: 建立名為 useAuth 的自訂 Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
