const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/municipalityController');

// GET /api/municipalities              → lista estática (lat/lon/name, sin clima)
// GET /api/municipalities/weather      → clima de todos los municipios (cache 15 min)
// GET /api/municipalities/weather/:id  → clima de los municipios de una provincia
router.get('/weather/:provinceId', controller.getMunicipalityWeather);
router.get('/weather',             controller.getAllMunicipalityWeather);
router.get('/',                    controller.listMunicipalities);

module.exports = router;
