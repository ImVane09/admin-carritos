import { api } from '../config/api';

// --- Lecturas iniciales ---
export async function fetchUsers(params = {}) {
  const { data } = await api.get('/users', { params });
  return data;
}

export async function fetchAdmins(params = {}) {
  const { data } = await api.get('/users/admins', { params });
  return data;
}

export async function fetchTrips(params = {}) {
  const { data } = await api.get('/trips', { params });
  return data;
}

export async function fetchDrivers() {
  const { data } = await api.get('/users/drivers');
  return Array.isArray(data) ? data : data?.data || [];
}

export async function approveDriverDisconnect(id) {
  const { data } = await api.post(`/admin/driver/${id}/approve-disconnect`);
  return data;
}

export async function rejectDriverDisconnect(id) {
  const { data } = await api.post(`/admin/driver/${id}/reject-disconnect`);
  return data;
}

export async function fetchDisconnectRequests(params = {}) {
  const { data } = await api.get('/admin/disconnect-requests', { params });
  return data;
}

export async function fetchAllDrivers() {
  const { data } = await api.get('/dashboard/drivers');
  return data?.data || data || [];
}

export async function fetchDestinations(params = {}) {
  const { data } = await api.get('/destinations', { params });
  return data;
}

// --- CRUD de Eventos ---
export async function fetchEvents(params = {}) {
  const { data } = await api.get('/events', { params });
  return data;
}

export async function createEvent(payload) {
  const { data } = await api.post('/events', payload);
  return data;
}

export async function updateEvent(id, payload) {
  const { data } = await api.put(`/events/${id}`, payload);
  return data;
}

export async function deleteEvent(id) {
  const { data } = await api.delete(`/events/${id}`);
  return data;
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
 * Crea un nuevo administrador en el backend
 */
export async function createUserAdmin(payload) {
  const { data } = await api.post('/users/admins', payload);
  return data;
}

/**
 * Registra un nuevo pasajero desde el endpoint administrativo protegido.
 */
export async function registerPassenger(payload) {
  const { data } = await api.post('/users/passengers', payload);
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

export async function updateAdmin(id, payload) {
  const { data } = await api.put(`/users/admins/${id}`, payload);
  return data;
}

export async function toggleAdminStatus(id) {
  const { data } = await api.patch(`/users/admins/${id}/toggle-status`);
  return data;
}

export async function deleteAdmin(id) {
  const { data } = await api.delete(`/users/admins/${id}`);
  return data;
}

export async function fetchPermissions() {
  const { data } = await api.get('/permissions');
  return Array.isArray(data) ? data : data?.data || [];
}

/**
 * Elimina un usuario y conserva su registro histórico.
 */
export async function deleteUser(id) {
  const { data } = await api.delete(`/users/${id}`);
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
 * Obtiene las estadísticas resumidas del dashboard de forma eficiente
 */
export async function fetchDashboardStats(params = {}) {
  const { data } = await api.get('/dashboard/stats', { params });
  return data;
}

// --- CRUD de Vehículos (Carritos) ---

export async function fetchVehicles(params = {}) {
  const { data } = await api.get('/vehicles', { params });
  return data;
}

export async function createVehicle(payload) {
  const { data } = await api.post('/vehicles', payload);
  return data;
}

export async function updateVehicle(id, payload) {
  const { data } = await api.put(`/vehicles/${id}`, payload);
  return data;
}

export async function deleteVehicle(id) {
  const { data } = await api.delete(`/vehicles/${id}`);
  return data;
}

// --- Métricas e Informes Analíticos ---

/**
 * Obtiene el resumen de rendimiento de conductores para reportes
 */
export async function fetchDriversReport() {
  const { data } = await api.get('/reports/drivers-summary');
  return data;
}

/**
 * Obtiene el reporte de popularidad de destinos paradas
 */
export async function fetchDestinationsReport() {
  const { data } = await api.get('/reports/destinations-summary');
  return data;
}

/**
 * Obtiene el reporte de distribución horaria de viajes (horas pico)
 */
export async function fetchHourlyReport() {
  const { data } = await api.get('/reports/hourly-summary');
  return data;
}

/**
 * Obtiene el reporte de demanda diaria de viajes
 */
export async function fetchDailyReport() {
  const { data } = await api.get('/reports/daily-summary');
  return data;
}

/**
 * Obtiene el reporte de distribución de valoraciones de estrellas y comentarios recientes
 */
export async function fetchRatingsDistributionReport() {
  const { data } = await api.get('/reports/ratings-distribution');
  return data;
}

/**
 * Obtiene el reporte de tiempos de viaje por rutas comunes
 */
export async function fetchRoutesPerformanceReport() {
  const { data } = await api.get('/reports/routes-performance');
  return data;
}

/**
 * Obtiene el resumen consolidado de todas las métricas de reportes en una sola llamada de red
 */
export async function fetchReportsAllSummary(params = {}) {
  const { data } = await api.get('/reports/all-summary', { params });
  return data;
}

export async function fetchReportsDriversSummary(params = {}) {
  const { data } = await api.get('/reports/drivers-summary', { params });
  return data;
}

export async function fetchReportsPassengersSummary(params = {}) {
  const { data } = await api.get('/reports/passengers-summary', { params });
  return data;
}

export const fetchReportsRoutesPerformance = async (params = {}) => {
  try {
    const response = await api.get('/reports/routes-performance', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching routes performance:', error);
    throw error;
  }
};

export const fetchReportsTripsCoordinates = async (params = {}) => {
  try {
    const response = await api.get('/reports/trips-coordinates', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching trips coordinates:', error);
    throw error;
  }
};

export async function fetchReportsRoutesSummary(params = {}) {
  const { data } = await api.get('/reports/routes-details', { params });
  return data;
}

// --- CRUD de Horarios (Shifts) ---
export async function fetchShifts(params = {}) {
  const { data } = await api.get('/shifts', { params });
  return data;
}

export async function createShift(payload) {
  const { data } = await api.post('/shifts', payload);
  return data;
}

export async function updateShift(id, payload) {
  const { data } = await api.put(`/shifts/${id}`, payload);
  return data;
}

export async function deleteShift(id) {
  const { data } = await api.delete(`/shifts/${id}`);
  return data;
}

export async function toggleShiftStatus(id) {
  const { data } = await api.patch(`/shifts/${id}/toggle-status`);
  return data;
}


// --- CRUD de Asignaciones (Assignments) ---
export async function fetchAssignments(params = {}) {
  const { data } = await api.get('/assignments', { params });
  return data;
}

export async function createAssignment(payload) {
  const { data } = await api.post('/assignments', payload);
  return data;
}

export async function updateAssignment(id, payload) {
  const { data } = await api.put(`/assignments/${id}`, payload);
  return data;
}

export async function deleteAssignment(id) {
  const { data } = await api.delete(`/assignments/${id}`);
  return data;
}

export async function toggleAssignmentStatus(id) {
  const { data } = await api.patch(`/assignments/${id}/toggle-status`);
  return data;
}

// --- Quejas (Complaints) ---
export async function fetchComplaints(params = {}) {
  const { data } = await api.get('/complaints', { params });
  return data;
}

export async function updateComplaintStatus(id, status) {
  const { data } = await api.patch(`/complaints/${id}/status`, { status });
  return data;
}

export async function fetchAuditLogs(params = {}) {
  const { data } = await api.get('/audit-logs', { params });
  return data;
}

// --- Exportación de Reportes (CSV) ---

async function downloadReport(url, filename) {
  try {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Error al descargar el reporte:', error);
  }
}

export async function exportDriversReport(params) {
  const qs = new URLSearchParams(params).toString();
  await downloadReport(`/reports/export/drivers?${qs}`, 'reporte_conductores.csv');
}

export async function exportPassengersReport(params) {
  const qs = new URLSearchParams(params).toString();
  await downloadReport(`/reports/export/passengers?${qs}`, 'reporte_pasajeros.csv');
}

export async function exportRoutesReport(params) {
  const qs = new URLSearchParams(params).toString();
  await downloadReport(`/reports/export/routes?${qs}`, 'reporte_rutas.csv');
}
