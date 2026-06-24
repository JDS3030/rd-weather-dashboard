'use strict';

/**
 * Capa de orquestación de fuentes de datos meteorológicos.
 *
 * Estrategia de fallback:
 *   1. PRIMARIO   → OpenWeather API (requiere OPENWEATHER_API_KEY en .env)
 *   2. FALLBACK   → Open-Meteo API  (gratuita, sin clave, siempre disponible)
 *
 * Comportamiento:
 *   - Si OpenWeather responde correctamente → se usan esos datos (fuente real).
 *   - Si OpenWeather falla completamente    → Open-Meteo asume todas las provincias.
 *   - Si OpenWeather falla parcialmente     → Open-Meteo cubre las provincias fallidas.
 *   - El usuario NUNCA ve errores técnicos; solo ve datos del clima.
 *   - Los logs internos indican qué fuente se está usando en cada momento.
 */

const weatherApiComService = require('./weatherApiComService');
const openMeteoService     = require('./openMeteoService');
const logger               = require('../utils/logger');

// ─── Todas las provincias ─────────────────────────────────────────────────────

async function getAllProvincesWeather() {
  let owResult = null;

  // Intento 1: WeatherAPI.com como fuente primaria
  try {
    owResult = await weatherApiComService.getAllProvincesWeather();
    logger.info(
      `[PROVIDER] ✅ WeatherAPI.com OK — ${owResult.data.length} provincias recibidas` +
      (owResult.errors.length > 0 ? `, ${owResult.errors.length} fallidas` : '')
    );
  } catch (err) {
    // Fallo completo de WeatherAPI → fallback total a Open-Meteo
    logger.warn(`[PROVIDER] ⚠️  WeatherAPI.com falló completamente: ${err.message}`);
    logger.warn('[PROVIDER] 🔄 Usando Open-Meteo como fuente de respaldo para todas las provincias...');

    const meteoResult = await openMeteoService.getAllProvincesWeather();
    logger.info(`[PROVIDER] ✅ Open-Meteo (fallback total) — ${meteoResult.data.length} provincias cargadas`);
    return meteoResult;
  }

  // Intento 2: Completar con Open-Meteo las provincias que fallaron en WeatherAPI
  if (owResult.errors.length > 0) {
    logger.info(`[PROVIDER] 🔄 Completando ${owResult.errors.length} provincia(s) fallida(s) con Open-Meteo...`);

    for (const failed of owResult.errors) {
      try {
        const meteoData = await openMeteoService.getSingleProvinceWeather(failed.id);
        owResult.data.push(meteoData);
        logger.info(`[PROVIDER] ✅ Open-Meteo (parcial) para "${failed.province}"`);
      } catch (meteoErr) {
        logger.error(`[PROVIDER] ❌ Open-Meteo también falló para "${failed.province}": ${meteoErr.message}`);
      }
    }
  }

  return { data: owResult.data, errors: [] };
}

// ─── Provincia individual ─────────────────────────────────────────────────────

async function getSingleProvinceWeather(provinceId) {
  // Intento 1: WeatherAPI.com
  try {
    const data = await weatherApiComService.getSingleProvinceWeather(provinceId);
    logger.info(`[PROVIDER] ✅ WeatherAPI.com para "${provinceId}"`);
    return data;
  } catch (err) {
    // Error 404: la provincia no existe en el sistema — no tiene sentido usar fallback
    if (err.status === 404) throw err;

    logger.warn(`[PROVIDER] ⚠️  WeatherAPI.com falló para "${provinceId}": ${err.message}`);
    logger.warn(`[PROVIDER] 🔄 Usando Open-Meteo como respaldo para "${provinceId}"...`);

    const data = await openMeteoService.getSingleProvinceWeather(provinceId);
    logger.info(`[PROVIDER] ✅ Open-Meteo (fallback) para "${provinceId}"`);
    return data;
  }
}

module.exports = { getAllProvincesWeather, getSingleProvinceWeather };
