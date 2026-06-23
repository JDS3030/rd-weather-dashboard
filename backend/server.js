require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');

const routes = require('./src/routes');
const alertService = require('./src/services/alertService');
const reportService = require('./src/services/reportService');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
const corsOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
  : true;
app.use(cors({ origin: corsOrigins }));
app.use(express.json());
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

// ─── Cron Jobs ───────────────────────────────────────────────────────────────

// Verificar estado meteorológico cada 5 minutos
cron.schedule('*/5 * * * *', async () => {
  try {
    await alertService.checkAndUpdateAlertStatus();
  } catch (err) {
    logger.error(`Cron weather check failed: ${err.message}`);
  }
});

// Reporte diario a las 7:00 AM
cron.schedule('0 7 * * *', async () => {
  try {
    logger.info('Generating scheduled daily report...');
    await reportService.generateDailyReport();
  } catch (err) {
    logger.error(`Daily report cron failed: ${err.message}`);
  }
});

// Reporte de emergencia cada hora (solo si está activa la emergencia)
cron.schedule('0 * * * *', async () => {
  if (alertService.isEmergencyActive()) {
    try {
      logger.warn('Emergency active — generating hourly emergency report...');
      await reportService.generateEmergencyReport();
    } catch (err) {
      logger.error(`Emergency report cron failed: ${err.message}`);
    }
  }
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  logger.info(`✅ Server running on http://localhost:${PORT}`);
  logger.info('Running initial weather check...');
  try {
    await alertService.checkAndUpdateAlertStatus();
    logger.info('Initial weather check complete.');
  } catch (err) {
    logger.warn(`Initial check failed (check your internet connection): ${err.message}`);
  }
});

module.exports = app;
