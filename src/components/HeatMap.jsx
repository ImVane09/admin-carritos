import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [-0.9525, -80.7450]; // Campus ESPAM

function toNumber(value) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function HeatMap({ points = [], center = DEFAULT_CENTER }) {
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

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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

    points.forEach((point) => {
      const latitude = toNumber(point.lat);
      const longitude = toNumber(point.lng);

      if (latitude === null || longitude === null) {
        return;
      }

      // Creamos un marcador circular rojo y semi transparente para emular el heatmap
      L.circleMarker([latitude, longitude], {
        radius: 12, // Radio del punto
        fillColor: "#ef4444", // Rojo intenso
        color: "transparent", // Sin borde duro
        weight: 0,
        fillOpacity: 0.15 // Baja opacidad para que al superponerse sumen color
      }).addTo(layer);
      
      bounds.push([latitude, longitude]);
    });

    if (bounds.length > 0 && !hasCenteredRef.current) {
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 17 });
      hasCenteredRef.current = true;
    }
  }, [points]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: '350px',
        height: '100%',
        borderRadius: '1rem',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
      }}
    />
  );
}
