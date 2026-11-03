import { describe, test, expect } from 'vitest';
import { screen, waitFor }    from '@testing-library/react';
import userEvent               from '@testing-library/user-event';
import { http, HttpResponse }  from 'msw';
import { server }              from '../../test/mocks/server';
import { renderWithWeather }   from '../../test/utils';
import AssistantPanel          from '../../components/AssistantPanel';

const API = 'http://localhost:3001/api';

const MOCK_RESPONSE = {
  success: true,
  data: {
    markdown:    '## Resumen Ejecutivo\nCondiciones normales en Santiago.\n\n| Hora | Temp |\n|------|------|\n| 12:00 | 29°C |',
    province:    'Santiago',
    provinceId:  'santiago',
    generatedAt: '2026-11-03T12:00:00.000Z',
  },
};

describe('AssistantPanel', () => {
  test('renderiza el panel con título y formulario', () => {
    renderWithWeather(<AssistantPanel />);

    expect(screen.getByText(/Asistente Meteorológico IA/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Seleccionar provincia/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Consulta meteorológica/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Consultar Asistente/i })).toBeInTheDocument();
  });

  test('el botón está deshabilitado cuando no hay provincia ni consulta', () => {
    renderWithWeather(<AssistantPanel />);
    const btn = screen.getByRole('button', { name: /Consultar Asistente/i });
    expect(btn).toBeDisabled();
  });

  test('muestra la respuesta markdown tras una consulta exitosa', async () => {
    server.use(
      http.post(`${API}/assistant/query`, () => HttpResponse.json(MOCK_RESPONSE))
    );

    const user = userEvent.setup();
    renderWithWeather(<AssistantPanel />);

    await user.selectOptions(
      screen.getByRole('combobox', { name: /Seleccionar provincia/i }),
      'santo_domingo'
    );

    await user.type(
      screen.getByRole('textbox', { name: /Consulta meteorológica/i }),
      '¿Cómo está el tiempo?'
    );

    await user.click(screen.getByRole('button', { name: /Consultar Asistente/i }));

    await waitFor(() => {
      expect(screen.getByText(/Resumen Ejecutivo/i)).toBeInTheDocument();
    });
  });

  test('muestra mensaje de error cuando la API falla', async () => {
    server.use(
      http.post(`${API}/assistant/query`, () =>
        HttpResponse.json({ success: false, error: 'Error de servidor' }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    renderWithWeather(<AssistantPanel />);

    await user.selectOptions(
      screen.getByRole('combobox', { name: /Seleccionar provincia/i }),
      'santo_domingo'
    );
    await user.type(
      screen.getByRole('textbox', { name: /Consulta meteorológica/i }),
      '¿Cómo está?'
    );
    await user.click(screen.getByRole('button', { name: /Consultar Asistente/i }));

    await waitFor(() => {
      expect(screen.getByText(/Error de servidor/i)).toBeInTheDocument();
    });
  });

  test('muestra consultas sugeridas cuando el textarea está vacío', () => {
    renderWithWeather(<AssistantPanel />);
    expect(screen.getByText(/¿Cómo está el tiempo hoy?/i)).toBeInTheDocument();
    expect(screen.getByText(/¿Habrá lluvia en las próximas horas?/i)).toBeInTheDocument();
  });

  test('al hacer clic en una sugerencia, se rellena el textarea', async () => {
    const user = userEvent.setup();
    renderWithWeather(<AssistantPanel />);

    await user.click(screen.getByText(/¿Cómo está el tiempo hoy?/i));

    const textarea = screen.getByRole('textbox', { name: /Consulta meteorológica/i });
    expect(textarea.value).toBe('¿Cómo está el tiempo hoy?');
  });
});
