import { describe, test, expect } from 'vitest';
import { screen } from '@testing-library/react';
import Dashboard from '../../components/Dashboard';
import {
  renderWithWeather,
  normalContextValue,
  emergencyContextValue,
  loadingContextValue,
  errorContextValue,
} from '../../test/utils';

describe('<Dashboard /> — Pantalla de carga', () => {
  test('muestra el spinner cuando isLoading=true y provinces=[]', () => {
    renderWithWeather(<Dashboard />, loadingContextValue);
    expect(screen.getByText('Cargando datos meteorológicos...')).toBeInTheDocument();
  });

  test('muestra el subtítulo con las fuentes durante la carga', () => {
    renderWithWeather(<Dashboard />, loadingContextValue);
    expect(screen.getByText(/ONAMET \/ WeatherAPI/i)).toBeInTheDocument();
  });

  test('NO renderiza el header principal durante la carga', () => {
    renderWithWeather(<Dashboard />, loadingContextValue);
    expect(screen.queryByText('Dashboard Climático RD')).not.toBeInTheDocument();
  });
});

describe('<Dashboard /> — Pantalla de error', () => {
  test('muestra "Error de Conexión" cuando hay error y provinces=[]', () => {
    renderWithWeather(<Dashboard />, errorContextValue);
    expect(screen.getByText('Error de Conexión')).toBeInTheDocument();
  });

  test('muestra el mensaje de error específico del contexto', () => {
    renderWithWeather(<Dashboard />, errorContextValue);
    expect(screen.getByText(/No se pudo conectar/i)).toBeInTheDocument();
  });

  test('muestra referencia al puerto del backend', () => {
    renderWithWeather(<Dashboard />, errorContextValue);
    expect(screen.getByText(/localhost:3001/i)).toBeInTheDocument();
  });

  test('NO renderiza el header principal en la pantalla de error', () => {
    renderWithWeather(<Dashboard />, errorContextValue);
    expect(screen.queryByText('Dashboard Climático RD')).not.toBeInTheDocument();
  });
});

describe('<Dashboard /> — Modo Normal', () => {
  test('renderiza el Header con el nombre de la aplicación', () => {
    renderWithWeather(<Dashboard />);
    expect(screen.getByText('Dashboard Climático RD')).toBeInTheDocument();
  });

  test('muestra el conteo correcto de provincias en el heading', () => {
    renderWithWeather(<Dashboard />);
    // normalContextValue tiene 4 provincias (mockProvinces)
    expect(screen.getByText(/Estado por Punto Cardinal.*4 provincias/i)).toBeInTheDocument();
  });

  test('renderiza una tarjeta ProvinceCard por cada provincia del contexto', () => {
    renderWithWeather(<Dashboard />);
    expect(screen.getByText('Distrito Nacional')).toBeInTheDocument();
    expect(screen.getByText('Santiago')).toBeInTheDocument();
    expect(screen.getByText('La Vega')).toBeInTheDocument();
    // Puerto Plata también aparece en StatsOverview como provincia de viento máximo
    expect(screen.getAllByText('Puerto Plata').length).toBeGreaterThanOrEqual(2);
  });

  test('muestra la sección de créditos con el número de emergencias', () => {
    renderWithWeather(<Dashboard />);
    expect(screen.getByText('Emergencias: 911')).toBeInTheDocument();
  });

  test('muestra las fuentes oficiales en el panel de créditos', () => {
    renderWithWeather(<Dashboard />);
    // Los créditos aparecen en el sidebar de Dashboard
    expect(screen.getByText(/Defensa Civil RD/i)).toBeInTheDocument();
  });

  test('NO muestra el indicador de actualización rápida en modo normal', () => {
    renderWithWeather(<Dashboard />);
    expect(screen.queryByText(/Actualización cada 60 s/i)).not.toBeInTheDocument();
  });
});

describe('<Dashboard /> — Modo Emergencia', () => {
  test('muestra el indicador "⟳ Actualización cada 60 s"', () => {
    renderWithWeather(<Dashboard />, emergencyContextValue);
    expect(screen.getByText(/Actualización cada 60 s/i)).toBeInTheDocument();
  });
});

describe('<Dashboard /> — Sin datos de provincias (sin error)', () => {
  test('muestra "0 provincias" en el heading cuando provinces=[]', () => {
    renderWithWeather(<Dashboard />, { ...normalContextValue, provinces: [] });
    expect(screen.getByText(/Estado por Punto Cardinal.*0 provincias/i)).toBeInTheDocument();
  });

  test('sigue mostrando los cuadrantes cardinales cuando provinces=[]', () => {
    renderWithWeather(<Dashboard />, { ...normalContextValue, provinces: [] });
    expect(screen.getAllByText(/Norte/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Este/i).length).toBeGreaterThanOrEqual(1);
  });
});
