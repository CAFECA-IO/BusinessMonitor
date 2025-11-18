'use client';

import { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import type { IdentityAccount } from '@prisma/client';
import { routes } from '@/config/api_routes';
import { logger } from '@/lib/logger';

interface IAuthContext {
  user: IdentityAccount | null;
  isLoading: boolean;
  login: (dewt: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext | undefined>(undefined);

interface IAuthProviderProps {
  children: ReactNode;
}

const origin = process.env.NEXT_PUBLIC_ORIGIN;
if (!origin) {
  throw new Error('NEXT_PUBLIC_ORIGIN is not set in the environment variables.');
}

export function AuthProvider({ children }: IAuthProviderProps) {
  const [user, setUser] = useState<IdentityAccount | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('dewt');
    setUser(null);
  }, []);

  const fetchUser = useCallback(
    async (dewt: string) => {
      try {
        const res = await fetch(`${origin}${routes.auth.me()}`, {
          headers: { Authorization: `Bearer ${dewt}` },
        });

        if (!res.ok) {
          const errorData = await res
            .json()
            .catch(() => ({ message: 'Token verification failed.' }));
          throw new Error(errorData.message);
        }

        const userData = await res.json();
        logger.debug(`Fetched user data: ${userData}`);
        setUser(userData.payload as IdentityAccount);
      } catch (error) {
        logger.warn(`Auth check/fetch failed, logging out. ${{ error: String(error) }}`);
        logout();
      }
    },
    [logout]
  );

  const checkAuthStatus = useCallback(async () => {
    setIsLoading(true);
    const dewt = localStorage.getItem('dewt');
    if (!dewt) {
      setIsLoading(false);
      return;
    }
    await fetchUser(dewt);
    setIsLoading(false);
  }, [fetchUser]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const refetchUser = useCallback(async () => {
    const dewt = localStorage.getItem('dewt');
    if (dewt) {
      setIsLoading(true);
      await fetchUser(dewt);
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = async (dewt: string) => {
    localStorage.setItem('dewt', dewt);
    await refetchUser();
  };

  const value = { user, isLoading, login, logout, refetchUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
