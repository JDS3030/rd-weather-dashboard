// Datos geográficos estáticos: provincia → municipio → distrito municipal
// El clima en tiempo real viene del API (nivel provincia); municipios comparten datos del padre.

export const CARDINAL_META = {
  norte: {
    label: 'Norte',
    arrow: '↑',
    accent: '#60a5fa',
    accentHex: '#3b82f6',
    dimBg: '#1e3a5f',
    dotClass: 'bg-blue-500',
    textClass: 'text-blue-400',
    borderClass: 'border-blue-500',
    description: 'Cibao · Costa Norte',
  },
  este: {
    label: 'Este',
    arrow: '→',
    accent: '#34d399',
    accentHex: '#10b981',
    dimBg: '#064e3b',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-400',
    borderClass: 'border-emerald-500',
    description: 'Litoral Atlántico · Región Yuma',
  },
  oeste: {
    label: 'Oeste',
    arrow: '←',
    accent: '#a78bfa',
    accentHex: '#8b5cf6',
    dimBg: '#2e1065',
    dotClass: 'bg-violet-500',
    textClass: 'text-violet-400',
    borderClass: 'border-violet-500',
    description: 'Zona Fronteriza · Noroeste',
  },
  sur: {
    label: 'Sur',
    arrow: '↓',
    accent: '#fbbf24',
    accentHex: '#f59e0b',
    dimBg: '#451a03',
    dotClass: 'bg-amber-500',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500',
    description: 'Capital · Sur · Enriquillo',
    hasDN: true,
  },
};

// Normaliza nombres para matching con API (ignora acentos, mayúsculas)
export function normalizeName(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

// Asigna una provincia de la API a un cuadrante cardinal
export function getCardinalForProvince(apiProvinceName) {
  const n = normalizeName(apiProvinceName);
  for (const [qid, pnames] of Object.entries(PROVINCE_TO_CARDINAL)) {
    if (pnames.some(pn => n.includes(normalizeName(pn)) || normalizeName(pn).includes(n))) {
      return qid;
    }
  }
  return 'sur'; // fallback
}

// Mapa de pertenencia: provincia → cuadrante
const PROVINCE_TO_CARDINAL = {
  norte: [
    'Santiago', 'Puerto Plata', 'Espaillat', 'La Vega', 'Monseñor Nouel',
    'Sánchez Ramírez', 'Duarte', 'María Trinidad Sánchez', 'Samaná',
  ],
  este: [
    'La Altagracia', 'La Romana', 'San Pedro de Macorís',
    'El Seibo', 'Hato Mayor', 'Monte Plata',
  ],
  oeste: [
    'Monte Cristi', 'Dajabón', 'Valverde', 'Santiago Rodríguez',
  ],
  sur: [
    'Distrito Nacional', 'Santo Domingo', 'San Cristóbal', 'Peravia',
    'Azua', 'San Juan', 'Elías Piña', 'Baoruco', 'Barahona',
    'Independencia', 'San José de Ocoa', 'Pedernales',
  ],
};

// Jerarquía completa: provincia → municipios → distritos municipales
export const GEO_HIERARCHY = {
  norte: [
    { name: 'Santiago', municipalities: [
        { name: 'Santiago de los Caballeros', districts: ['Hato del Yaque', 'Pedro García', 'Palmar Arriba', 'Baitoa', 'Jácuba'] },
        { name: 'Bisonó',                     districts: ['Villa Bisonó', 'La Canela'] },
        { name: 'Licey al Medio',             districts: ['Pedro García', 'La Canela'] },
        { name: 'Puñal',                      districts: ['Pedro García'] },
        { name: 'San José de las Matas',      districts: ['Las Placetas', 'Monción'] },
        { name: 'Tamboril',                   districts: ['Canca La Reyna', 'Palmar Arriba'] },
        { name: 'Villa González',             districts: ['Guayabal'] },
        { name: 'Jácuba',                     districts: [] },
    ]},
    { name: 'Puerto Plata', municipalities: [
        { name: 'Puerto Plata',    districts: ['Montellano', 'Yásica Abajo', 'Maimón'] },
        { name: 'Altamira',        districts: ['Palmar de Ocoa', 'Las Canas'] },
        { name: 'Guananico',       districts: [] },
        { name: 'Imbert',          districts: [] },
        { name: 'Los Hidalgos',    districts: [] },
        { name: 'Luperón',         districts: ['Belloso'] },
        { name: 'Sosúa',           districts: ['Cabarete', 'Gaspar Hernández'] },
        { name: 'Villa Isabela',   districts: ['Estero Hondo', 'La Isabela'] },
        { name: 'Villa Montellano',districts: [] },
    ]},
    { name: 'Espaillat', municipalities: [
        { name: 'Moca',                districts: ['Canca La Piedra', 'Jamao al Norte'] },
        { name: 'Cayetano Germosén',   districts: [] },
        { name: 'Gaspar Hernández',    districts: ['Joba Arriba', 'Veragua'] },
        { name: 'Jamao al Norte',      districts: [] },
    ]},
    { name: 'La Vega', municipalities: [
        { name: 'Concepción de La Vega', districts: ['Río Verde Arriba', 'Jima Abajo'] },
        { name: 'Constanza',             districts: ['La Sabina', 'Tireo'] },
        { name: 'Jarabacoa',             districts: ['Buena Vista', 'La Ciénaga'] },
        { name: 'Jima Abajo',            districts: ['Arroyo Frío'] },
    ]},
    { name: 'Monseñor Nouel', municipalities: [
        { name: 'Bonao',         districts: ['Maimón', 'Sabana del Puerto'] },
        { name: 'Maimon',        districts: [] },
        { name: 'Piedra Blanca', districts: [] },
    ]},
    { name: 'Sánchez Ramírez', municipalities: [
        { name: 'Cotuí',    districts: ['Platanal', 'Quita Sueño'] },
        { name: 'Cevicos',  districts: [] },
        { name: 'Fantino',  districts: [] },
        { name: 'La Mata',  districts: [] },
    ]},
    { name: 'Duarte', municipalities: [
        { name: 'San Francisco de Macorís', districts: ['La Peña', 'Jaya'] },
        { name: 'Arenoso',                  districts: [] },
        { name: 'Castillo',                 districts: [] },
        { name: 'Las Guáranas',             districts: [] },
        { name: 'Pimentel',                 districts: [] },
        { name: 'Villa Riva',               districts: ['El Factor'] },
    ]},
    { name: 'María Trinidad Sánchez', municipalities: [
        { name: 'Nagua',      districts: ['El Factor', 'Las Gordas'] },
        { name: 'Cabrera',    districts: [] },
        { name: 'El Factor',  districts: [] },
        { name: 'Río San Juan', districts: [] },
    ]},
    { name: 'Samaná', municipalities: [
        { name: 'Santa Bárbara de Samaná', districts: ['Sánchez', 'El Limón'] },
        { name: 'Las Terrenas',            districts: ['Cosón'] },
        { name: 'Sánchez',                 districts: [] },
    ]},
  ],

  este: [
    { name: 'La Altagracia', municipalities: [
        { name: 'Higüey',               districts: ['El Seibo', 'Los Llanos', 'La Otra Banda'] },
        { name: 'San Rafael del Yuma',  districts: ['Boca de Yuma', 'Los Patos'] },
    ]},
    { name: 'La Romana', municipalities: [
        { name: 'La Romana',      districts: ['Caleta', 'Guaymate', 'Villa Hermosa'] },
        { name: 'Guaymate',       districts: [] },
        { name: 'Villa Hermosa',  districts: [] },
    ]},
    { name: 'San Pedro de Macorís', municipalities: [
        { name: 'San Pedro de Macorís', districts: ['Quisqueya', 'Consuelo', 'Ramón Santana'] },
        { name: 'Consuelo',             districts: [] },
        { name: 'Guayacanes',           districts: [] },
        { name: 'Quisqueya',            districts: [] },
        { name: 'Ramón Santana',        districts: [] },
        { name: 'San José de los Llanos', districts: [] },
    ]},
    { name: 'El Seibo', municipalities: [
        { name: 'Santa Cruz del Seibo', districts: ['Miches', 'Rancho Arriba'] },
        { name: 'Miches',               districts: [] },
    ]},
    { name: 'Hato Mayor', municipalities: [
        { name: 'Hato Mayor del Rey',  districts: ['Sabana de la Mar', 'El Valle'] },
        { name: 'El Valle',            districts: [] },
        { name: 'Sabana de la Mar',    districts: [] },
    ]},
    { name: 'Monte Plata', municipalities: [
        { name: 'Monte Plata',  districts: ['Bayaguana', 'Sabana Grande de Boyá', 'Yamasa'] },
        { name: 'Bayaguana',    districts: [] },
        { name: 'Peralvillo',   districts: [] },
        { name: 'Sabana Grande de Boyá', districts: [] },
        { name: 'Yamasa',       districts: [] },
    ]},
  ],

  oeste: [
    { name: 'Monte Cristi', municipalities: [
        { name: 'Monte Cristi',           districts: ['Cana Chapetón', 'El Estrellón', 'Guayubín'] },
        { name: 'Castañuelas',            districts: [] },
        { name: 'Guayubín',               districts: ['Cana Chapetón', 'Las Matas de Santa Cruz'] },
        { name: 'Las Matas de Santa Cruz',districts: [] },
        { name: 'Pepillo Salcedo',        districts: [] },
        { name: 'Villa Vásquez',          districts: [] },
    ]},
    { name: 'Dajabón', municipalities: [
        { name: 'Dajabón',          districts: ['El Pino', 'Loma de Cabrera', 'Partido'] },
        { name: 'El Pino',          districts: [] },
        { name: 'Loma de Cabrera',  districts: [] },
        { name: 'Partido',          districts: [] },
        { name: 'Restauración',     districts: [] },
    ]},
    { name: 'Valverde', municipalities: [
        { name: 'Mao',            districts: ['Amina', 'Guatapanal', 'Laguna Salada'] },
        { name: 'Esperanza',      districts: [] },
        { name: 'Laguna Salada',  districts: [] },
    ]},
    { name: 'Santiago Rodríguez', municipalities: [
        { name: 'Sabaneta',       districts: ['Boca de Mao', 'Las Cabuyas', 'Los Almácigos'] },
        { name: 'Los Almácigos',  districts: [] },
        { name: 'Monción',        districts: [] },
    ]},
  ],

  sur: [
    { name: 'Distrito Nacional', isDN: true, municipalities: [
        { name: 'Distrito Nacional', districts: ['Cristo Rey', 'La Feria', 'La Fuente', 'Zona Colonial', 'Los Alcarrizos', 'Pedro Brand'] },
    ]},
    { name: 'Santo Domingo', municipalities: [
        { name: 'Santo Domingo Este',   districts: ['Los Alcarrizos', 'Pedro Brand'] },
        { name: 'Santo Domingo Norte',  districts: ['Villa Mella', 'Guaricano'] },
        { name: 'Santo Domingo Oeste',  districts: ['Haina', 'Nigua'] },
        { name: 'Boca Chica',           districts: ['Andrés', 'La Caleta'] },
        { name: 'Los Alcarrizos',       districts: [] },
        { name: 'Pedro Brand',          districts: [] },
        { name: 'San Antonio de Guerra',districts: [] },
    ]},
    { name: 'San Cristóbal', municipalities: [
        { name: 'San Cristóbal',      districts: ['Cambita Garabitos', 'La Cuchilla', 'El Carril'] },
        { name: 'Bajos de Haina',     districts: [] },
        { name: 'Cambita Garabitos',  districts: [] },
        { name: 'Los Cacaos',         districts: [] },
        { name: 'San Gregorio de Nigua', districts: [] },
        { name: 'Villa Altagracia',   districts: [] },
        { name: 'Yaguate',            districts: [] },
    ]},
    { name: 'Peravia', municipalities: [
        { name: 'Baní',         districts: ['Matanzas', 'Nizao', 'Paya'] },
        { name: 'Nizao',        districts: [] },
        { name: 'Villa del Mar',districts: [] },
    ]},
    { name: 'Azua', municipalities: [
        { name: 'Azua de Compostela',   districts: ['El Número', 'Las Charcas', 'Las Yayas de Viajama'] },
        { name: 'Las Charcas',          districts: [] },
        { name: 'Las Yayas de Viajama', districts: [] },
        { name: 'Padre Las Casas',      districts: [] },
        { name: 'Peralta',              districts: [] },
        { name: 'Pueblo Viejo',         districts: [] },
        { name: 'Sabana Yegua',         districts: [] },
        { name: 'Tábara Arriba',        districts: [] },
    ]},
    { name: 'San Juan', municipalities: [
        { name: 'San Juan de la Maguana', districts: ['Bohechío', 'El Cercado', 'Las Matas de Farfán'] },
        { name: 'Bohechío',               districts: [] },
        { name: 'El Cercado',             districts: [] },
        { name: 'Juan de Herrera',        districts: [] },
        { name: 'Las Matas de Farfán',    districts: [] },
        { name: 'Vallejuelo',             districts: [] },
    ]},
    { name: 'Elías Piña', municipalities: [
        { name: 'Comendador',    districts: ['El Llano', 'Hondo Valle'] },
        { name: 'Bánica',        districts: [] },
        { name: 'El Llano',      districts: [] },
        { name: 'Hondo Valle',   districts: [] },
        { name: 'Pedro Santana', districts: [] },
    ]},
    { name: 'Baoruco', municipalities: [
        { name: 'Neyba',    districts: ['Galván', 'Los Ríos', 'Tamayo'] },
        { name: 'Galván',   districts: [] },
        { name: 'Los Ríos', districts: [] },
        { name: 'Tamayo',   districts: [] },
    ]},
    { name: 'Barahona', municipalities: [
        { name: 'Santa Cruz de Barahona', districts: ['Cabral', 'El Peñón', 'Enriquillo'] },
        { name: 'Cabral',          districts: [] },
        { name: 'El Peñón',        districts: [] },
        { name: 'Enriquillo',      districts: [] },
        { name: 'Paraíso',         districts: [] },
        { name: 'Polo',            districts: [] },
        { name: 'Vicente Noble',   districts: [] },
        { name: 'La Ciénaga',      districts: [] },
    ]},
    { name: 'Independencia', municipalities: [
        { name: 'Jimaní',           districts: ['Duvergé', 'La Descubierta', 'Mella'] },
        { name: 'Duvergé',          districts: [] },
        { name: 'La Descubierta',   districts: [] },
        { name: 'Mella',            districts: [] },
        { name: 'Postrer Río',      districts: [] },
    ]},
    { name: 'San José de Ocoa', municipalities: [
        { name: 'San José de Ocoa', districts: ['Nizao', 'Rancho Arriba', 'Sabana Larga'] },
        { name: 'Rancho Arriba',    districts: [] },
        { name: 'Sabana Larga',     districts: [] },
    ]},
    { name: 'Pedernales', municipalities: [
        { name: 'Pedernales', districts: ['Oviedo', 'Postrer Río'] },
        { name: 'Oviedo',     districts: [] },
    ]},
  ],
};

// ── Centroides aproximados de cada provincia (lat/lng) ────────────────────────
// Usados para localizar al usuario en el mapa cardinal por distancia mínima.
export const PROVINCE_CENTROIDS = [
  // Norte
  { name: 'Santiago',                qid: 'norte', lat: 19.45, lng: -70.70 },
  { name: 'Puerto Plata',            qid: 'norte', lat: 19.80, lng: -70.69 },
  { name: 'Espaillat',               qid: 'norte', lat: 19.60, lng: -70.28 },
  { name: 'La Vega',                 qid: 'norte', lat: 19.22, lng: -70.52 },
  { name: 'Monseñor Nouel',          qid: 'norte', lat: 18.92, lng: -70.43 },
  { name: 'Sánchez Ramírez',         qid: 'norte', lat: 19.05, lng: -70.07 },
  { name: 'Duarte',                  qid: 'norte', lat: 19.21, lng: -69.88 },
  { name: 'María Trinidad Sánchez',  qid: 'norte', lat: 19.67, lng: -69.90 },
  { name: 'Samaná',                  qid: 'norte', lat: 19.21, lng: -69.35 },
  // Este
  { name: 'La Altagracia',           qid: 'este',  lat: 18.62, lng: -68.71 },
  { name: 'La Romana',               qid: 'este',  lat: 18.43, lng: -68.97 },
  { name: 'San Pedro de Macorís',    qid: 'este',  lat: 18.46, lng: -69.31 },
  { name: 'El Seibo',                qid: 'este',  lat: 18.77, lng: -69.04 },
  { name: 'Hato Mayor',              qid: 'este',  lat: 18.77, lng: -69.26 },
  { name: 'Monte Plata',             qid: 'este',  lat: 18.81, lng: -69.78 },
  // Oeste
  { name: 'Monte Cristi',            qid: 'oeste', lat: 19.84, lng: -71.65 },
  { name: 'Dajabón',                 qid: 'oeste', lat: 19.55, lng: -71.71 },
  { name: 'Valverde',                qid: 'oeste', lat: 19.57, lng: -71.07 },
  { name: 'Santiago Rodríguez',      qid: 'oeste', lat: 19.47, lng: -71.34 },
  // Sur
  { name: 'Distrito Nacional',       qid: 'sur',   lat: 18.48, lng: -69.90 },
  { name: 'Santo Domingo',           qid: 'sur',   lat: 18.50, lng: -69.89 },
  { name: 'San Cristóbal',           qid: 'sur',   lat: 18.42, lng: -70.12 },
  { name: 'Peravia',                 qid: 'sur',   lat: 18.27, lng: -70.33 },
  { name: 'Azua',                    qid: 'sur',   lat: 18.45, lng: -70.73 },
  { name: 'San Juan',                qid: 'sur',   lat: 18.81, lng: -71.23 },
  { name: 'Elías Piña',              qid: 'sur',   lat: 18.87, lng: -71.70 },
  { name: 'Baoruco',                 qid: 'sur',   lat: 18.48, lng: -71.42 },
  { name: 'Barahona',                qid: 'sur',   lat: 18.20, lng: -71.10 },
  { name: 'Independencia',           qid: 'sur',   lat: 18.49, lng: -71.85 },
  { name: 'San José de Ocoa',        qid: 'sur',   lat: 18.55, lng: -70.51 },
  { name: 'Pedernales',              qid: 'sur',   lat: 18.04, lng: -71.74 },
];

// Encuentra la provincia más cercana a unas coordenadas (distancia euclidiana en grados).
// Retorna null si el punto está a más de ~300 km fuera de la RD.
export function findProvinceByCoords(lat, lng) {
  let nearest  = null;
  let minDist  = Infinity;

  for (const prov of PROVINCE_CENTROIDS) {
    const dist = Math.sqrt((lat - prov.lat) ** 2 + (lng - prov.lng) ** 2);
    if (dist < minDist) { minDist = dist; nearest = prov; }
  }

  // Umbral: ~3 grados ≈ 300 km — más lejos significa fuera de la isla
  return minDist <= 3 ? { ...nearest, distanceDeg: minDist } : null;
}
