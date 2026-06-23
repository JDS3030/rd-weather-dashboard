import { describe, test, expect, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';
import ReportPanel from '../../components/ReportPanel';
import {
  renderWithWeather,
  normalContextValue,
  emergencyContextValue,
} from '../../test/utils';
import { mockReport } from '../../test/mocks/handlers';

const emergencyReport = { ...mockReport, type: 'emergency' };

describe('<ReportPanel /> — Sin reporte', () => {
  test('muestra "Sin reportes generados." cuando latestReport es null', () => {
    renderWithWeather(<ReportPanel />, { ...normalContextValue, latestReport: null });
    expect(screen.getByText('Sin reportes generados.')).toBeInTheDocument();
  });

  test('muestra botón "Generar ahora" como enlace de acción', () => {
    renderWithWeather(<ReportPanel />, { ...normalContextValue, latestReport: null });
    expect(screen.getByText('Generar ahora')).toBeInTheDocument();
  });
});

describe('<ReportPanel /> — Con reporte diario', () => {
  test('muestra el título "Reporte Diario" en modo normal', () => {
    renderWithWeather(<ReportPanel />);
    expect(screen.getByText('📄 Reporte Diario')).toBeInTheDocument();
  });

  test('muestra el badge "📊 Diario"', () => {
    renderWithWeather(<ReportPanel />);
    expect(screen.getByText('📊 Diario')).toBeInTheDocument();
  });

  test('muestra el resumen del reporte', () => {
    renderWithWeather(<ReportPanel />);
    expect(screen.getByText(/Temperatura promedio:/i)).toBeInTheDocument();
  });

  test('muestra la fecha de generación del reporte', () => {
    renderWithWeather(<ReportPanel />);
    // La fecha proviene de mockReport.generatedAt = '2026-06-22T14:00:00.000Z'
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  test('el botón de generar está habilitado cuando no está procesando', () => {
    renderWithWeather(<ReportPanel />);
    expect(screen.getByText('↻ Generar')).not.toBeDisabled();
  });
});

describe('<ReportPanel /> — Modo Emergencia', () => {
  test('muestra "Reporte de Emergencia" como título en modo emergencia', () => {
    renderWithWeather(<ReportPanel />, emergencyContextValue);
    expect(screen.getByText('📄 Reporte de Emergencia')).toBeInTheDocument();
  });

  test('muestra badge "🚨 Emergencia" cuando el reporte es de tipo emergency', () => {
    renderWithWeather(
      <ReportPanel />,
      { ...emergencyContextValue, latestReport: emergencyReport }
    );
    expect(screen.getByText('🚨 Emergencia')).toBeInTheDocument();
  });
});

describe('<ReportPanel /> — Generación de reporte', () => {
  test('al hacer click en Generar, llama refresh() después del POST', async () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    renderWithWeather(<ReportPanel />, { ...normalContextValue, refresh });

    fireEvent.click(screen.getByText('↻ Generar'));

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
  });

  test('el botón muestra "⟳ Generando..." mientras procesa la petición', async () => {
    let resolvePost;
    server.use(
      http.post('http://localhost:3001/api/reports/generate', () =>
        new Promise(resolve => { resolvePost = resolve; })
      )
    );

    const refresh = vi.fn().mockResolvedValue(undefined);
    renderWithWeather(<ReportPanel />, { ...normalContextValue, refresh });

    fireEvent.click(screen.getByText('↻ Generar'));

    await waitFor(() =>
      expect(screen.getByText('⟳ Generando...')).toBeInTheDocument()
    );

    // Resolver el POST para limpiar el estado pendiente
    resolvePost(HttpResponse.json({ success: true, data: mockReport }));

    await waitFor(() =>
      expect(screen.getByText('↻ Generar')).toBeInTheDocument()
    );
  });

  test('en emergencia el POST envía type=emergency', async () => {
    let capturedType;
    server.use(
      http.post('http://localhost:3001/api/reports/generate', ({ request }) => {
        const url = new URL(request.url);
        capturedType = url.searchParams.get('type');
        return HttpResponse.json({ success: true, data: emergencyReport });
      })
    );

    const refresh = vi.fn().mockResolvedValue(undefined);
    renderWithWeather(<ReportPanel />, { ...emergencyContextValue, refresh });

    fireEvent.click(screen.getByText('↻ Generar'));

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(capturedType).toBe('emergency');
  });

  test('en modo normal el POST envía type=daily', async () => {
    let capturedType;
    server.use(
      http.post('http://localhost:3001/api/reports/generate', ({ request }) => {
        const url = new URL(request.url);
        capturedType = url.searchParams.get('type');
        return HttpResponse.json({ success: true, data: mockReport });
      })
    );

    const refresh = vi.fn().mockResolvedValue(undefined);
    renderWithWeather(<ReportPanel />, { ...normalContextValue, refresh });

    fireEvent.click(screen.getByText('↻ Generar'));

    await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    expect(capturedType).toBe('daily');
  });
});
