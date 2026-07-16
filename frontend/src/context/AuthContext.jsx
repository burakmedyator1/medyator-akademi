import { createContext, useContext, useState, useCallback } from 'react';
import { api, setToken, getToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('medyator_user');
    return raw ? JSON.parse(raw) : null;
  });

  const persist = useCallback((token, userData) => {
    setToken(token);
    localStorage.setItem('medyator_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await api.login({ email, password });
      persist(data.token, data.user);
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const data = await api.register(payload);
      persist(data.token, data.user);
    },
    [persist]
  );

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem('medyator_user');
    setUser(null);
  }, []);

  const isAuthenticated = Boolean(user && getToken());

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  return ctx;
}
