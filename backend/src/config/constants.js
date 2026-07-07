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
  { id: 'higuey',            name: 'El Seibo',                    query: 'El Seibo,DO',                   region: 'Yuma',          lat: 18.7654, lon: -69.0318 },
  { id: 'dajabon',           name: 'Dajabón',                    query: 'Dajabon,DO',                    region: 'Cibao Noroeste',lat: 19.5474, lon: -71.7090 },
  { id: 'valverde',          name: 'Valverde',                   query: 'Mao,DO',                        region: 'Cibao Noroeste',lat: 19.5660, lon: -71.0739 },
  { id: 'santiago_rodriguez',name: 'Santiago Rodríguez',         query: 'Sabaneta,DO',                   region: 'Cibao Noroeste',lat: 19.4924, lon: -71.3416 },
  // Norte — provincias completadas
  { id: 'espaillat',         name: 'Espaillat',                  query: 'Moca,DO',                       region: 'Cibao Norte',   lat: 19.3953, lon: -70.5192 },
  { id: 'sanchez_ramirez',   name: 'Sánchez Ramírez',            query: 'Cotui,DO',                      region: 'Cibao Central', lat: 18.9966, lon: -70.0975 },
  { id: 'duarte',            name: 'Duarte',                     query: 'San Francisco de Macoris,DO',   region: 'Nordeste',      lat: 19.3007, lon: -69.8514 },
  { id: 'samana',            name: 'Samaná',                     query: 'Samana,DO',                     region: 'Nordeste',      lat: 19.2064, lon: -69.3360 },
  // Este — provincias completadas
  { id: 'la_romana',         name: 'La Romana',                  query: 'La Romana,DO',                  region: 'Yuma',          lat: 18.4273, lon: -68.9726 },
  { id: 'hato_mayor',        name: 'Hato Mayor',                 query: 'Hato Mayor del Rey,DO',         region: 'Yuma',          lat: 18.7640, lon: -69.2562 },
  { id: 'monte_plata',       name: 'Monte Plata',                query: 'Monte Plata,DO',                region: 'Valdesia',      lat: 18.8066, lon: -69.7863 },
  // Sur — provincias completadas
  { id: 'santo_domingo',     name: 'Santo Domingo',              query: 'Santo Domingo Este,DO',         region: 'Valdesia',      lat: 18.5058, lon: -69.8690 },
  { id: 'san_cristobal',     name: 'San Cristóbal',              query: 'San Cristobal,DO',              region: 'Valdesia',      lat: 18.4173, lon: -70.1064 },
  { id: 'peravia',           name: 'Peravia',                    query: 'Bani,DO',                       region: 'Valdesia',      lat: 18.2800, lon: -70.3317 },
  { id: 'azua',              name: 'Azua',                       query: 'Azua de Compostela,DO',         region: 'El Valle',      lat: 18.4554, lon: -70.7352 },
  { id: 'elias_pina',        name: 'Elías Piña',                 query: 'Comendador,DO',                 region: 'El Valle',      lat: 18.8782, lon: -71.6966 },
  { id: 'baoruco',           name: 'Baoruco',                    query: 'Neiba,DO',                      region: 'Enriquillo',    lat: 18.4839, lon: -71.4178 },
  { id: 'independencia',     name: 'Independencia',              query: 'Jimani,DO',                     region: 'Enriquillo',    lat: 18.4924, lon: -71.8517 },
  { id: 'san_jose_ocoa',     name: 'San José de Ocoa',           query: 'San Jose de Ocoa,DO',           region: 'Valdesia',      lat: 18.5541, lon: -70.5096 },
  { id: 'pedernales',        name: 'Pedernales',                 query: 'Pedernales,DO',                 region: 'Enriquillo',    lat: 18.0380, lon: -71.7433 },
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
