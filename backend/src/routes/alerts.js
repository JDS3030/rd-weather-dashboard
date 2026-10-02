const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/alertController');
const authGuard  = require('../middleware/authGuard');

router.get('/status',   controller.getAlertStatus);
router.get('/history',  controller.getAlertHistory);
router.post('/refresh', authGuard, controller.refreshAlertStatus);
router.post('/onamet',  controller.setManualOnaMetAlert);
router.delete('/onamet',controller.clearOnaMetAlerts);

module.exports = router;
