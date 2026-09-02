import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginRequest, meRequest, refreshRequest } from '../services/authService';

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

function getTokenExpiration(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
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
          const parsedUser = JSON.parse(cachedUser);
          const role = (parsedUser.role || '').toLowerCase();
          const roleId = parsedUser.role_id;

          const hasPermissions = Array.isArray(parsedUser.permissions) && parsedUser.permissions.length > 0;

          if (role !== 'admin' && role !== 'administrador' && roleId !== 1 && !hasPermissions) {
            clearStoredSession();
            setUser(null);
          } else {
            setUser(parsedUser);
          }
        } catch {
          clearStoredSession();
        }
      }

      if (token) {
        try {
          const current = await meRequest();
          const normalized = normalizeAuthPayload(current, token);
          const role = (normalized.user.role || '').toLowerCase();
          const roleId = normalized.user.role_id;

          const hasPermissions = Array.isArray(normalized.user.permissions) && normalized.user.permissions.length > 0;

          if (role !== 'admin' && role !== 'administrador' && roleId !== 1 && !hasPermissions) {
            console.warn('Acceso denegado: El usuario no tiene rol ni permisos suficientes.');
            clearStoredSession();
            setUser(null);
          } else {
            setUser(normalized.user);
            localStorage.setItem('admin_token', normalized.token);
            localStorage.setItem('admin_user', JSON.stringify(normalized.user));
          }
        } catch (error) {
          console.error('Error al recuperar sesión durante el inicio:', error);
          if (error?.response?.status === 401) {
            clearStoredSession();
            setUser(null);
          }
        }
      }

      setLoading(false);
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    const refreshIfNeeded = async () => {
      const token = localStorage.getItem('admin_token');
      const expiration = token && getTokenExpiration(token);
      if (!expiration || expiration - Date.now() > 10 * 60 * 1000) return;

      try {
        const normalized = normalizeAuthPayload(await refreshRequest(), token);
        setUser(normalized.user);
        localStorage.setItem('admin_token', normalized.token);
        localStorage.setItem('admin_user', JSON.stringify(normalized.user));
      } catch (error) {
        if (error?.response?.status === 401) {
          clearStoredSession();
          setUser(null);
        }
      }
    };

    const interval = window.setInterval(refreshIfNeeded, 60 * 1000);
    refreshIfNeeded();
    return () => window.clearInterval(interval);
  }, [user]);

  const login = async (email, password) => {
    try {
      const data = await loginRequest({ email, password });
      const normalized = normalizeAuthPayload(data);

      if (!normalized.token) {
        throw new Error('No se recibió el token de autenticación');
      }

      const role = (normalized.user.role || '').toLowerCase();
      const roleId = normalized.user.role_id;

      const hasPermissions = Array.isArray(normalized.user.permissions) && normalized.user.permissions.length > 0;

      if (role !== 'admin' && role !== 'administrador' && roleId !== 1 && !hasPermissions) {
        throw new Error('Acceso denegado. Este panel requiere rol de administrador o permisos específicos asignados.');
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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider.');
  return ctx;
}
