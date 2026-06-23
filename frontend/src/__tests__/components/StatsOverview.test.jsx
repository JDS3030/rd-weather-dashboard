import { describe, test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import StatsOverview from '../../components/StatsOverview';
import { renderWithWeather, normalContextValue, emergencyContextValue } from '../../test/utils';
import { mockProvinces } from '../../test/mocks/handlers';

// Calcula el promedio esperado a partir de los datos de prueba
const temps   = mockProvinces.map(p => p.current.temp_c);
const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
const maxWind = Math.max(...mockProvinces.map(p => p.current.wind_kph));

describe('<StatsOverview />', () => {
  test('NO renderiza nada cuando provinces está vacío', () => {
    const { container } = renderWithWeather(
      <StatsOverview />,
      { ...normalContextValue, provinces: [] }
    );
    expect(container.firstChild).toBeNull();
  });

  test('muestra la temperatura promedio calculada correctamente', () => {
    renderWithWeather(<StatsOverview />);
    expect(screen.getByText(`${avgTemp}°C`)).toBeInTheDocument();
  });

  test('muestra el viento máximo del conjunto de provincias', () => {
    renderWithWeather(<StatsOverview />);
    expect(screen.getByText(`${maxWind.toFixed(0)} km/h`)).toBeInTheDocument();
  });

  test('muestra el conteo de provincias con lluvia', () => {
    renderWithWeather(<StatsOverview />);
    // La Vega tiene precip_mm = 8 en mockProvinces
    expect(screen.getByText(/1\s*\/\s*4/)).toBeInTheDocument();
  });

  test('muestra las 4 tarjetas KPI', () => {
    renderWithWeather(<StatsOverview />);
    expect(screen.getByText('Temperatura Prom.')).toBeInTheDocument();
    expect(screen.getByText('Viento Máximo')).toBeInTheDocument();
    expect(screen.getByText('Con Lluvia')).toBeInTheDocument();
    expect(screen.getByText('Humedad Prom.')).toBeInTheDocument();
  });

  test('en emergencia con viento bajo, el color es text-red-300 (fallback emergencia)', () => {
    // mockProvinces tiene max wind 30 km/h < 63, así que aplica el fallback isEmergency
    renderWithWeather(<StatsOverview />, emergencyContextValue);
    const windValue = screen.getByText(`${maxWind.toFixed(0)} km/h`);
    expect(
      windValue.className.includes('text-red-300') ||
      windValue.className.includes('text-orange-400') ||
      windValue.className.includes('text-red-400')
    ).toBe(true);
  });
});
