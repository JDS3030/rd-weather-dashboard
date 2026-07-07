import { useState }          from 'react';
import { useWeatherData }    from '../hooks/useWeatherData';
import { useAlertHistory }   from '../hooks/useAlertHistory';

const LEVEL_COLOR = {
  normal:    'text-emerald-500',
  watch:     'text-yellow-500',
  warning:   'text-orange-500',
  emergency: 'text-red-500',
};
const LEVEL_LABEL = {
  normal:    'Normal',
  watch:     'Vigilancia',
  warning:   'Aviso',
  emergency: 'EMERGENCIA',
};
const LEVEL_ARROW = {
  up:   '↑',
  down: '↓',
  same: '→',
};
const LEVEL_ORDER = { normal: 0, watch: 1, warning: 2, emergency: 3 };

function TriggerRow({ t }) {
  const icon = t.source === 'ONAMET'         ? '🏛️'
             : t.source.includes('Wind')     ? '💨'
             : t.source.includes('Alert')    ? '📡'
             : '⚠️';
  const detail = t.title         ? t.title
               : t.alertText     ? t.alertText
               : t.conditionText ? t.conditionText
               : t.windKph       ? `${t.windKph} km/h (${t.level})`
               : t.keyword;

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-slate-100 dark:border-gray-800/60 last:border-0">
      <span className="flex-shrink-0 text-sm pt-px">{icon}</span>
      <div className="min-w-0">
        <p className="text-slate-400 dark:text-gray-400 text-xs">{t.source}{t.province ? ` · ${t.province}` : ''}</p>
        <p className="text-slate-700 dark:text-gray-200 text-xs leading-snug line-clamp-2">{detail}</p>
        {t.description && (
          <p className="text-slate-400 dark:text-gray-500 text-xs mt-0.5 line-clamp-2">{t.description}</p>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ entry }) {
  const isUp    = (LEVEL_ORDER[entry.to] ?? 0) > (LEVEL_ORDER[entry.from] ?? 0);
  const arrow   = isUp ? LEVEL_ARROW.up : LEVEL_ARROW.down;
  const fecha   = new Date(entry.timestamp).toLocaleString('es-DO', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-gray-800/50 last:border-0">
      <span className={`text-xs font-bold flex-shrink-0 ${isUp ? 'text-red-400' : 'text-emerald-400'}`}>
        {arrow}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-600 dark:text-gray-300">
          <span className={`font-semibold ${LEVEL_COLOR[entry.from] ?? 'text-slate-500'}`}>
            {LEVEL_LABEL[entry.from] ?? entry.from}
          </span>
          {' → '}
          <span className={`font-semibold ${LEVEL_COLOR[entry.to] ?? 'text-slate-500'}`}>
            {LEVEL_LABEL[entry.to] ?? entry.to}
          </span>
          {entry.province && <span className="text-slate-400 dark:text-gray-500"> · {entry.province}</span>}
        </p>
      </div>
      <span className="text-slate-400 dark:text-gray-600 text-xs flex-shrink-0 font-mono">{fecha}</span>
    </div>
  );
}

export default function AlertPanel() {
  const { alertState }              = useWeatherData();
  const { history, clearHistory }   = useAlertHistory(alertState);
  const { triggers = [], onaMetAlerts = [] } = alertState;
  const isEmergency = alertState.isEmergency;
  const total       = triggers.length + onaMetAlerts.length;

  const [tab, setTab] = useState('alertas'); // 'alertas' | 'historial'

  return (
    <div className={`rounded-xl border overflow-hidden ${
      isEmergency ? 'border-red-600/70' : 'border-slate-200 dark:border-gray-700/50'
    } bg-white dark:bg-gray-900/60`}>

      {/* Cabecera */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        isEmergency
          ? 'bg-red-900/30 border-red-800'
          : 'bg-slate-50 dark:bg-gray-900/40 border-slate-200 dark:border-gray-800'
      }`}>
        <h2 className={`font-bold text-sm ${isEmergency ? 'text-red-200' : 'text-slate-700 dark:text-gray-300'}`}>
          🚨 Panel de Alertas
        </h2>
        {total > 0 && (
          <span className="bg-red-600 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
            {total}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${
        isEmergency ? 'border-red-900/40' : 'border-slate-200 dark:border-gray-800'
      }`}>
        {[
          { key: 'alertas',   label: 'Activas',    ariaLabel: 'Ver alertas activas' },
          { key: 'historial', label: `Historial${history.length ? ` (${history.length})` : ''}`, ariaLabel: `Ver historial de cambios${history.length ? `, ${history.length} registros` : ''}` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            aria-label={t.ariaLabel}
            aria-selected={tab === t.key}
            role="tab"
            className={`flex-1 py-2 text-xs font-semibold transition-colors ${
              tab === t.key
                ? isEmergency
                  ? 'text-red-300 border-b-2 border-red-400'
                  : 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
                : isEmergency
                  ? 'text-red-600 hover:text-red-300'
                  : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido del tab activo */}
      <div className="max-h-56 overflow-y-auto">

        {/* Tab: Alertas activas */}
        {tab === 'alertas' && (
          <div className="p-3">
            {total === 0 ? (
              <div className="flex items-center gap-2 py-2">
                <span className="text-emerald-500">✅</span>
                <p className="text-slate-400 dark:text-gray-500 text-sm">Sin alertas. Condiciones normales.</p>
              </div>
            ) : (
              <>
                {onaMetAlerts.map((a, i) => (
                  <TriggerRow key={`onamet-${i}`} t={{ ...a, source: 'ONAMET' }} />
                ))}
                {triggers.map((t, i) => (
                  <TriggerRow key={`trigger-${i}`} t={t} />
                ))}
              </>
            )}
          </div>
        )}

        {/* Tab: Historial de cambios */}
        {tab === 'historial' && (
          <div className="p-3">
            {history.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-slate-400 dark:text-gray-500 text-xs">
                  Sin cambios registrados en esta sesión.
                </p>
                <p className="text-slate-300 dark:text-gray-600 text-xs mt-1">
                  Se guardarán los últimos 10 cambios de nivel.
                </p>
              </div>
            ) : (
              <>
                {history.map(e => <HistoryRow key={e.id} entry={e} />)}
                <button
                  onClick={clearHistory}
                  aria-label="Borrar todo el historial de alertas"
                  className="mt-2 w-full text-xs text-slate-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  Limpiar historial
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
