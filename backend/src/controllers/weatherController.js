const alertService       = require('../services/alertService');
const weatherApiService  = require('../services/openMeteoService');

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
