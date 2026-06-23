const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/reportController');

router.get('/',         controller.getReports);
router.get('/latest',   controller.getLatestReport);
router.post('/generate',controller.generateReport);

module.exports = router;
