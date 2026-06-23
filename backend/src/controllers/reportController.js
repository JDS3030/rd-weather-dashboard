const reportService = require('../services/reportService');

exports.getLatestReport = async (req, res, next) => {
  try {
    const report = reportService.getLatestReport();
    if (!report) {
      return res.status(404).json({ success: false, error: 'No hay reportes generados aún' });
    }
    res.json({ success: true, data: report });
  } catch (err) { next(err); }
};

exports.getReports = async (req, res, next) => {
  try {
    const limit   = Math.min(parseInt(req.query.limit) || 10, 48);
    const reports = reportService.getReports(limit);
    res.json({ success: true, data: reports, count: reports.length });
  } catch (err) { next(err); }
};

exports.generateReport = async (req, res, next) => {
  try {
    const type   = req.query.type || 'daily';
    const report = type === 'emergency'
      ? await reportService.generateEmergencyReport()
      : await reportService.generateDailyReport();
    res.json({ success: true, data: report });
  } catch (err) { next(err); }
};
