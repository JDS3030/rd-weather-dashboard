import { useWeatherData } from '../hooks/useWeatherData';

function TriggerRow({ t }) {
  const icon = t.source === 'ONAMET'         ? '🏛️'
             : t.source.includes('Wind')     ? '💨'
             : t.source.includes('Alert')    ? '📡'
             : '⚠️';
  const detail = t.title          ? t.title
               : t.alertText      ? t.alertText
               : t.conditionText  ? t.conditionText
               : t.windKph        ? `${t.windKph} km/h (${t.level})`
               : t.keyword;

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="flex-shrink-0 text-sm pt-px">{icon}</span>
      <div className="min-w-0">
        <p className="text-gray-400 text-xs">{t.source}{t.province ? ` · ${t.province}` : ''}</p>
        <p className="text-gray-200 text-xs leading-snug line-clamp-2">{detail}</p>
        {t.description && (
          <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{t.description}</p>
        )}
      </div>
    </div>
  );
}

export default function AlertPanel() {
  const { alertState } = useWeatherData();
  const { triggers = [], onaMetAlerts = [] } = alertState;
  const isEmergency  = alertState.isEmergency;
  const total        = triggers.length + onaMetAlerts.length;

  return (
    <div className={`rounded-xl border overflow-hidden ${
      isEmergency ? 'border-red-600/70' : 'border-gray-700/50'
    } bg-gray-900/60`}>
      {/* Cabecera */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        isEmergency ? 'bg-red-900/30 border-red-800' : 'bg-gray-900/40 border-gray-800'
      }`}>
        <h2 className={`font-bold text-sm ${isEmergency ? 'text-red-200' : 'text-gray-300'}`}>
          🚨 Panel de Alertas
        </h2>
        {total > 0 && (
          <span className="bg-red-600 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center">
            {total}
          </span>
        )}
      </div>

      <div className="p-3 max-h-64 overflow-y-auto">
        {total === 0 ? (
          <div className="flex items-center gap-2 py-2">
            <span className="text-emerald-500">✅</span>
            <p className="text-gray-500 text-sm">Sin alertas. Condiciones normales.</p>
          </div>
        ) : (
          <>
            {/* Alertas ONAMET */}
            {onaMetAlerts.map((a, i) => (
              <TriggerRow key={`onamet-${i}`} t={{ ...a, source: 'ONAMET' }} />
            ))}
            {/* Detonadores WeatherAPI */}
            {triggers.map((t, i) => (
              <TriggerRow key={`trigger-${i}`} t={t} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
