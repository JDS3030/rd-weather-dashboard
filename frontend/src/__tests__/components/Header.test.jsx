import { describe, test, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import Header from '../../components/Header';
import {
  renderWithWeather,
  normalContextValue,
  emergencyContextValue,
  loadingContextValue,
} from '../../test/utils';

describe('<Header /> — Modo Normal', () => {
  test('renderiza el nombre de la app', () => {
    renderWithWeather(<Header />);
    expect(screen.getByText('Dashboard Climático RD')).toBeInTheDocument();
  });

  test('muestra badge verde "✓ Normal"', () => {
    renderWithWeather(<Header />);
    expect(screen.getByText('✓ Normal')).toBeInTheDocument();
  });

  test('muestra la hora de última actualización formateada', () => {
    renderWithWeather(<Header />);
    // Verifica que hay un texto con formato de hora (HH:MM:SS)
    expect(screen.getByText(/\d{1,2}:\d{2}:\d{2}/)).toBeInTheDocument();
  });

  test('muestra "--:--" cuando lastUpdate es null', () => {
    renderWithWeather(<Header />, loadingContextValue);
    expect(screen.getByText(/--:--/)).toBeInTheDocument();
  });

  test('el botón de refresh llama a context.refresh()', () => {
    const refresh = vi.fn();
    renderWithWeather(<Header />, { ...normalContextValue, refresh });
    fireEvent.click(screen.getByTitle('Actualizar ahora'));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  test('el botón de refresh está deshabilitado mientras isLoading=true', () => {
    renderWithWeather(<Header />, loadingContextValue);
    expect(screen.getByTitle('Actualizar ahora')).toBeDisabled();
  });
});

describe('<Header /> — Modo Emergencia', () => {
  test('muestra "⚠️ ALERTA ACTIVA" como título', () => {
    renderWithWeather(<Header />, emergencyContextValue);
    expect(screen.getByText('⚠️ ALERTA ACTIVA')).toBeInTheDocument();
  });

  test('muestra badge rojo "🚨 EMERGENCIA"', () => {
    renderWithWeather(<Header />, emergencyContextValue);
    expect(screen.getByText('🚨 EMERGENCIA')).toBeInTheDocument();
  });

  test('badge de emergencia tiene clase animate-pulse', () => {
    renderWithWeather(<Header />, emergencyContextValue);
    const badge = screen.getByText('🚨 EMERGENCIA').closest('span');
    expect(badge).toHaveClass('animate-pulse');
  });
});
