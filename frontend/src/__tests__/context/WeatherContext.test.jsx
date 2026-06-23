import { describe, test, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import { WeatherProvider } from '../../context/WeatherContext';
import { useWeatherData } from '../../hooks/useWeatherData';
import {
  mockProvinces, mockAlertNormal, mockAlertEmergency, mockReport,
} from '../../test/mocks/handlers';

const wrapper = ({ children }) => <WeatherProvider>{children}</WeatherProvider>;

describe('WeatherContext — carga inicial', () => {
  test('isLoading empieza en true y pasa a false tras el fetch', async () => {
    const { result } = renderHook(() => useWeatherData(), { wrapper });
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  test('provinces se carga con los datos de la API', async () => {
    const { result } = renderHook(() => useWeatherData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.provinces).toHaveLength(mockProvinces.length);
    expect(result.current.provinces[0].name).toBe('Distrito Nacional');
  });

  test('alertState se carga con level "normal"', async () => {
    const { result } = renderHook(() => useWeatherData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.alertState.level).toBe('normal');
    expect(result.current.alertState.isEmergency).toBe(false);
  });

  test('latestReport se carga desde /reports/latest', async () => {
    const { result } = renderHook(() => useWeatherData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.latestReport).not.toBeNull();
    expect(result.current.latestReport.type).toBe('daily');
  });

  test('lastUpdate se establece tras el fetch exitoso', async () => {
    const { result } = renderHook(() => useWeatherData(), { wrapper });
    await waitFor(() => expect(result.current.lastUpdate).not.toBeNull());

    expect(result.current.lastUpdate).toBeInstanceOf(Date);
  });
});

describe('WeatherContext — manejo de errores', () => {
  test('setea error cuando el backend no responde', async () => {
    server.use(
      http.get('http://localhost:3001/api/weather', () =>
        HttpResponse.error()
      )
    );

    const { result } = renderHook(() => useWeatherData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.error).toMatch(/No se pudo conectar/i);
  });

  test('no resetea provinces previas si el segundo fetch falla', async () => {
    const { result } = renderHook(() => useWeatherData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const provincesBeforeError = result.current.provinces;
    server.use(http.get('http://localhost:3001/api/weather', () => HttpResponse.error()));

    await act(async () => { result.current.refresh(); });
    await waitFor(() => expect(result.current.error).not.toBeNull());

    // Las provincias previas se mantienen hasta nuevo fetch exitoso
    expect(result.current.provinces).toEqual(provincesBeforeError);
  });
});

describe('WeatherContext — modo emergencia', () => {
  test('detecta emergencia cuando alertState.isEmergency es true', async () => {
    server.use(
      http.get('http://localhost:3001/api/alerts/status', () =>
        HttpResponse.json({ success: true, data: mockAlertEmergency })
      )
    );

    const { result } = renderHook(() => useWeatherData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.alertState.isEmergency).toBe(true);
    expect(result.current.alertState.level).toBe('emergency');
  });
});

describe('WeatherContext — función refresh()', () => {
  test('refresh() vuelve a llamar la API y actualiza lastUpdate', async () => {
    const { result } = renderHook(() => useWeatherData(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const firstUpdate = result.current.lastUpdate;

    await act(async () => {
      result.current.refresh();
      await new Promise(r => setTimeout(r, 50)); // pequeño delay
    });
    await waitFor(() => expect(result.current.lastUpdate).not.toBe(firstUpdate));
  });
});

describe('useWeatherData() — validación de contexto', () => {
  test('lanza error si se usa fuera de WeatherProvider', () => {
    // Suprimir el error de consola de React
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useWeatherData())).toThrow(
      'useWeatherData debe usarse dentro de <WeatherProvider>'
    );

    vi.restoreAllMocks();
  });
});
