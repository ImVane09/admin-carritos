import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [-0.9525, -80.7450];

const baseMarkerIcon = L.divIcon({
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#e53935;border:2px solid #fff;box-shadow:0 0 0 2px rgba(229,57,53,.18);"></div>',
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const selectedMarkerIcon = L.divIcon({
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#1976d2;border:3px solid #fff;box-shadow:0 0 0 2px rgba(25,118,210,.18);"></div>',
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function toNumber(value) {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function DestinationMapPicker({ value, destinations = [], onChange, center }) {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const selectedMarkerRef = useRef(null);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return undefined;
    }

    const initialCenter = Array.isArray(center) && center.length === 2 ? center : DEFAULT_CENTER;
    const map = L.map(mapElementRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: false,
    }).setView(initialCenter, 16);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; CartoDB',
    }).addTo(map);

    map.on('click', (event) => {
      onChange?.({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    });

    mapRef.current = map;

    return () => {
      map.off();
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
      selectedMarkerRef.current = null;
    };
  }, [center, onChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => map.removeLayer(marker));
    markersRef.current = [];

    destinations.forEach((destination) => {
      const latitude = toNumber(destination.latitude ?? destination.lat);
      const longitude = toNumber(destination.longitude ?? destination.lng);

      if (latitude === null || longitude === null) {
        return;
      }

      const marker = L.marker([latitude, longitude], { icon: baseMarkerIcon })
        .addTo(map)
        .bindPopup(destination.name || 'Destino');

      markersRef.current.push(marker);
    });
  }, [destinations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const latitude = toNumber(value?.latitude);
    const longitude = toNumber(value?.longitude);

    if (selectedMarkerRef.current) {
      map.removeLayer(selectedMarkerRef.current);
      selectedMarkerRef.current = null;
    }

    if (latitude === null || longitude === null) {
      return;
    }

    selectedMarkerRef.current = L.marker([latitude, longitude], { icon: selectedMarkerIcon }).addTo(map);
    map.panTo([latitude, longitude], { animate: true, duration: 0.5 });
  }, [value?.latitude, value?.longitude]);

  useEffect(() => {
    if (!mapRef.current) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 120);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div
        ref={mapElementRef}
        style={{
          width: '100%',
          height: '260px',
          borderRadius: '10px',
          overflow: 'hidden',
          border: '1px solid #dfe4ea',
        }}
      />
      <small style={{ color: 'var(--text-secondary)' }}>
        Haz clic sobre el mapa para fijar el punto o escribe las coordenadas manualmente.
      </small>
    </div>
  );
}