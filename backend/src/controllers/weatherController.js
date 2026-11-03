const alertService       = require('../services/alertService');
const weatherApiService  = require('../services/weatherProviderService');
const { getHourlyForecast, getDailyForecast7d } = require('../services/openMeteoService');
const { RD_PROVINCES }   = require('../config/constants');

exports.getAllWeather = async (req, res, next) => {
  try {
    const { data, isStale, staleFrom } = await alertService.getCachedWeatherData();
    res.json({
      success: true,
      data,
      count:     data.length,
      timestamp: new Date().toISOString(),
      isStale:   isStale   || false,
      staleFrom: staleFrom || null,
    });
  } catch (err) { next(err); }
};

exports.getProvinceWeather = async (req, res, next) => {
  try {
    const data = await weatherApiService.getSingleProvinceWeather(req.params.provinceId);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

exports.getExtendedForecast = async (req, res, next) => {
  try {
    const province = RD_PROVINCES.find(p => p.id === req.params.provinceId);
    if (!province) {
      const err = new Error(`Provincia '${req.params.provinceId}' no encontrada`);
      err.status = 404;
      return next(err);
    }
    const [hourly, daily7d] = await Promise.all([
      getHourlyForecast(province.lat, province.lon),
      getDailyForecast7d(province.lat, province.lon),
    ]);
    res.json({ success: true, data: { hourly, daily7d } });
  } catch (err) { next(err); }
};
