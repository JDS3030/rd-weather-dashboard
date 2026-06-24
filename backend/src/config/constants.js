require('dotenv').config();

const RD_PROVINCES = [
  { id: 'distrito_nacional', name: 'Distrito Nacional',         query: 'Santo Domingo,DO',              region: 'Sur',           lat: 18.4861, lon: -69.9312 },
  { id: 'santiago',          name: 'Santiago',                   query: 'Santiago de los Caballeros,DO', region: 'Cibao Norte',   lat: 19.4517, lon: -70.6970 },
  { id: 'la_vega',           name: 'La Vega',                    query: 'La Vega,DO',                    region: 'Cibao Central', lat: 19.2217, lon: -70.5290 },
  { id: 'san_pedro',         name: 'San Pedro de Macorís',       query: 'San Pedro de Macoris,DO',       region: 'Yuma',          lat: 18.4539, lon: -69.2971 },
  { id: 'puerto_plata',      name: 'Puerto Plata',               query: 'Puerto Plata,DO',               region: 'Cibao Norte',   lat: 19.7944, lon: -70.6898 },
  { id: 'barahona',          name: 'Barahona',                   query: 'Barahona,DO',                   region: 'Enriquillo',    lat: 18.2036, lon: -71.1050 },
  { id: 'punta_cana',        name: 'La Altagracia (Punta Cana)', query: 'Punta Cana,DO',                 region: 'Yuma',          lat: 18.5601, lon: -68.3725 },
  { id: 'nagua',             name: 'María Trinidad Sánchez',     query: 'Nagua,DO',                      region: 'Nordeste',      lat: 19.3801, lon: -69.8479 },
  { id: 'san_juan',          name: 'San Juan de la Maguana',     query: 'San Juan de la Maguana,DO',     region: 'El Valle',      lat: 18.8065, lon: -71.2282 },
  { id: 'monte_cristi',      name: 'Monte Cristi',               query: 'Monte Cristi,DO',               region: 'Cibao Noroeste',lat: 19.8567, lon: -71.6505 },
  { id: 'bonao',             name: 'Monseñor Nouel (Bonao)',     query: 'Bonao,DO',                      region: 'Cibao Central', lat: 18.9409, lon: -70.4054 },
  { id: 'higuey',            name: 'El Seibo / Higüey',          query: 'Higuey,DO',                     region: 'Yuma',          lat: 18.6164, lon: -68.7071 },
  { id: 'dajabon',           name: 'Dajabón',                    query: 'Dajabon,DO',                    region: 'Cibao Noroeste',lat: 19.5474, lon: -71.7090 },
  { id: 'valverde',          name: 'Valverde',                   query: 'Mao,DO',                        region: 'Cibao Noroeste',lat: 19.5660, lon: -71.0739 },
  { id: 'santiago_rodriguez',name: 'Santiago Rodríguez',         query: 'Sabaneta,DO',                   region: 'Cibao Noroeste',lat: 19.4924, lon: -71.3416 },
];

// Palabras clave para detección automática de emergencias
const EMERGENCY_KEYWORDS = [
  'hurricane', 'huracán', 'huracan',
  'tropical storm', 'tormenta tropical',
  'tropical depression', 'depresión tropical',
  'flood warning', 'aviso de inundación', 'aviso de inundacion',
  'flash flood', 'inundación repentina',
  'cyclone', 'ciclón', 'ciclon',
  'severe thunderstorm warning',
  'aviso de tormenta severa',
];

const WEATHERAPI_BASE = 'http://api.weatherapi.com/v1';

// Umbrales de velocidad del viento (km/h)
const WIND_THRESHOLDS = {
  TROPICAL_STORM: 63,   // 39 mph — Tormenta Tropical
  HURRICANE_CAT1: 119,  // 74 mph — Huracán Categoría 1
};

const ALERT_LEVELS = {
  NORMAL:    'normal',
  WATCH:     'watch',
  WARNING:   'warning',
  EMERGENCY: 'emergency',
};

module.exports = { RD_PROVINCES, EMERGENCY_KEYWORDS, WEATHERAPI_BASE, WIND_THRESHOLDS, ALERT_LEVELS };
