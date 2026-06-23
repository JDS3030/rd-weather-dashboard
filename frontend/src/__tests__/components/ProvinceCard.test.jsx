import { describe, test, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import ProvinceCard from '../../components/ProvinceCard';
import { renderWithWeather, normalContextValue, emergencyContextValue } from '../../test/utils';
import { mockProvince } from '../../test/mocks/handlers';

// Provincia con alerta activa (su nombre coincide con un trigger)
const provinceWithAlert = { ...mockProvince, name: 'Monte Cristi' };
const emergencyCtxWithAlert = {
  ...emergencyContextValue,
  alertState: {
    ...emergencyContextValue.alertState,
    triggers: [
      { source: 'WeatherAPI-Wind', province: 'Monte Cristi', windKph: 125, level: 'Huracán Categoría 1+' },
    ],
  },
};

describe('<ProvinceCard /> — Modo Normal', () => {
  test('renderiza el nombre de la provincia', () => {
    renderWithWeather(<ProvinceCard province={mockProvince} />);
    expect(screen.getByText('Distrito Nacional')).toBeInTheDocument();
  });

  test('renderiza la región', () => {
    renderWithWeather(<ProvinceCard province={mockProvince} />);
    expect(screen.getByText('Sur')).toBeInTheDocument();
  });

  test('renderiza la temperatura con símbolo de grado', () => {
    renderWithWeather(<ProvinceCard province={mockProvince} />);
    expect(screen.getByText(/31\.2°/)).toBeInTheDocument();
  });

  test('renderiza la condición meteorológica', () => {
    renderWithWeather(<ProvinceCard province={mockProvince} />);
    expect(screen.getByText('Despejado')).toBeInTheDocument();
  });

  test('renderiza la humedad', () => {
    renderWithWeather(<ProvinceCard province={mockProvince} />);
    expect(screen.getByText('68%')).toBeInTheDocument();
  });

  test('NO muestra badge de alerta en modo normal', () => {
    renderWithWeather(<ProvinceCard province={mockProvince} />);
    expect(screen.queryByText(/ALERTA ACTIVA/i)).not.toBeInTheDocument();
  });

  test('WindTag muestra "Calmo" para viento < 20 km/h', () => {
    const calm = { ...mockProvince, current: { ...mockProvince.current, wind_kph: 10 } };
    renderWithWeather(<ProvinceCard province={calm} />);
    expect(screen.getByText(/Calmo/i)).toBeInTheDocument();
  });

  test('WindTag muestra "Huracán" con texto rojo para viento >= 119 km/h', () => {
    const hurricane = { ...mockProvince, current: { ...mockProvince.current, wind_kph: 125 } };
    renderWithWeather(<ProvinceCard province={hurricane} />);
    const windText = screen.getByText(/Huracán/i);
    expect(windText).toBeInTheDocument();
    // El texto "(Huracán)" está en un span hijo; el span padre con el color es el abuelo
    const coloredSpan = windText.closest('span.text-xs');
    expect(coloredSpan).toHaveClass('text-red-400');
  });

  test('muestra mm de precipitación cuando hay lluvia', () => {
    const rainy = { ...mockProvince, current: { ...mockProvince.current, precip_mm: 12.5 } };
    renderWithWeather(<ProvinceCard province={rainy} />);
    expect(screen.getByText(/12\.5\s*mm/i)).toBeInTheDocument();
  });

  test('NO muestra sección de lluvia cuando precip_mm = 0', () => {
    renderWithWeather(<ProvinceCard province={mockProvince} />);
    expect(screen.queryByText(/mm/i)).not.toBeInTheDocument();
  });
});

describe('<ProvinceCard /> — Modo Emergencia con alerta activa', () => {
  test('muestra badge "🚨 ALERTA ACTIVA" cuando la provincia tiene una alerta', () => {
    renderWithWeather(
      <ProvinceCard province={provinceWithAlert} />,
      emergencyCtxWithAlert
    );
    expect(screen.getByText(/ALERTA ACTIVA/i)).toBeInTheDocument();
  });

  test('NO muestra badge en provincia sin alerta (aunque sea emergencia general)', () => {
    renderWithWeather(
      <ProvinceCard province={mockProvince} />,   // Distrito Nacional, sin alerta
      emergencyContextValue
    );
    expect(screen.queryByText(/ALERTA ACTIVA/i)).not.toBeInTheDocument();
  });
});
