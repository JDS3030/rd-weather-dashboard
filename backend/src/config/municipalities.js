'use strict';

// Municipios de RD con coordenadas para monitoreo climático sub-provincial.
// provinceId debe coincidir exactamente con los IDs de constants.js.
const RD_MUNICIPALITIES = [
  // ── Distrito Nacional ──────────────────────────────────────────────────────
  { id: 'dn_centro',        provinceId: 'distrito_nacional', name: 'Distrito Nacional (Centro)', lat: 18.4861, lon: -69.9312 },
  { id: 'dn_zona_colonial', provinceId: 'distrito_nacional', name: 'Zona Colonial',               lat: 18.4733, lon: -69.8872 },

  // ── Santo Domingo ─────────────────────────────────────────────────────────
  { id: 'sd_este',           provinceId: 'santo_domingo', name: 'Santo Domingo Este',    lat: 18.4799, lon: -69.8318 },
  { id: 'sd_norte',          provinceId: 'santo_domingo', name: 'Santo Domingo Norte',   lat: 18.5474, lon: -69.9028 },
  { id: 'sd_oeste',          provinceId: 'santo_domingo', name: 'Santo Domingo Oeste',   lat: 18.4940, lon: -70.0084 },
  { id: 'boca_chica',        provinceId: 'santo_domingo', name: 'Boca Chica',            lat: 18.4517, lon: -69.5996 },
  { id: 'los_alcarrizos',    provinceId: 'santo_domingo', name: 'Los Alcarrizos',        lat: 18.5243, lon: -70.0368 },
  { id: 'pedro_brand',       provinceId: 'santo_domingo', name: 'Pedro Brand',           lat: 18.5766, lon: -70.0982 },
  { id: 'san_antonio_guerra',provinceId: 'santo_domingo', name: 'San Antonio de Guerra', lat: 18.6363, lon: -69.8126 },

  // ── San Cristóbal ─────────────────────────────────────────────────────────
  { id: 'bajos_de_haina',      provinceId: 'san_cristobal', name: 'Bajos de Haina',         lat: 18.4270, lon: -70.0103 },
  { id: 'san_cristobal_ciudad',provinceId: 'san_cristobal', name: 'San Cristóbal (ciudad)', lat: 18.4173, lon: -70.1064 },
  { id: 'villa_altagracia',    provinceId: 'san_cristobal', name: 'Villa Altagracia',       lat: 18.6735, lon: -70.1730 },
  { id: 'san_gregorio_nigua',  provinceId: 'san_cristobal', name: 'San Gregorio de Nigua',  lat: 18.3745, lon: -70.0506 },
  { id: 'cambita_garabitos',   provinceId: 'san_cristobal', name: 'Cambita Garabitos',      lat: 18.4457, lon: -70.2047 },
  { id: 'yaguate',             provinceId: 'san_cristobal', name: 'Yaguate',                lat: 18.3423, lon: -70.1588 },

  // ── Peravia ───────────────────────────────────────────────────────────────
  { id: 'bani',   provinceId: 'peravia', name: 'Baní',         lat: 18.2800, lon: -70.3317 },
  { id: 'nizao',  provinceId: 'peravia', name: 'Nizao',        lat: 18.1914, lon: -70.2260 },

  // ── Santiago ──────────────────────────────────────────────────────────────
  { id: 'stgo_ciudad',        provinceId: 'santiago', name: 'Santiago de los Caballeros', lat: 19.4517, lon: -70.6970 },
  { id: 'tamboril',           provinceId: 'santiago', name: 'Tamboril',                   lat: 19.5111, lon: -70.6010 },
  { id: 'licey_al_medio',     provinceId: 'santiago', name: 'Licey al Medio',             lat: 19.4010, lon: -70.6017 },
  { id: 'villa_gonzalez',     provinceId: 'santiago', name: 'Villa González',             lat: 19.5197, lon: -70.7484 },
  { id: 'san_jose_las_matas', provinceId: 'santiago', name: 'San José de las Matas',     lat: 19.3265, lon: -70.9371 },
  { id: 'bisono',             provinceId: 'santiago', name: 'Bisonó (Navarrete)',         lat: 19.5595, lon: -70.8557 },

  // ── Puerto Plata ──────────────────────────────────────────────────────────
  { id: 'puerto_plata_ciudad', provinceId: 'puerto_plata', name: 'Puerto Plata (ciudad)', lat: 19.7944, lon: -70.6898 },
  { id: 'sosua',               provinceId: 'puerto_plata', name: 'Sosúa',                 lat: 19.7566, lon: -70.5155 },
  { id: 'cabarete',            provinceId: 'puerto_plata', name: 'Cabarete',              lat: 19.7608, lon: -70.4183 },
  { id: 'luperon',             provinceId: 'puerto_plata', name: 'Luperón',               lat: 19.8996, lon: -70.9547 },
  { id: 'imbert',              provinceId: 'puerto_plata', name: 'Imbert',                lat: 19.7009, lon: -70.8266 },

  // ── La Vega ───────────────────────────────────────────────────────────────
  { id: 'la_vega_ciudad',provinceId: 'la_vega', name: 'Concepción de La Vega', lat: 19.2217, lon: -70.5290 },
  { id: 'jarabacoa',     provinceId: 'la_vega', name: 'Jarabacoa',             lat: 19.1191, lon: -70.6340 },
  { id: 'constanza',     provinceId: 'la_vega', name: 'Constanza',             lat: 18.9096, lon: -70.7333 },
  { id: 'jima_abajo',    provinceId: 'la_vega', name: 'Jima Abajo',            lat: 19.1560, lon: -70.4143 },

  // ── Espaillat ─────────────────────────────────────────────────────────────
  { id: 'moca',             provinceId: 'espaillat', name: 'Moca',              lat: 19.3953, lon: -70.5192 },
  { id: 'gaspar_hernandez', provinceId: 'espaillat', name: 'Gaspar Hernández',  lat: 19.6233, lon: -70.2770 },

  // ── Samaná ────────────────────────────────────────────────────────────────
  { id: 'samana_ciudad', provinceId: 'samana', name: 'Santa Bárbara de Samaná', lat: 19.2064, lon: -69.3360 },
  { id: 'las_terrenas',  provinceId: 'samana', name: 'Las Terrenas',            lat: 19.3088, lon: -69.5242 },
  { id: 'sanchez_mun',   provinceId: 'samana', name: 'Sánchez',                 lat: 19.2278, lon: -69.6096 },

  // ── Duarte ────────────────────────────────────────────────────────────────
  { id: 'sfm',           provinceId: 'duarte', name: 'San Francisco de Macorís', lat: 19.3007, lon: -69.8514 },
  { id: 'villa_riva',    provinceId: 'duarte', name: 'Villa Riva',               lat: 19.1766, lon: -69.9068 },
  { id: 'pimentel',      provinceId: 'duarte', name: 'Pimentel',                 lat: 19.1985, lon: -70.1056 },

  // ── María Trinidad Sánchez ────────────────────────────────────────────────
  { id: 'nagua_ciudad', provinceId: 'nagua', name: 'Nagua',        lat: 19.3801, lon: -69.8479 },
  { id: 'rio_san_juan', provinceId: 'nagua', name: 'Río San Juan',  lat: 19.6341, lon: -70.0747 },
  { id: 'cabrera',      provinceId: 'nagua', name: 'Cabrera',       lat: 19.6356, lon: -69.8748 },

  // ── Monseñor Nouel ────────────────────────────────────────────────────────
  { id: 'bonao_ciudad',    provinceId: 'bonao', name: 'Bonao',        lat: 18.9409, lon: -70.4054 },
  { id: 'maimon',          provinceId: 'bonao', name: 'Maimón',       lat: 18.9818, lon: -70.3250 },
  { id: 'piedra_blanca',   provinceId: 'bonao', name: 'Piedra Blanca',lat: 18.9005, lon: -70.5281 },

  // ── Sánchez Ramírez ───────────────────────────────────────────────────────
  { id: 'cotui',   provinceId: 'sanchez_ramirez', name: 'Cotuí',   lat: 18.9966, lon: -70.0975 },
  { id: 'fantino', provinceId: 'sanchez_ramirez', name: 'Fantino', lat: 18.9148, lon: -70.0560 },

  // ── La Altagracia ─────────────────────────────────────────────────────────
  { id: 'higuey_ciudad',   provinceId: 'punta_cana', name: 'Higüey',              lat: 18.6146, lon: -68.7075 },
  { id: 'san_rafael_yuma', provinceId: 'punta_cana', name: 'San Rafael del Yuma', lat: 18.4286, lon: -68.8491 },
  { id: 'boca_de_yuma',    provinceId: 'punta_cana', name: 'Boca de Yuma',        lat: 18.3397, lon: -68.6185 },

  // ── La Romana ─────────────────────────────────────────────────────────────
  { id: 'la_romana_ciudad', provinceId: 'la_romana', name: 'La Romana (ciudad)', lat: 18.4273, lon: -68.9726 },
  { id: 'guaymate',         provinceId: 'la_romana', name: 'Guaymate',           lat: 18.5097, lon: -69.1419 },
  { id: 'villa_hermosa',    provinceId: 'la_romana', name: 'Villa Hermosa',      lat: 18.4777, lon: -69.0693 },

  // ── San Pedro de Macorís ──────────────────────────────────────────────────
  { id: 'sanpedro_ciudad',    provinceId: 'san_pedro', name: 'San Pedro de Macorís',   lat: 18.4539, lon: -69.2971 },
  { id: 'jose_llanos',        provinceId: 'san_pedro', name: 'San José de los Llanos', lat: 18.6218, lon: -69.4310 },
  { id: 'guayacanes',         provinceId: 'san_pedro', name: 'Guayacanes',             lat: 18.5200, lon: -69.4400 },

  // ── El Seibo ──────────────────────────────────────────────────────────────
  { id: 'seibo_ciudad', provinceId: 'higuey', name: 'Santa Cruz del Seibo', lat: 18.7654, lon: -69.0318 },
  { id: 'miches',       provinceId: 'higuey', name: 'Miches',               lat: 18.9869, lon: -69.0549 },

  // ── Hato Mayor ────────────────────────────────────────────────────────────
  { id: 'hato_mayor_ciudad', provinceId: 'hato_mayor', name: 'Hato Mayor del Rey', lat: 18.7640, lon: -69.2562 },
  { id: 'sabana_la_mar',     provinceId: 'hato_mayor', name: 'Sabana de la Mar',   lat: 19.0613, lon: -69.3842 },

  // ── Monte Plata ───────────────────────────────────────────────────────────
  { id: 'monte_plata_ciudad', provinceId: 'monte_plata', name: 'Monte Plata', lat: 18.8066, lon: -69.7863 },
  { id: 'bayaguana',          provinceId: 'monte_plata', name: 'Bayaguana',   lat: 18.7575, lon: -69.6294 },
  { id: 'yamasa',             provinceId: 'monte_plata', name: 'Yamasá',      lat: 18.7726, lon: -70.0152 },

  // ── Monte Cristi ──────────────────────────────────────────────────────────
  { id: 'monte_cristi_ciudad', provinceId: 'monte_cristi', name: 'Monte Cristi', lat: 19.8567, lon: -71.6505 },
  { id: 'guayubin',            provinceId: 'monte_cristi', name: 'Guayubín',     lat: 19.6783, lon: -71.4313 },
  { id: 'villa_vasquez',       provinceId: 'monte_cristi', name: 'Villa Vásquez',lat: 19.7558, lon: -71.5459 },

  // ── Dajabón ───────────────────────────────────────────────────────────────
  { id: 'dajabon_ciudad',  provinceId: 'dajabon', name: 'Dajabón',         lat: 19.5474, lon: -71.7090 },
  { id: 'loma_de_cabrera', provinceId: 'dajabon', name: 'Loma de Cabrera', lat: 19.3893, lon: -71.5895 },

  // ── Valverde ──────────────────────────────────────────────────────────────
  { id: 'mao',       provinceId: 'valverde', name: 'Mao',       lat: 19.5660, lon: -71.0739 },
  { id: 'esperanza', provinceId: 'valverde', name: 'Esperanza', lat: 19.5647, lon: -70.9996 },

  // ── Santiago Rodríguez ────────────────────────────────────────────────────
  { id: 'sabaneta', provinceId: 'santiago_rodriguez', name: 'Sabaneta', lat: 19.4924, lon: -71.3416 },
  { id: 'moncion',  provinceId: 'santiago_rodriguez', name: 'Monción',  lat: 19.4043, lon: -71.1637 },

  // ── Azua ──────────────────────────────────────────────────────────────────
  { id: 'azua_ciudad', provinceId: 'azua', name: 'Azua de Compostela', lat: 18.4554, lon: -70.7352 },
  { id: 'padre_casas', provinceId: 'azua', name: 'Padre Las Casas',    lat: 18.5646, lon: -70.7462 },
  { id: 'las_charcas', provinceId: 'azua', name: 'Las Charcas',        lat: 18.3166, lon: -70.6696 },

  // ── San Juan ──────────────────────────────────────────────────────────────
  { id: 'san_juan_ciudad',  provinceId: 'san_juan', name: 'San Juan de la Maguana', lat: 18.8065, lon: -71.2282 },
  { id: 'las_matas_farfan', provinceId: 'san_juan', name: 'Las Matas de Farfán',   lat: 18.8721, lon: -71.5244 },
  { id: 'el_cercado',       provinceId: 'san_juan', name: 'El Cercado',            lat: 18.7252, lon: -71.5205 },

  // ── Elías Piña ────────────────────────────────────────────────────────────
  { id: 'comendador',  provinceId: 'elias_pina', name: 'Comendador',  lat: 18.8782, lon: -71.6966 },
  { id: 'hondo_valle', provinceId: 'elias_pina', name: 'Hondo Valle', lat: 19.0668, lon: -71.8041 },
  { id: 'banica',      provinceId: 'elias_pina', name: 'Bánica',      lat: 19.1219, lon: -71.7080 },

  // ── Baoruco ───────────────────────────────────────────────────────────────
  { id: 'neiba',  provinceId: 'baoruco', name: 'Neyba',  lat: 18.4839, lon: -71.4178 },
  { id: 'tamayo', provinceId: 'baoruco', name: 'Tamayo', lat: 18.4774, lon: -71.2422 },
  { id: 'galvan', provinceId: 'baoruco', name: 'Galván', lat: 18.3792, lon: -71.2292 },

  // ── Barahona ──────────────────────────────────────────────────────────────
  { id: 'barahona_ciudad', provinceId: 'barahona', name: 'Santa Cruz de Barahona', lat: 18.2036, lon: -71.1050 },
  { id: 'enriquillo',      provinceId: 'barahona', name: 'Enriquillo',             lat: 17.8947, lon: -71.2436 },
  { id: 'paraiso',         provinceId: 'barahona', name: 'Paraíso',               lat: 18.0108, lon: -71.1566 },
  { id: 'vicente_noble',   provinceId: 'barahona', name: 'Vicente Noble',          lat: 18.2997, lon: -71.2049 },

  // ── Independencia ─────────────────────────────────────────────────────────
  { id: 'jimani',         provinceId: 'independencia', name: 'Jimaní',          lat: 18.4924, lon: -71.8517 },
  { id: 'la_descubierta', provinceId: 'independencia', name: 'La Descubierta',  lat: 18.5584, lon: -71.9442 },
  { id: 'duverge',        provinceId: 'independencia', name: 'Duvergé',         lat: 18.3753, lon: -71.5325 },

  // ── San José de Ocoa ──────────────────────────────────────────────────────
  { id: 'ocoa_ciudad',   provinceId: 'san_jose_ocoa', name: 'San José de Ocoa', lat: 18.5541, lon: -70.5096 },
  { id: 'rancho_arriba', provinceId: 'san_jose_ocoa', name: 'Rancho Arriba',    lat: 18.4785, lon: -70.4534 },

  // ── Pedernales ────────────────────────────────────────────────────────────
  { id: 'pedernales_ciudad', provinceId: 'pedernales', name: 'Pedernales', lat: 18.0380, lon: -71.7433 },
  { id: 'oviedo',            provinceId: 'pedernales', name: 'Oviedo',     lat: 17.8030, lon: -71.3897 },
];

module.exports = { RD_MUNICIPALITIES };
