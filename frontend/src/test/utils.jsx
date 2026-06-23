import { render } from '@testing-library/react';
import { WeatherContext } from '../context/WeatherContext';
import { mockProvinces, mockAlertNormal, mockAlertEmergency, mockReport } from './mocks/handlers';

// Contexto base para modo normal
export const normalContextValue = {
  provinces:    mockProvinces,
  alertState:   mockAlertNormal,
  latestReport: mockReport,
  isLoading:    false,
  lastUpdate:   new Date('2026-06-22T14:23:05'),
  error:        null,
  isStale:      false,
  staleFrom:    null,
  refresh:      vi.fn(),
};

// Contexto para modo emergencia
export const emergencyContextValue = {
  ...normalContextValue,
  alertState: mockAlertEmergency,
};

// Contexto de carga inicial
export const loadingContextValue = {
  ...normalContextValue,
  provinces:    [],
  latestReport: null,
  isLoading:    true,
  lastUpdate:   null,
};

// Contexto con error de red
export const errorContextValue = {
  ...normalContextValue,
  provinces: [],
  isLoading: false,
  error:     'No se pudo conectar con el servidor. Verifique que el backend esté activo.',
};

/**
 * Renderiza un componente dentro del WeatherContext con el valor dado.
 * Usar en lugar de `render()` para componentes que consumen useWeatherData().
 */
export function renderWithWeather(ui, contextValue = normalContextValue) {
  return render(
    <WeatherContext.Provider value={contextValue}>
      {ui}
    </WeatherContext.Provider>
  );
}
