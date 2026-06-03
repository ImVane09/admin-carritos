import { api } from '../config/api';

// --- Lecturas iniciales ---
export async function fetchUsers() {
  const { data } = await api.get('/users');
  return Array.isArray(data) ? data : data?.data || [];
}

export async function fetchTrips() {
  const { data } = await api.get('/trips');
  return Array.isArray(data) ? data : data?.data || [];
}

export async function fetchDrivers() {
  const { data } = await api.get('/users/drivers');
  return Array.isArray(data) ? data : data?.data || [];
}

export async function fetchDestinations() {
  const { data } = await api.get('/destinations');
  return Array.isArray(data) ? data : data?.data || [];
}

// --- CRUD de Usuarios (Conductores, Pasajeros, Admins) ---

/**
 * Crea un nuevo conductor en el backend
 * Requiere name, email, password en payload
 */
export async function createUserDriver(payload) {
  const { data } = await api.post('/users/drivers', payload);
  return data;
}

/**
 * Registra un nuevo pasajero llamando a la ruta de registro público con role_id 2
 * Requiere name, email, password, password_confirmation, role_id en payload
 */
export async function registerPassenger(payload) {
  const { data } = await api.post('/register', payload);
  return data;
}

/**
 * Modifica datos básicos de un usuario existente
 * Requiere id y payload con name, email
 */
export async function updateUser(id, payload) {
  const { data } = await api.put(`/users/${id}`, payload);
  return data;
}

/**
 * Alterna el estado activo (is_active) de un usuario en la base de datos
 */
export async function toggleUserStatus(id) {
  const { data } = await api.patch(`/users/${id}/toggle-status`);
  return data;
}

/**
 * Elimina o suspende un usuario de la base de datos
 */
export async function deleteUser(id) {
  const { data } = await api.delete(`/users/${id}`);
  return data;
}

/**
 * Restaura o reactiva un usuario suspendido (soft-deleted) en la base de datos
 */
export async function restoreUser(id) {
  const { data } = await api.post(`/users/${id}/restore`);
  return data;
}

// --- CRUD de Destinos ---

/**
 * Crea un nuevo destino en la base de datos
 * Requiere name, description, latitude, longitude, address en payload
 */
export async function createDestination(payload) {
  const { data } = await api.post('/destinations', payload);
  return data;
}

/**
 * Actualiza un destino existente
 * Requiere name, description, latitude, longitude, address en payload
 */
export async function updateDestination(id, payload) {
  const { data } = await api.put(`/destinations/${id}`, payload);
  return data;
}

/**
 * Elimina un destino de la base de datos
 */
export async function deleteDestination(id) {
  const { data } = await api.delete(`/destinations/${id}`);
  return data;
}

/**
 * Alterna el estado activo de un destino
 */
export async function toggleDestinationStatus(id) {
  const { data } = await api.patch(`/destinations/${id}/toggle-status`);
  return data;
}

/**
 * Restaura o reactiva un destino suspendido (soft-deleted) en la base de datos
 */
export async function restoreDestination(id) {
  const { data } = await api.post(`/destinations/${id}/restore`);
  return data;
}
