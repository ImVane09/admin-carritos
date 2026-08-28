# Carritos — panel administrativo

Panel web para la operación, monitoreo y análisis del sistema de transporte. Está construido con React, Vite, React Router, PrimeReact, Leaflet y Laravel Echo/Reverb.

## Requisitos e instalación

```bash
cd admin-carritos
npm install
cp .env.example .env
```

Configura `VITE_API_URL` con la URL del backend. Para probar el panel desde otro equipo, utiliza la IP del servidor en lugar de `localhost`.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `VITE_API_URL` | URL base de la API, incluyendo `/api`. |
| `VITE_REVERB_APP_KEY` | Clave pública de Reverb. |
| `VITE_REVERB_PORT` | Puerto de WebSockets. |
| `VITE_REVERB_SCHEME` | `http` o `https`, según el entorno. |

Los mapas usan mosaicos de OpenStreetMap y no requieren una API key de Google o CARTO. Debe conservarse la atribución visible del mapa.

## Ejecución

```bash
npm run dev
```

El servidor Vite utiliza el puerto `5175` y escucha en todas las interfaces de red.

## Build y calidad

```bash
npm run build
npm run lint
npm run preview
```

El build genera `dist/`, que es un artefacto local y no debe versionarse.

## Módulos

- `src/pages`: dashboard, reportes, usuarios y gestión administrativa.
- `src/components`: mapas, tablas, tarjetas, modales y componentes de reportes.
- `src/services`: autenticación, operaciones administrativas y Echo.
- `src/context`: sesión y usuario actual.
- `src/layout`: estructura visual y navegación del panel.
- `src/config`: cliente Axios, interceptor JWT y configuración de API.
- `src/styles`: tema, estilos generales y gestión.

## Seguridad y permisos

El panel utiliza JWT en peticiones API y oculta módulos según permisos. La autorización real siempre debe validarse en el backend; la protección de React solo mejora la experiencia de navegación y no constituye un control de seguridad suficiente.

El token se conserva actualmente en `localStorage` para mantener la sesión del navegador. En un despliegue público debe evaluarse una estrategia con cookies seguras, protección XSS y renovación controlada de tokens.

## Flujo de tiempo real

El dashboard escucha actualizaciones de ubicación de conductores, estadísticas y solicitudes de desconexión a través de Laravel Reverb. El backend y el panel deben utilizar el mismo host, puerto, clave y esquema de Reverb.
