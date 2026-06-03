import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { CARRITO_MARKER_BASE64 } from './carritoMarkerBase64';

const DEFAULT_CENTER = [-0.9525, -80.7450];

// Icono personalizado con la imagen real del carrito (golf cart)
const driverIcon = L.icon({
  iconUrl: CARRITO_MARKER_BASE64,
  iconSize: [38, 38], // Tamaño adecuado para visibilidad premium
  iconAnchor: [19, 19], // Anclar al centro del carrito
  popupAnchor: [0, -19],
});

const destinationIcon = L.divIcon({
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#f57c00;border:2px solid #fff;box-shadow:0 0 0 2px rgba(245,124,0,.16);"></div>',
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function toNumber(value) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function DashboardLiveMap({ drivers = [], destinations = [], center = DEFAULT_CENTER }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return undefined;
    }

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: false,
    }).setView(center, 16);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB',
    }).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 120);

    return () => {
      window.clearTimeout(timer);
      map.off();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;

    if (!map || !layer) {
      return;
    }

    layer.clearLayers();

    const bounds = [];

    destinations.forEach((destination) => {
      const latitude = toNumber(destination.latitude ?? destination.lat);
      const longitude = toNumber(destination.longitude ?? destination.lng);

      if (latitude === null || longitude === null) {
        return;
      }

      L.marker([latitude, longitude], { icon: destinationIcon })
        .addTo(layer)
        .bindPopup(destination.name || destination.nombre || 'Destino');
      bounds.push([latitude, longitude]);
    });

    drivers.forEach((driver) => {
      const latitude = toNumber(driver.latitude ?? driver.lat);
      const longitude = toNumber(driver.longitude ?? driver.lng);

      if (latitude === null || longitude === null) {
        return;
      }

      L.marker([latitude, longitude], { icon: driverIcon })
        .addTo(layer)
        .bindPopup(`<strong>${driver.name || 'Conductor'}</strong><br/>${driver.is_online ? 'En línea' : 'Sin ubicación'}`);
      bounds.push([latitude, longitude]);
    });

    // Ajustar la cámara automáticamente solo la primera vez que se cargan elementos
    if (bounds.length > 0 && !hasCenteredRef.current) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 17 });
      hasCenteredRef.current = true;
    }
  }, [drivers, destinations]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: '440px',
        height: '100%',
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
      }}
    />
  );
}