import { describe, test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import AlertPanel from '../../components/AlertPanel';
import {
  renderWithWeather,
  normalContextValue,
  emergencyContextValue,
} from '../../test/utils';

describe('<AlertPanel /> — Sin alertas', () => {
  test('muestra el título del panel', () => {
    renderWithWeather(<AlertPanel />);
    expect(screen.getByText('🚨 Panel de Alertas')).toBeInTheDocument();
  });

  test('muestra mensaje de condiciones normales cuando no hay alertas', () => {
    renderWithWeather(<AlertPanel />);
    expect(screen.getByText('Sin alertas. Condiciones normales.')).toBeInTheDocument();
  });

  test('NO muestra badge contador cuando total = 0', () => {
    const { container } = renderWithWeather(<AlertPanel />);
    expect(container.querySelector('.bg-red-600.rounded-full')).toBeNull();
  });

  test('el contenedor usa borde gris en modo normal', () => {
    const { container } = renderWithWeather(<AlertPanel />);
    expect(container.firstChild.className).toMatch(/border-gray-700/);
  });
});

describe('<AlertPanel /> — Con alertas activas', () => {
  test('muestra badge con el total de alertas (triggers + onaMetAlerts)', () => {
    renderWithWeather(<AlertPanel />, emergencyContextValue);
    // 2 triggers + 1 onaMetAlert = 3
    const badge = screen.getByText('3');
    expect(badge).toHaveClass('bg-red-600');
  });

  test('renderiza el título del alerta ONAMET', () => {
    renderWithWeather(<AlertPanel />, emergencyContextValue);
    expect(screen.getByText('AVISO ESPECIAL Nº1: TORMENTA TROPICAL')).toBeInTheDocument();
  });

  test('renderiza la descripción del alerta ONAMET', () => {
    renderWithWeather(<AlertPanel />, emergencyContextValue);
    expect(screen.getByText(/Vientos sostenidos de 95 km\/h/i)).toBeInTheDocument();
  });

  test('renderiza el detalle de velocidad del trigger de viento', () => {
    renderWithWeather(<AlertPanel />, emergencyContextValue);
    expect(screen.getByText(/125 km\/h \(Huracán Categoría 1\+\)/i)).toBeInTheDocument();
  });

  test('renderiza la fuente y provincia del trigger', () => {
    renderWithWeather(<AlertPanel />, emergencyContextValue);
    expect(screen.getByText(/WeatherAPI-Wind · Monte Cristi/i)).toBeInTheDocument();
  });

  test('el contenedor usa borde rojo en modo emergencia', () => {
    const { container } = renderWithWeather(<AlertPanel />, emergencyContextValue);
    expect(container.firstChild.className).toMatch(/border-red-600/);
  });
});
