import { describe, test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import EmergencyBanner from '../../components/EmergencyBanner';
import {
  renderWithWeather,
  emergencyContextValue,
} from '../../test/utils';

// Contexto solo con triggers de viento y sin alertas ONAMET
const onlyTriggersCtx = {
  ...emergencyContextValue,
  alertState: {
    ...emergencyContextValue.alertState,
    onaMetAlerts: [],
    activatedAt: null,
    triggers: [
      { source: 'WeatherAPI-Wind', province: 'Monte Cristi', windKph: 125, level: 'Huracán Categoría 1+' },
    ],
  },
};

describe('<EmergencyBanner /> — Con alerta ONAMET', () => {
  test('muestra la etiqueta "⚠ EMERGENCIA"', () => {
    renderWithWeather(<EmergencyBanner />, emergencyContextValue);
    expect(screen.getByText('⚠ EMERGENCIA')).toBeInTheDocument();
  });

  test('muestra el título del alerta ONAMET principal', () => {
    renderWithWeather(<EmergencyBanner />, emergencyContextValue);
    expect(screen.getByText('AVISO ESPECIAL Nº1: TORMENTA TROPICAL')).toBeInTheDocument();
  });

  test('muestra la descripción del alerta ONAMET', () => {
    renderWithWeather(<EmergencyBanner />, emergencyContextValue);
    expect(screen.getByText(/Vientos sostenidos de 95 km\/h/i)).toBeInTheDocument();
  });

  test('muestra "Activo desde:" cuando activatedAt tiene valor', () => {
    renderWithWeather(<EmergencyBanner />, emergencyContextValue);
    expect(screen.getByText(/Activo desde:/i)).toBeInTheDocument();
  });

  test('muestra las regiones afectadas como chips', () => {
    renderWithWeather(<EmergencyBanner />, emergencyContextValue);
    expect(screen.getByText('Norte')).toBeInTheDocument();
    expect(screen.getByText('Nordeste')).toBeInTheDocument();
    expect(screen.getByText('Sur')).toBeInTheDocument();
  });

  test('muestra el total de alertas en el contador', () => {
    renderWithWeather(<EmergencyBanner />, emergencyContextValue);
    // 2 triggers + 1 onaMetAlert = 3
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('alertas')).toBeInTheDocument();
  });

  test('el ticker contiene la entrada ONAMET', () => {
    const { container } = renderWithWeather(<EmergencyBanner />, emergencyContextValue);
    const ticker = container.querySelector('.ticker-content');
    expect(ticker?.textContent).toContain('ONAMET:');
    expect(ticker?.textContent).toContain('TORMENTA TROPICAL');
  });

  test('el ticker contiene datos del trigger de viento', () => {
    const { container } = renderWithWeather(<EmergencyBanner />, emergencyContextValue);
    const ticker = container.querySelector('.ticker-content');
    expect(ticker?.textContent).toContain('Monte Cristi:');
    expect(ticker?.textContent).toContain('125 km/h');
  });
});

describe('<EmergencyBanner /> — Solo triggers de viento (sin ONAMET)', () => {
  test('NO muestra "Activo desde:" cuando activatedAt es null', () => {
    renderWithWeather(<EmergencyBanner />, onlyTriggersCtx);
    expect(screen.queryByText(/Activo desde:/i)).not.toBeInTheDocument();
  });

  test('el título usa la velocidad del trigger cuando no hay ONAMET', () => {
    renderWithWeather(<EmergencyBanner />, onlyTriggersCtx);
    expect(screen.getByText(/Vientos de 125 km\/h — Huracán Categoría 1\+/i)).toBeInTheDocument();
  });

  test('NO muestra chips de regiones afectadas cuando no hay alerta ONAMET', () => {
    renderWithWeather(<EmergencyBanner />, onlyTriggersCtx);
    expect(screen.queryByText(/Regiones:/i)).not.toBeInTheDocument();
  });

  test('el contador muestra solo la cantidad de triggers', () => {
    renderWithWeather(<EmergencyBanner />, onlyTriggersCtx);
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
