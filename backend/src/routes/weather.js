const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/weatherController');

router.get('/',             controller.getAllWeather);
router.get('/:provinceId',  controller.getProvinceWeather);

module.exports = router;
