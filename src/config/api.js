import axios from 'axios';

// Obtener la URL de la API del entorno o usar localhost por defecto
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 segundos
});

// --- Deduplicación de peticiones concurrentes GET ---
const pendingRequests = new Map();
const originalGet = api.get;

api.get = function (url, config) {
  const key = `${url}_${JSON.stringify(config?.params || {})}`;
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }
  const promise = originalGet.call(this, url, config)
    .finally(() => {
      pendingRequests.delete(key);
    });
  pendingRequests.set(key, promise);
  return promise;
};

// Interceptor de Peticiones: Adjuntar token Bearer de forma automática
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de Respuestas: Manejo de tokens vencidos o accesos no autorizados (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);
