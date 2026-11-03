'use strict';

const { generateWeatherAnalysis } = require('../services/assistantService');
const { RD_PROVINCES }            = require('../config/constants');

async function queryAssistant(req, res, next) {
  try {
    const { provinceId, query } = req.body;

    if (!provinceId || !RD_PROVINCES.find(p => p.id === provinceId)) {
      return res.status(400).json({ success: false, error: 'provinceId inválido o no encontrado' });
    }

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'El campo query es obligatorio y no puede estar vacío' });
    }

    if (query.length > 500) {
      return res.status(400).json({ success: false, error: 'La consulta no puede superar los 500 caracteres' });
    }

    const result = await generateWeatherAnalysis(provinceId, query.trim());
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

module.exports = { queryAssistant };
