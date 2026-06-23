import { useWeatherData } from '../hooks/useWeatherData';

export default function Header() {
  const { alertState, lastUpdate, isLoading, refresh, isStale, staleFrom } = useWeatherData();
  const { isEmergency, level } = alertState;

  const staleLabel = staleFrom
    ? new Date(staleFrom).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
    : lastUpdate?.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }) ?? '--:--';

  const LEVEL_LABEL = {
    normal:    { text: '✓ Normal',      cls: 'bg-emerald-700/40 text-emerald-300 border border-emerald-700/50' },
    watch:     { text: '👁 Vigilancia', cls: 'bg-yellow-700/40 text-yellow-300 border border-yellow-700/50' },
    warning:   { text: '⚠ Aviso',      cls: 'bg-orange-600/50 text-orange-200 border border-orange-600' },
    emergency: { text: '🚨 EMERGENCIA', cls: 'bg-red-600 text-white animate-pulse border border-red-400' },
  };

  const badge = LEVEL_LABEL[level] || LEVEL_LABEL.normal;

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-all duration-500 ${
      isEmergency
        ? 'bg-red-950/90 border-red-700'
        : 'bg-gray-900/90 border-gray-800'
    }`}>
      {isStale && (
        <div className="w-full bg-yellow-900/80 border-b border-yellow-700/60 px-4 py-1.5 flex items-center justify-center gap-2">
          <span className="text-yellow-400 text-xs">⚠</span>
          <span className="text-yellow-300 text-xs font-semibold">
            Mostrando datos anteriores del {staleLabel} — sin conexión con la fuente
          </span>
          <button
            onClick={refresh}
            className="ml-2 text-yellow-400 hover:text-yellow-200 text-xs underline underline-offset-2"
          >
            Reintentar
          </button>
        </div>
      )}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Logo + Título */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
            isEmergency ? 'bg-red-700 animate-pulse' : 'bg-blue-700'
          }`}>
            {isEmergency ? '🌀' : '🌤️'}
          </div>
          <div className="min-w-0">
            <h1 className={`font-bold text-base leading-none truncate ${
              isEmergency ? 'text-red-100' : 'text-white'
            }`}>
              {isEmergency ? '⚠️ ALERTA ACTIVA' : 'Dashboard Climático RD'}
            </h1>
            <p className={`text-xs truncate ${isEmergency ? 'text-red-400' : 'text-gray-500'}`}>
              República Dominicana · ONAMET / WeatherAPI
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Badge de nivel */}
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badge.cls}`}>
            {badge.text}
          </span>

          {/* Última actualización */}
          <div className="hidden sm:block text-right">
            <p className={`text-xs ${isStale ? 'text-yellow-600' : isEmergency ? 'text-red-500' : 'text-gray-600'}`}>
              {isStale ? '⚠ Datos anteriores' : 'Actualizado'}
            </p>
            <p className={`text-xs font-mono ${isStale ? 'text-yellow-400' : isEmergency ? 'text-red-300' : 'text-gray-300'}`}>
              {lastUpdate ? lastUpdate.toLocaleTimeString('es-DO') : '--:--'}
            </p>
          </div>

          {/* Botón de refresh */}
          <button
            onClick={refresh}
            disabled={isLoading}
            title="Actualizar ahora"
            className={`p-2 rounded-lg transition-colors ${
              isEmergency
                ? 'bg-red-800 hover:bg-red-700 text-red-100'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            } disabled:opacity-40`}
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Flag RD */}
          <span className="hidden md:flex items-center gap-1 text-xs text-gray-600">
            🇩🇴 <span>RD</span>
          </span>
        </div>
      </div>
    </header>
  );
}
