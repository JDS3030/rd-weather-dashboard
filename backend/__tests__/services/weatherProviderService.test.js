'use strict';

// Tests del orquestador de fuentes de datos (weatherProviderService.js)
// vi.spyOn() es el approach correcto para módulos CJS: opera en runtime sin hoisting.
const weatherApiComService   = require('../../src/services/weatherApiComService');
const openMeteoService       = require('../../src/services/openMeteoService');
const weatherProviderService = require('../../src/services/weatherProviderService');
const logger                 = require('../../src/utils/logger');

const makeProvince = (id = 'distrito_nacional', source = 'WeatherAPI.com') => ({
  id,
  name:    id === 'distrito_nacional' ? 'Distrito Nacional' : id,
  region:  'Sur',
  current: { temp_c: 30.0, condition: { text: 'Soleado' } },
  forecast: [],
  alerts:  [],
  source,
});

beforeEach(() => {
  vi.spyOn(weatherApiComService, 'getAllProvincesWeather');
  vi.spyOn(weatherApiComService, 'getSingleProvinceWeather');
  vi.spyOn(openMeteoService, 'getAllProvincesWeather');
  vi.spyOn(openMeteoService, 'getSingleProvinceWeather');
  vi.spyOn(logger, 'info').mockImplementation(() => {});
  vi.spyOn(logger, 'warn').mockImplementation(() => {});
  vi.spyOn(logger, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

// ─── getAllProvincesWeather ────────────────────────────────────────────────────

describe('getAllProvincesWeather()', () => {
  test('usa WeatherAPI.com cuando responde correctamente', async () => {
    const mockData = [makeProvince()];
    weatherApiComService.getAllProvincesWeather.mockResolvedValue({ data: mockData, errors: [] });

    const result = await weatherProviderService.getAllProvincesWeather();

    expect(weatherApiComService.getAllProvincesWeather).toHaveBeenCalledTimes(1);
    expect(openMeteoService.getAllProvincesWeather).not.toHaveBeenCalled();
    expect(result.data).toEqual(mockData);
  });

  test('hace fallback total a Open-Meteo cuando WeatherAPI falla completamente', async () => {
    const meteoData = [makeProvince('distrito_nacional', 'Open-Meteo · GFS/ECMWF')];
    weatherApiComService.getAllProvincesWeather.mockRejectedValue(new Error('API key inválida'));
    openMeteoService.getAllProvincesWeather.mockResolvedValue({ data: meteoData, errors: [] });

    const result = await weatherProviderService.getAllProvincesWeather();

    expect(weatherApiComService.getAllProvincesWeather).toHaveBeenCalledTimes(1);
    expect(openMeteoService.getAllProvincesWeather).toHaveBeenCalledTimes(1);
    expect(result.data).toEqual(meteoData);
  });

  test('completa con Open-Meteo las provincias fallidas en WeatherAPI (fallback parcial)', async () => {
    const goodData     = [makeProvince('distrito_nacional')];
    const failedEntry  = { id: 'santiago', province: 'Santiago', error: 'timeout' };
    const meteoComplem = makeProvince('santiago', 'Open-Meteo · GFS/ECMWF');

    weatherApiComService.getAllProvincesWeather.mockResolvedValue({
      data:   goodData,
      errors: [failedEntry],
    });
    openMeteoService.getSingleProvinceWeather.mockResolvedValue(meteoComplem);

    const result = await weatherProviderService.getAllProvincesWeather();

    expect(openMeteoService.getSingleProvinceWeather).toHaveBeenCalledWith('santiago');
    expect(result.data).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  test('errors queda vacío cuando el fallback parcial cubre todas las provincias fallidas', async () => {
    const failedEntry = { id: 'la_vega', province: 'La Vega', error: 'timeout' };
    weatherApiComService.getAllProvincesWeather.mockResolvedValue({
      data:   [makeProvince()],
      errors: [failedEntry],
    });
    openMeteoService.getSingleProvinceWeather.mockResolvedValue(
      makeProvince('la_vega', 'Open-Meteo · GFS/ECMWF')
    );

    const result = await weatherProviderService.getAllProvincesWeather();

    expect(result.errors).toHaveLength(0);
  });

  test('no llama a Open-Meteo cuando WeatherAPI responde sin errores parciales', async () => {
    weatherApiComService.getAllProvincesWeather.mockResolvedValue({
      data:   [makeProvince()],
      errors: [],
    });

    await weatherProviderService.getAllProvincesWeather();

    expect(openMeteoService.getSingleProvinceWeather).not.toHaveBeenCalled();
    expect(openMeteoService.getAllProvincesWeather).not.toHaveBeenCalled();
  });
});

// ─── getSingleProvinceWeather ──────────────────────────────────────────────────

describe('getSingleProvinceWeather()', () => {
  test('retorna datos de WeatherAPI.com cuando funciona correctamente', async () => {
    const mockData = makeProvince();
    weatherApiComService.getSingleProvinceWeather.mockResolvedValue(mockData);

    const result = await weatherProviderService.getSingleProvinceWeather('distrito_nacional');

    expect(weatherApiComService.getSingleProvinceWeather).toHaveBeenCalledWith('distrito_nacional');
    expect(openMeteoService.getSingleProvinceWeather).not.toHaveBeenCalled();
    expect(result.source).toBe('WeatherAPI.com');
  });

  test('propaga error 404 sin intentar fallback (provincia no existe)', async () => {
    const notFoundErr = new Error("Provincia 'xyz' no encontrada");
    notFoundErr.status = 404;
    weatherApiComService.getSingleProvinceWeather.mockRejectedValue(notFoundErr);

    await expect(
      weatherProviderService.getSingleProvinceWeather('xyz')
    ).rejects.toMatchObject({ status: 404 });

    expect(openMeteoService.getSingleProvinceWeather).not.toHaveBeenCalled();
  });

  test('hace fallback a Open-Meteo cuando WeatherAPI falla por error distinto a 404', async () => {
    const apiError  = new Error('Connection timeout');
    const meteoData = makeProvince('distrito_nacional', 'Open-Meteo · GFS/ECMWF');

    weatherApiComService.getSingleProvinceWeather.mockRejectedValue(apiError);
    openMeteoService.getSingleProvinceWeather.mockResolvedValue(meteoData);

    const result = await weatherProviderService.getSingleProvinceWeather('distrito_nacional');

    expect(openMeteoService.getSingleProvinceWeather).toHaveBeenCalledWith('distrito_nacional');
    expect(result.source).toBe('Open-Meteo · GFS/ECMWF');
  });

  test('propaga el error de Open-Meteo si el fallback también falla', async () => {
    weatherApiComService.getSingleProvinceWeather.mockRejectedValue(new Error('WeatherAPI down'));
    openMeteoService.getSingleProvinceWeather.mockRejectedValue(new Error('Open-Meteo down'));

    await expect(
      weatherProviderService.getSingleProvinceWeather('distrito_nacional')
    ).rejects.toThrow('Open-Meteo down');
  });
});
