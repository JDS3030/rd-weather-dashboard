import { useEffect, useRef, useState, useCallback } from 'react';
import { useWeatherData }   from '../hooks/useWeatherData';
import { useTheme }         from '../context/ThemeContext';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

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

// ── Icono SVG inline para provincias (círculo con temperatura) ────────────────
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

// ── Icono diamante para municipios (visualmente distinto de provincias) ────────
function makeMunIcon(L, color) {
  const s = 16, m = s / 2;
  return L.divIcon({
    html: `<div style="width:${s}px;height:${s}px">
      <svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
        <polygon points="${m},1.5 ${s-1.5},${m} ${m},${s-1.5} 1.5,${m}"
                 fill="${color}" stroke="white" stroke-width="1.5" opacity="0.92"/>
      </svg>
    </div>`,
    className:  '',
    iconSize:   [s, s],
    iconAnchor: [s / 2, s / 2],
  });
}

// ── Provincia más cercana a unas coordenadas (para zoom >= 10) ────────────────
function findNearestProvince(provinces, lat, lng) {
  let nearest = null, minDist = Infinity;
  for (const p of provinces) {
    if (p.lat == null || p.lon == null) continue;
    const d = (lat - p.lat) ** 2 + (lng - p.lon) ** 2;
    if (d < minDist) { minDist = d; nearest = p; }
  }
  return nearest;
}

// ── Renderiza marcadores de provincias ────────────────────────────────────────
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

// ── Renderiza marcadores de municipios (diamante pequeño) ─────────────────────
function renderMunicipalityMarkers(map, L, municipalities, colorBy) {
  return municipalities
    .filter(m => m.current && m.lat != null && m.lon != null)
    .map(m => {
      const temp  = m.current?.temp_c ?? null;
      const color = colorBy === 'alert' ? '#10b981' : tempColor(temp);
      const icon  = makeMunIcon(L, color);
      const marker = L.marker([m.lat, m.lon], { icon, zIndexOffset: -100 });

      const precip = m.current?.precip_mm;
      marker.bindTooltip(
        `<div style="font-family:system-ui;font-size:11px;min-width:115px;line-height:1.6">
          <strong>${m.name}</strong>
          <span style="display:block;font-size:9px;color:#94a3b8;margin-top:-2px">Municipio</span>
          <span style="font-size:13px;font-weight:700">${temp != null ? temp.toFixed(1) + '°C' : '—'}</span>
          ${precip > 0 ? `<br/><span style="font-size:9px;color:#60a5fa">🌧 ${precip.toFixed(1)} mm</span>` : ''}
          ${m.current?.condition?.text ? `<br/><span style="font-size:9px;color:#94a3b8">${m.current.condition.text}</span>` : ''}
        </div>`,
        { direction: 'top', offset: [0, -4] }
      );

      marker.addTo(map);
      return marker;
    });
}

// ── Componente MapView ────────────────────────────────────────────────────────
export default function MapView({ colorBy = 'temp', onSelectProvince }) {
  const { provinces, alertState } = useWeatherData();
  const { isDark }                = useTheme();
  const containerRef              = useRef(null);
  const mapRef                    = useRef(null);
  const munMarkersRef             = useRef([]);
  const provincesRef              = useRef(provinces);
  const showMunRef                = useRef(false);

  // Toggle persiste en localStorage
  const [showMunicipalities, setShowMunicipalities] = useState(
    () => localStorage.getItem('nuvigia-show-municipalities') === 'true'
  );
  // provinceId detectada al hacer zoom >= 10
  const [zoomProvinceId, setZoomProvinceId] = useState(null);
  // Datos cargados de municipios
  const [munData, setMunData] = useState([]);

  // Mantiene refs sincronizados
  useEffect(() => { provincesRef.current = provinces; }, [provinces]);
  useEffect(() => { showMunRef.current   = showMunicipalities; }, [showMunicipalities]);

  // Fuente efectiva: 'all' | provinceId | null
  const munSource = showMunicipalities ? 'all' : zoomProvinceId;

  // Alterna el toggle y, si se apaga con zoom >= 10, conserva la provincia del zoom
  const handleToggle = useCallback(() => {
    setShowMunicipalities(prev => {
      const next = !prev;
      localStorage.setItem('nuvigia-show-municipalities', String(next));
      if (!next && mapRef.current) {
        const { map } = mapRef.current;
        if (map.getZoom() >= 10) {
          const c    = map.getCenter();
          const near = findNearestProvince(provincesRef.current, c.lat, c.lng);
          setZoomProvinceId(near?.id ?? null);
        }
        // si zoom < 10, zoomProvinceId sigue siendo null → munSource = null
      }
      return next;
    });
  }, []);

  // Carga datos de municipios cuando cambia la fuente
  useEffect(() => {
    if (!munSource) { setMunData([]); return; }
    let cancelled = false;
    const url = munSource === 'all'
      ? `${API_URL}/municipalities/weather`
      : `${API_URL}/municipalities/weather/${munSource}`;

    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(json => { if (!cancelled) setMunData(json.data ?? []); })
      .catch(err => console.warn('[MapView] municipalities fetch failed:', err));

    return () => { cancelled = true; };
  }, [munSource]);

  // Inicializa el mapa una vez al montar; lo destruye al desmontar
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let isMounted = true;

    import('leaflet').then(({ default: L }) => {
      if (!isMounted || !container.isConnected) return;
      if (container._leaflet_id) return;

      const map = L.map(container, {
        center:           [18.7357, -70.1627],
        zoom:             8,
        zoomControl:      true,
        scrollWheelZoom:  true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      if (isDark) {
        const tilePane = map.getPanes().tilePane;
        if (tilePane) {
          tilePane.style.filter = 'invert(1) hue-rotate(180deg) brightness(0.85) contrast(0.9)';
        }
      }

      const markers = renderMarkers(map, L, provinces, alertState, colorBy, onSelectProvince);
      mapRef.current = { map, L, markers };

      // Detecta zoom >= 10 para activar municipios de la provincia más cercana
      map.on('zoomend moveend', () => {
        if (showMunRef.current) return; // toggle activo: el zoom no interfiere
        const z = map.getZoom();
        if (z >= 10) {
          const c    = map.getCenter();
          const near = findNearestProvince(provincesRef.current, c.lat, c.lng);
          setZoomProvinceId(near?.id ?? null);
        } else {
          setZoomProvinceId(null);
        }
      });
    });

    return () => {
      isMounted = false;
      if (mapRef.current?.map) {
        try { mapRef.current.map.remove(); } catch { /* ignorar errores de cleanup */ }
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Actualiza marcadores de provincias cuando cambian datos o modo de color
  useEffect(() => {
    if (!mapRef.current) return;
    const { map, L } = mapRef.current;
    mapRef.current.markers.forEach(m => { try { m.remove(); } catch {} });
    mapRef.current.markers = renderMarkers(map, L, provinces, alertState, colorBy, onSelectProvince);
  }, [provinces, alertState, colorBy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Actualiza marcadores de municipios cuando cambian los datos cargados
  useEffect(() => {
    if (!mapRef.current) return;
    const { map, L } = mapRef.current;
    munMarkersRef.current.forEach(m => { try { m.remove(); } catch {} });
    munMarkersRef.current = munData.length
      ? renderMunicipalityMarkers(map, L, munData, colorBy)
      : [];
  }, [munData, colorBy]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full">
      {/* ── Botón toggle de municipios ─────────────────────────────────────── */}
      <button
        onClick={handleToggle}
        title={showMunicipalities ? 'Ocultar municipios' : 'Ver municipios (también al hacer zoom ≥ 10)'}
        style={{
          position:        'absolute',
          top:             10,
          right:           10,
          zIndex:          1000,
          display:         'flex',
          alignItems:      'center',
          gap:             '6px',
          padding:         '5px 11px',
          borderRadius:    '8px',
          fontSize:        '12px',
          fontWeight:      '600',
          cursor:          'pointer',
          border:          '1px solid',
          boxShadow:       '0 2px 6px rgba(0,0,0,0.25)',
          transition:      'all 0.15s',
          backgroundColor: showMunicipalities ? '#4f46e5' : (isDark ? '#1f2937' : '#ffffff'),
          color:           showMunicipalities ? '#ffffff' : (isDark ? '#e5e7eb' : '#374151'),
          borderColor:     showMunicipalities ? '#4338ca' : (isDark ? '#374151' : '#d1d5db'),
        }}
      >
        {/* Icono diamante representando la capa de municipios */}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <polygon points="5,0.5 9.5,5 5,9.5 0.5,5"/>
        </svg>
        Municipios
      </button>

      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-gray-700"
        style={{ height: 440 }}
      />
    </div>
  );
}
