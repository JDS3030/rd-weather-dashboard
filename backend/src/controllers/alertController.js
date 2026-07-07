const alertService           = require('../services/alertService');
const onaMetService          = require('../services/onaMetService');
const alertHistoryRepository = require('../repositories/alertHistoryRepository');

exports.getAlertStatus = async (req, res, next) => {
  try {
    const state      = alertService.getAlertState();
    const onaMetData = onaMetService.getAlerts();
    res.json({
      success: true,
      data: {
        ...state,
        onaMetAlerts:       onaMetData.alerts,
        onaMetLastUpdated:  onaMetData.lastUpdated,
        onaMetSource:       onaMetData.source,
      },
    });
  } catch (err) { next(err); }
};

// Historial de cambios de nivel (persistido en PostgreSQL).
// Sin DB devuelve una lista vacía (no es un error).
exports.getAlertHistory = async (req, res, next) => {
  try {
    const limit   = parseInt(req.query.limit, 10) || alertHistoryRepository.DEFAULT_LIMIT;
    const history = await alertHistoryRepository.getRecent(limit);
    res.json({ success: true, count: history.length, data: history });
  } catch (err) { next(err); }
};

exports.refreshAlertStatus = async (req, res, next) => {
  try {
    const state = await alertService.checkAndUpdateAlertStatus();
    res.json({ success: true, data: state });
  } catch (err) { next(err); }
};

// Admin: inyectar alerta ONAMET manualmente
exports.setManualOnaMetAlert = async (req, res, next) => {
  try {
    const { title, description, type, severity, affectedRegions } = req.body;
    if (!title || !description) {
      const err = new Error('title y description son requeridos');
      err.status = 400;
      return next(err);
    }
    onaMetService.setManualAlert({
      id:              `manual-${Date.now()}`,
      title,
      description,
      type:            type || 'manual',
      severity:        severity || 'warning',
      affectedRegions: affectedRegions || ['Nacional'],
      issuedAt:        new Date().toISOString(),
      source:          'ONAMET-Manual',
    });
    await alertService.checkAndUpdateAlertStatus();
    res.json({ success: true, message: 'Alerta ONAMET establecida y estado actualizado' });
  } catch (err) { next(err); }
};

exports.clearOnaMetAlerts = async (req, res, next) => {
  try {
    onaMetService.clearAlerts();
    await alertService.checkAndUpdateAlertStatus();
    res.json({ success: true, message: 'Alertas ONAMET limpiadas' });
  } catch (err) { next(err); }
};
