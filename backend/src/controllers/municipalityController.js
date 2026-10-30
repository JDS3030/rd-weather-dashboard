'use strict';

const {
  getMunicipalitiesForProvince,
  getAllMunicipalitiesWeather,
  getAllMunicipalitiesMeta,
} = require('../services/municipalityService');
const logger = require('../utils/logger');

async function listMunicipalities(req, res, next) {
  try {
    const data = getAllMunicipalitiesMeta();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    next(err);
  }
}

async function getMunicipalityWeather(req, res, next) {
  try {
    const { provinceId } = req.params;
    const data = await getMunicipalitiesForProvince(provinceId);
    res.json({ success: true, provinceId, count: data.length, data });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ success: false, error: err.message });
    }
    logger.error(`[MUNICIPALITY] GET /weather/${req.params.provinceId}: ${err.message}`);
    next(err);
  }
}

async function getAllMunicipalityWeather(req, res, next) {
  try {
    const data = await getAllMunicipalitiesWeather();
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    logger.error(`[MUNICIPALITY] GET /weather (all): ${err.message}`);
    next(err);
  }
}

module.exports = { listMunicipalities, getMunicipalityWeather, getAllMunicipalityWeather };
