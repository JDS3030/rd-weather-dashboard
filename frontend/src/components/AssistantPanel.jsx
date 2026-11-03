import { useState }       from 'react';
import ReactMarkdown       from 'react-markdown';
import remarkGfm           from 'remark-gfm';
import { useWeatherData }  from '../hooks/useWeatherData';
import { useAssistant }    from '../hooks/useAssistant';

const MAX_CHARS = 500;

const SUGGESTED_QUERIES = [
  '¿Cómo está el tiempo hoy?',
  '¿Habrá lluvia en las próximas horas?',
  '¿Cuál es el pronóstico para esta semana?',
];

export default function AssistantPanel() {
  const { provinces, alertState } = useWeatherData();
  const { loading, response, error, submitQuery, clear } = useAssistant();

  const isEmergency = alertState.isEmergency;

  const [provinceId, setProvinceId] = useState('');
  const [query,      setQuery]      = useState('');

  const canSubmit = provinceId && query.trim().length > 0 && !loading;

  function handleSubmit(e) {
    e.preventDefault();
    submitQuery(provinceId, query);
  }

  function handleSuggestion(text) {
    setQuery(text);
  }

  const borderCls = isEmergency
    ? 'border-red-600/70'
    : 'border-slate-200 dark:border-gray-700/50';

  const headerCls = isEmergency
    ? 'bg-red-900/30 border-red-800'
    : 'bg-slate-50 dark:bg-gray-900/40 border-slate-200 dark:border-gray-800';

  const titleCls = isEmergency ? 'text-red-200' : 'text-slate-700 dark:text-gray-300';

  return (
    <div className={`rounded-xl border overflow-hidden ${borderCls} bg-white dark:bg-gray-900/60`}>

      {/* Cabecera */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${headerCls}`}>
        <h2 className={`font-bold text-sm ${titleCls}`}>
          🤖 Asistente Meteorológico IA
        </h2>
        {response && (
          <button
            onClick={clear}
            aria-label="Borrar respuesta del asistente"
            className="text-xs text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
          >
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="p-3 space-y-2">
        <select
          value={provinceId}
          onChange={e => setProvinceId(e.target.value)}
          aria-label="Seleccionar provincia"
          className={`w-full text-xs rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isEmergency
              ? 'bg-red-950/20 border-red-800 text-red-200'
              : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200'
          }`}
        >
          <option value="">— Selecciona una provincia —</option>
          {provinces.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <div className="relative">
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Escribe tu consulta meteorológica…"
            rows={2}
            aria-label="Consulta meteorológica"
            className={`w-full text-xs rounded-lg border px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isEmergency
                ? 'bg-red-950/20 border-red-800 text-red-200 placeholder-red-700'
                : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-500'
            }`}
          />
          <span className="absolute bottom-1 right-2 text-xs text-slate-300 dark:text-gray-600 pointer-events-none">
            {query.length}/{MAX_CHARS}
          </span>
        </div>

        {/* Consultas sugeridas */}
        {!query && (
          <div className="flex flex-wrap gap-1">
            {SUGGESTED_QUERIES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestion(s)}
                className="text-xs px-2 py-0.5 rounded-full border border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full text-xs font-semibold py-1.5 rounded-lg transition-colors ${
            isEmergency
              ? 'bg-red-700 hover:bg-red-600 text-white'
              : 'bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600 text-white'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {loading ? '⟳ Consultando IA...' : '✦ Consultar Asistente'}
        </button>
      </form>

      {/* Estado de carga */}
      {loading && (
        <div className="px-4 pb-4 text-center">
          <p className="text-xs text-slate-400 dark:text-gray-500 animate-pulse">
            Analizando datos meteorológicos…
          </p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-300">⚠️ {error}</p>
        </div>
      )}

      {/* Respuesta markdown */}
      {response && !loading && (
        <div className="border-t border-slate-100 dark:border-gray-800">
          <div className="px-3 pt-2 pb-1 flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-gray-500 font-mono">
              {response.province} — {new Date(response.generatedAt).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-semibold">
              IA
            </span>
          </div>
          <div className="px-3 pb-3 max-h-96 overflow-y-auto">
            <div className="prose prose-xs dark:prose-invert max-w-none
              prose-headings:text-slate-700 dark:prose-headings:text-gray-200
              prose-headings:text-xs prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-1
              prose-p:text-xs prose-p:text-slate-600 dark:prose-p:text-gray-300 prose-p:my-1
              prose-li:text-xs prose-li:text-slate-600 dark:prose-li:text-gray-300
              prose-strong:text-slate-700 dark:prose-strong:text-gray-200
              prose-code:text-xs prose-code:bg-slate-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded
              prose-table:text-xs
              prose-th:text-xs prose-th:font-semibold prose-th:text-slate-600 dark:prose-th:text-gray-300 prose-th:p-1
              prose-td:text-xs prose-td:text-slate-600 dark:prose-td:text-gray-300 prose-td:p-1"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {response.markdown}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
