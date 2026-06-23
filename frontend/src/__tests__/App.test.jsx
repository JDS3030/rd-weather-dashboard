import { describe, test, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import App from '../App';
import { mockAlertEmergency } from '../test/mocks/handlers';

describe('<App /> — Integración', () => {
  test('muestra la pantalla de carga durante el fetch inicial', () => {
    render(<App />);
    expect(screen.getByText('Cargando datos meteorológicos...')).toBeInTheDocument();
  });

  test('renderiza el Dashboard después de que los datos se cargan', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.queryByText('Cargando datos meteorológicos...')).not.toBeInTheDocument()
    );
    expect(screen.getByText('Dashboard Climático RD')).toBeInTheDocument();
  });

  test('NO muestra EmergencyBanner en modo normal', async () => {
    render(<App />);
    await waitFor(() =>
      expect(screen.queryByText('Cargando datos meteorológicos...')).not.toBeInTheDocument()
    );
    expect(screen.queryByText('⚠ EMERGENCIA')).not.toBeInTheDocument();
  });

  test('muestra el badge de alerta "✓ Normal" una vez cargado', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('✓ Normal')).toBeInTheDocument());
  });
});

describe('<App /> — Modo Emergencia (MSW override)', () => {
  test('muestra EmergencyBanner cuando la API retorna emergencia activa', async () => {
    server.use(
      http.get('http://localhost:3001/api/alerts/status', () =>
        HttpResponse.json({ success: true, data: mockAlertEmergency })
      )
    );

    render(<App />);
    await waitFor(() =>
      expect(screen.getByText('⚠ EMERGENCIA')).toBeInTheDocument()
    );
  });

  test('el banner de emergencia muestra el conteo total de alertas activas', async () => {
    server.use(
      http.get('http://localhost:3001/api/alerts/status', () =>
        HttpResponse.json({ success: true, data: mockAlertEmergency })
      )
    );

    render(<App />);
    // 2 triggers + 1 onaMetAlert = 3 alertas totales mostradas en el banner
    await waitFor(() =>
      expect(screen.getByText('alertas')).toBeInTheDocument()
    );
  });

  test('muestra badge rojo "🚨 EMERGENCIA" en el Header', async () => {
    server.use(
      http.get('http://localhost:3001/api/alerts/status', () =>
        HttpResponse.json({ success: true, data: mockAlertEmergency })
      )
    );

    render(<App />);
    await waitFor(() =>
      expect(screen.getByText('🚨 EMERGENCIA')).toBeInTheDocument()
    );
  });
});

describe('<App /> — Error de backend', () => {
  test('muestra pantalla de error cuando el backend no responde', async () => {
    server.use(
      http.get('http://localhost:3001/api/weather', () => HttpResponse.error()),
      http.get('http://localhost:3001/api/alerts/status', () => HttpResponse.error()),
      http.get('http://localhost:3001/api/reports/latest', () => HttpResponse.error()),
    );

    render(<App />);
    await waitFor(() =>
      expect(screen.queryByText('Cargando datos meteorológicos...')).not.toBeInTheDocument()
    );
    expect(screen.getByText('Error de Conexión')).toBeInTheDocument();
  });

  test('muestra el mensaje de error de conexión', async () => {
    server.use(
      http.get('http://localhost:3001/api/weather', () => HttpResponse.error()),
    );

    render(<App />);
    await waitFor(() =>
      expect(screen.queryByText('Cargando datos meteorológicos...')).not.toBeInTheDocument()
    );
    expect(screen.getByText(/No se pudo conectar/i)).toBeInTheDocument();
  });
});
