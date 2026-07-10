import { api } from '../config/api';

export async function loginRequest(credentials) {
  const response = await api.post('/login', credentials);
  return response.data;
}

export async function meRequest() {
  const response = await api.get('/me');
  return response.data;
}

export function getRole(user) {
  return (
    user?.role ||
    user?.rol?.rol_name ||
    user?.rol?.name ||
    ''
  ).toLowerCase();
}
