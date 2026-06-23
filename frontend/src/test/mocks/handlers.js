import { http, HttpResponse } from 'msw';

const API = 'http://localhost:3001/api';

// ── Datos de prueba compartidos ───────────────────────────────────────────────

export const mockProvince = {
  id: 'santo_domingo',
  name: 'Distrito Nacional',
  region: 'Sur',
  current: {
    temp_c: 31.2, feelslike_c: 33.0, humidity: 68,
    wind_kph: 22, pressure_mb: 1012, vis_km: 10,
    uv: 8, precip_mm: 0, cloud: 15,
    condition: { text: 'Despejado', icon: 'https://cdn.weatherapi.com/sun.png', code: 1000 },
  },
  forecast: [], alerts: [], lastUpdated: '2026-06-22T14:23:05.000Z',
};

export const mockProvinces = [
  mockProvince,
  { ...mockProvince, id: 'santiago',      name: 'Santiago',     current: { ...mockProvince.current, temp_c: 29.8 } },
  { ...mockProvince, id: 'la_vega',       name: 'La Vega',      current: { ...mockProvince.current, temp_c: 27.5, precip_mm: 8 } },
  { ...mockProvince, id: 'puerto_plata',  name: 'Puerto Plata', current: { ...mockProvince.current, temp_c: 28.3, wind_kph: 30 } },
];

export const mockAlertNormal = {
  level: 'normal', isEmergency: false,
  triggers: [], onaMetAlerts: [],
  activatedAt: null, lastChecked: '2026-06-22T14:23:05.000Z',
};

export const mockAlertEmergency = {
  level: 'emergency', isEmergency: true,
  triggers: [
    { source: 'WeatherAPI-Wind', province: 'Monte Cristi', windKph: 125, level: 'Huracán Categoría 1+' },
    { source: 'WeatherAPI-Wind', province: 'Puerto Plata', windKph: 95,  level: 'Tormenta Tropical' },
  ],
  onaMetAlerts: [{
    id: 'ONAMET-001', title: 'AVISO ESPECIAL Nº1: TORMENTA TROPICAL',
    description: 'Vientos sostenidos de 95 km/h afectando el territorio nacional.',
    type: 'tropical_storm', severity: 'emergency',
    affectedRegions: ['Norte', 'Nordeste', 'Sur'],
    issuedAt: '2026-06-22T12:00:00.000Z', source: 'ONAMET',
  }],
  activatedAt: '2026-06-22T12:45:00.000Z',
  lastChecked: '2026-06-22T14:23:05.000Z',
};

export const mockReport = {
  id: 'daily-1750601385000', type: 'daily',
  generatedAt: '2026-06-22T14:00:00.000Z', alertLevel: 'normal',
  summary: '📊 RESUMEN METEOROLÓGICO — REPÚBLICA DOMINICANA\nTemperatura promedio: 29.6°C',
  onaMetAlerts: [], triggers: [],
};

// ── Handlers por defecto (estado normal) ─────────────────────────────────────

export const handlers = [
  http.get(`${API}/weather`, () =>
    HttpResponse.json({ success: true, data: mockProvinces, count: mockProvinces.length })
  ),
  http.get(`${API}/alerts/status`, () =>
    HttpResponse.json({ success: true, data: mockAlertNormal })
  ),
  http.get(`${API}/reports/latest`, () =>
    HttpResponse.json({ success: true, data: mockReport })
  ),
  http.post(`${API}/reports/generate`, () =>
    HttpResponse.json({ success: true, data: mockReport })
  ),
];
