import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginRequest, meRequest } from '../services/authService';

const AuthContext = createContext(null);

function clearStoredSession() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

function normalizeAuthPayload(payload, fallbackToken = null) {
  const token = payload?.token || payload?.access_token || fallbackToken;
  const userSource = payload?.user || payload;
  return {
    user: {
      ...userSource,
      token,
    },
    token,
  };
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    error?.message ||
    'Error de autenticacion'
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('admin_token');
      const cachedUser = localStorage.getItem('admin_user');

      if (token && cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          clearStoredSession();
        }
      }

      if (token) {
        try {
          const current = await meRequest();
          const normalized = normalizeAuthPayload(current, token);
          setUser(normalized.user);
          localStorage.setItem('admin_token', normalized.token);
          localStorage.setItem('admin_user', JSON.stringify(normalized.user));
        } catch {
          clearStoredSession();
          setUser(null);
        }
      }

      setLoading(false);
    };

    bootstrap();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await loginRequest({ email, password });
      const normalized = normalizeAuthPayload(data);

      if (!normalized.token) {
        throw new Error('No se recibio token de autenticacion');
      }

      setUser(normalized.user);
      localStorage.setItem('admin_token', normalized.token);
      localStorage.setItem('admin_user', JSON.stringify(normalized.user));

      return { success: true, user: normalized.user };
    } catch (error) {
      clearStoredSession();
      setUser(null);
      return { success: false, error: getErrorMessage(error) };
    }
  };

  const logout = () => {
    clearStoredSession();
    setUser(null);
  };

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return ctx;
}
