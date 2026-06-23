const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();

const weatherRoutes = require('./weather');
const alertRoutes   = require('./alerts');
const reportRoutes  = require('./reports');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      150,
  message:  { success: false, error: 'Demasiadas solicitudes, intente más tarde' },
});

router.use(limiter);
router.use('/weather', weatherRoutes);
router.use('/alerts',  alertRoutes);
router.use('/reports', reportRoutes);

router.get('/health', (req, res) =>
  res.json({ status: 'OK', service: 'RD Weather Backend', timestamp: new Date().toISOString() })
);

module.exports = router;
