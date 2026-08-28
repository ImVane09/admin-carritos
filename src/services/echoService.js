import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

/**
 * Crea e inicializa una instancia de Laravel Echo configurada para Reverb
 * @param {string} token - Token de autenticación del administrador
 * @returns {Echo} Instancia de Laravel Echo
 */
export const createEcho = (token) => {
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  
  // Extraer el host (ej. '192.168.1.2' de 'http://192.168.1.2:8000/api')
  let host = 'localhost';
  try {
    host = apiBaseUrl.split('://')[1].split(':')[0];
  } catch (error) {
    console.error('Error al parsear el host de VITE_API_URL, usando localhost por defecto:', error);
  }

  const reverbKey = import.meta.env.VITE_REVERB_APP_KEY || 'app-key';
  const reverbPort = Number(import.meta.env.VITE_REVERB_PORT || 8080);
  const forceTLS = (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https';

  return new Echo({
    broadcaster: 'reverb',
    key: reverbKey,
    wsHost: host,
    wsPort: reverbPort,
    wssPort: reverbPort,
    forceTLS,
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${apiBaseUrl}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });
};
