// Datos de prueba compartidos para todos los tests del backend

const makeProvince = (overrides = {}) => ({
  id: 'santo_domingo',
  name: 'Distrito Nacional',
  region: 'Sur',
  lat: 18.4861,
  lon: -69.9312,
  current: {
    temp_c: 31.2,
    feelslike_c: 33.0,
    humidity: 68,
    wind_kph: 22,
    wind_dir: 'E',
    pressure_mb: 1012,
    vis_km: 10,
    uv: 8,
    precip_mm: 0,
    cloud: 15,
    condition: { text: 'Despejado', icon: 'https://cdn.weatherapi.com/sun.png', code: 1000 },
  },
  forecast: [],
  alerts: [],
  lastUpdated: '2026-06-22T14:23:05.000Z',
  ...overrides,
});

const PROVINCES_NORMAL = [
  makeProvince({ id: 'santo_domingo', name: 'Distrito Nacional' }),
  makeProvince({ id: 'santiago',      name: 'Santiago',          current: { ...makeProvince().current, temp_c: 29.8 } }),
  makeProvince({ id: 'la_vega',       name: 'La Vega',           current: { ...makeProvince().current, temp_c: 27.5, precip_mm: 12 } }),
];

const PROVINCE_HURRICANE_WIND = makeProvince({
  id: 'monte_cristi',
  name: 'Monte Cristi',
  current: { ...makeProvince().current, wind_kph: 125 },
});

const PROVINCE_TROPICAL_STORM_WIND = makeProvince({
  id: 'puerto_plata',
  name: 'Puerto Plata',
  current: { ...makeProvince().current, wind_kph: 75 },
});

const PROVINCE_HURRICANE_CONDITION = makeProvince({
  id: 'nagua',
  name: 'Nagua',
  current: {
    ...makeProvince().current,
    condition: { text: 'Hurricane conditions', icon: '...', code: 1087 },
  },
});

const PROVINCE_WEATHERAPI_ALERT = makeProvince({
  id: 'puerto_plata',
  name: 'Puerto Plata',
  alerts: [{ event: 'Hurricane Warning', desc: 'Category 1 Hurricane approaching the coast' }],
});

const PROVINCE_TROPICAL_STORM_TEXT = makeProvince({
  id: 'santiago',
  name: 'Santiago',
  current: {
    ...makeProvince().current,
    condition: { text: 'Tormenta tropical intensa', icon: '...', code: 1087 },
  },
});

const ONAMET_EMERGENCY_ALERT = {
  id: 'ONAMET-EMG-001',
  title: 'AVISO ESPECIAL Nº1: TORMENTA TROPICAL',
  description: 'Vientos de 95 km/h afectando el territorio nacional.',
  type: 'tropical_storm',
  severity: 'emergency',
  affectedRegions: ['Norte', 'Nordeste'],
  issuedAt: '2026-06-22T12:00:00.000Z',
  source: 'ONAMET',
};

const ONAMET_WARNING_ALERT = {
  ...ONAMET_EMERGENCY_ALERT,
  severity: 'warning',
  title: 'AVISO: Vigilancia costera',
};

const ONAMET_WATCH_ALERT = {
  ...ONAMET_EMERGENCY_ALERT,
  severity: 'watch',
  title: 'VIGILANCIA: Sistema de baja presión',
};

module.exports = {
  makeProvince,
  PROVINCES_NORMAL,
  PROVINCE_HURRICANE_WIND,
  PROVINCE_TROPICAL_STORM_WIND,
  PROVINCE_HURRICANE_CONDITION,
  PROVINCE_WEATHERAPI_ALERT,
  PROVINCE_TROPICAL_STORM_TEXT,
  ONAMET_EMERGENCY_ALERT,
  ONAMET_WARNING_ALERT,
  ONAMET_WATCH_ALERT,
};
