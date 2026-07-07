import { useEffect, useRef } from 'react';
import { useWeatherData }   from '../hooks/useWeatherData';
import { useTheme }         from '../context/ThemeContext';

// ── Paleta de temperatura (azul frío → rojo caliente) ─────────────────────────
function tempColor(temp) {
  if (temp == null) return '#6b7280';
  if (temp < 22)   return '#60a5fa';
  if (temp < 26)   return '#34d399';
  if (temp < 29)   return '#fbbf24';
  if (temp < 32)   return '#f97316';
  return '#ef4444';
}

function alertColor(hasAlert, level) {
  if (!hasAlert)             return '#10b981';
  if (level === 'emergency') return '#dc2626';
  if (level === 'warning')   return '#ea580c';
  if (level === 'watch')     return '#ca8a04';
  return '#10b981';
}

// ── Animación de pulso (inyectada una sola vez en document.head) ──────────────
let pulseStyleInjected = false;
function injectPulseStyle() {
  if (pulseStyleInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'nuvigia-map-animations';
  style.textContent =
    '@keyframes nuvigia-pulse{0%{transform:scale(0.7);opacity:0.9}80%{transform:scale(2.4);opacity:0}100%{transform:scale(2.4);opacity:0}}' +
    '.nuvigia-pulse-ring{position:absolute;inset:0;border-radius:50%;border:3px solid transparent;animation:nuvigia-pulse 2s ease-out infinite;transform-origin:center;pointer-events:none;box-sizing:border-box;}';
  document.head.appendChild(style);
  pulseStyleInjected = true;
}

// ── Icono SVG inline (evita dependencias de imágenes externas) ────────────────
function makeIcon(L, color, temp, hasAlert) {
  if (hasAlert) injectPulseStyle();
  const size = hasAlert ? 34 : 28;
  const r    = hasAlert ? size / 2 - 6 : size / 2 - 2;
  const svg  = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}"
              fill="${color}" stroke="white" stroke-width="1.5" opacity="0.92"/>
      <text x="${size/2}" y="${size/2 + 4}" text-anchor="middle"
            font-family="system-ui,sans-serif" font-size="${hasAlert ? 9 : 8}"
            font-weight="700" fill="white">
        ${temp != null ? temp.toFixed(0) + '°' : '?'}
      </text>
    </svg>`;
  const pulseRing = hasAlert
    ? `<div class="nuvigia-pulse-ring" style="border-color:${color};"></div>`
    : '';
  return L.divIcon({
    html:       `<div style="position:relative;width:${size}px;height:${size}px">${pulseRing}${svg}</div>`,
    className:  '',
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// ── Renderiza marcadores de provincias en el mapa ─────────────────────────────
function renderMarkers(map, L, provinces, alertState, colorBy, onSelectProvince) {
  return provinces.map(p => {
    if (p.lat == null || p.lon == null) return null;

    const temp     = p.current?.temp_c ?? null;
    const level    = alertState?.level ?? 'normal';
    const hasAlert = !!(alertState?.triggers?.some(t => t.province === p.name));
    const color    = colorBy === 'alert' ? alertColor(hasAlert, level) : tempColor(temp);

    const icon   = makeIcon(L, color, temp, hasAlert);
    const marker = L.marker([p.lat, p.lon], { icon });

    marker.bindTooltip(
      `<div style="font-family:system-ui;font-size:12px;min-width:120px;line-height:1.5">
        <strong>${p.name}</strong><br/>
        <span style="color:#94a3b8;font-size:10px">${p.region ?? ''}</span><br/>
        <span style="font-size:14px;font-weight:700">${temp != null ? temp.toFixed(1) + '°C' : '—'}</span>
        ${p.current?.condition?.text ? `<br/><span style="font-size:10px;color:#94a3b8">${p.current.condition.text}</span>` : ''}
        ${hasAlert ? '<br/><span style="color:#ef4444;font-size:10px;font-weight:700">⚠️ Alerta activa</span>' : ''}
      </div>`,
      { direction: 'top', offset: [0, -6] }
    );

    if (onSelectProvince) marker.on('click', () => onSelectProvince(p));
    marker.addTo(map);
    return marker;
  }).filter(Boolean);
}

// ── Componente MapView ────────────────────────────────────────────────────────
export default function MapView({ colorBy = 'temp', onSelectProvince }) {
  const { provinces, alertState } = useWeatherData();
  const { isDark }                = useTheme();
  const containerRef              = useRef(null);
  const mapRef                    = useRef(null);

  // Inicializa el mapa una vez al montar; lo destruye al desmontar
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMounted = true;

    import('leaflet').then(({ default: L }) => {
      // Abortar si el componente se desmontó antes de que resolviera el import
      if (!isMounted || !container.isConnected) return;
      // Abortar si Leaflet ya inicializó este contenedor (HMR / doble render)
      if (container._leaflet_id) return;

      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

      const map = L.map(container, {
        center:           [18.7357, -70.1627],
        zoom:             8,
        zoomControl:      true,
        scrollWheelZoom:  true,
        attributionControl: false,
      });

      L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(map);
      const markers = renderMarkers(map, L, provinces, alertState, colorBy, onSelectProvince);
      mapRef.current = { map, L, markers };
    });

    return () => {
      isMounted = false;
      if (mapRef.current?.map) {
        try { mapRef.current.map.remove(); } catch { /* ignorar errores de cleanup */ }
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Actualiza marcadores cuando cambian datos o modo de color
  useEffect(() => {
    if (!mapRef.current) return;
    const { map, L } = mapRef.current;

    mapRef.current.markers.forEach(m => { try { m.remove(); } catch {} });
    mapRef.current.markers = renderMarkers(map, L, provinces, alertState, colorBy, onSelectProvince);
  }, [provinces, alertState, colorBy]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700"
      style={{ height: 440 }}
    />
  );
}
