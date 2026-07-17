import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/api/client';
import { getToken, setToken, getStoredUser, setStoredUser } from '@/api/storage';

export type Role = 'student' | 'instructor' | 'admin';

export type User = {
  id: number;
  email: string;
  name: string;
  role: Role;
  instructorId?: number;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: any) => Promise<User>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * frontend/src/context/AuthContext.jsx mantığının mobil karşılığı.
 * Fark: SecureStore async olduğu için başlangıçta bir yükleme (loading)
 * durumu var ve persist/login/logout async.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Uygulama açılışında saklı oturumu geri yükle.
  useEffect(() => {
    (async () => {
      try {
        const [stored, token] = await Promise.all([getStoredUser<User>(), getToken()]);
        if (stored && token) setUser(stored);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (token: string, userData: User) => {
    await setToken(token);
    await setStoredUser(userData);
    setUser(userData);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.login({ email, password });
      await persist(data.token, data.user);
      return data.user as User;
    },
    [persist]
  );

  const register = useCallback(
    async (payload: any) => {
      const data = await api.register(payload);
      await persist(data.token, data.user);
      return data.user as User;
    },
    [persist]
  );

  const logout = useCallback(async () => {
    await setToken(null);
    await setStoredUser(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, isAuthenticated: Boolean(user) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  return ctx;
}
