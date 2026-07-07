import { useWeatherData }     from '../hooks/useWeatherData';
import { useTheme }           from '../context/ThemeContext';
import { useNotifications }   from '../hooks/useNotifications';

export default function Header() {
  const { alertState, lastUpdate, isLoading, refresh, isStale, staleFrom } = useWeatherData();
  const { isDark, toggleTheme }       = useTheme();
  const { permission, requestPermission } = useNotifications(alertState);
  const { isEmergency, level } = alertState;

  const staleLabel = staleFrom
    ? new Date(staleFrom).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
    : lastUpdate?.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }) ?? '--:--';

  const LEVEL_LABEL = {
    normal:    { text: '✓ Normal',      short: '✓',   cls: 'bg-emerald-700/40 text-emerald-300 border border-emerald-700/50' },
    watch:     { text: '👁 Vigilancia', short: '👁',  cls: 'bg-yellow-700/40 text-yellow-300 border border-yellow-700/50' },
    warning:   { text: '⚠ Aviso',      short: '⚠',   cls: 'bg-orange-600/50 text-orange-200 border border-orange-600' },
    emergency: { text: '🚨 EMERGENCIA', short: '🚨',  cls: 'bg-red-600 text-white animate-pulse border border-red-400' },
  };

  const badge = LEVEL_LABEL[level] || LEVEL_LABEL.normal;

  return (
    <header className={`sticky top-0 z-40 border-b backdrop-blur-md transition-all duration-500 ${
      isEmergency
        ? 'bg-red-950/90 border-red-700'
        : 'bg-white/90 dark:bg-gray-900/90 border-slate-200 dark:border-gray-800'
    }`}>
      {/* Barra de datos desactualizados */}
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
            isEmergency ? 'bg-red-700 animate-pulse' : 'bg-blue-600 dark:bg-blue-700'
          }`}>
            {isEmergency ? '🌀' : '🌤️'}
          </div>
          <div className="min-w-0">
            <h1 className={`font-bold text-base leading-none truncate ${
              isEmergency ? 'text-red-100' : 'text-slate-900 dark:text-white'
            }`}>
              {isEmergency ? '⚠️ ALERTA ACTIVA' : 'Dashboard Climático RD'}
            </h1>
            <p className={`text-xs truncate ${
              isEmergency ? 'text-red-400' : 'text-slate-400 dark:text-gray-500'
            }`}>
              República Dominicana · ONAMET / WeatherAPI
            </p>
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

          {/* Badge de nivel */}
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${badge.cls}`}>
            <span className="hidden sm:inline">{badge.text}</span>
            <span className="sm:hidden">{badge.short}</span>
          </span>

          {/* Última actualización */}
          <div className="hidden sm:block text-right">
            <p className={`text-xs ${
              isStale      ? 'text-yellow-600'
              : isEmergency ? 'text-red-500'
              : 'text-slate-400 dark:text-gray-600'
            }`}>
              {isStale ? '⚠ Datos anteriores' : 'Actualizado'}
            </p>
            <p className={`text-xs font-mono ${
              isStale      ? 'text-yellow-400'
              : isEmergency ? 'text-red-300'
              : 'text-slate-600 dark:text-gray-300'
            }`}>
              {lastUpdate ? lastUpdate.toLocaleTimeString('es-DO') : '--:--'}
            </p>
          </div>

          {/* Botón de refresh */}
          <button
            onClick={refresh}
            disabled={isLoading}
            title="Actualizar ahora"
            aria-label={isLoading ? 'Actualizando datos…' : 'Actualizar datos meteorológicos'}
            className={`p-2 rounded-lg transition-colors ${
              isEmergency
                ? 'bg-red-800 hover:bg-red-700 text-red-100'
                : 'bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-300'
            } disabled:opacity-40`}
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                 fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Botón de notificaciones push */}
          {!isEmergency && permission !== 'unsupported' && (
            <button
              onClick={requestPermission}
              title={
                permission === 'granted'  ? 'Notificaciones activas'  :
                permission === 'denied'   ? 'Notificaciones bloqueadas (permitir en el navegador)' :
                'Activar notificaciones de alerta'
              }
              aria-label={
                permission === 'granted'  ? 'Notificaciones de alerta activas' :
                permission === 'denied'   ? 'Notificaciones bloqueadas — permitir en el navegador' :
                'Activar notificaciones push de alerta meteorológica'
              }
              aria-pressed={permission === 'granted'}
              disabled={permission === 'denied'}
              className={`p-2 rounded-lg transition-colors relative
                ${permission === 'granted'
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                  : permission === 'denied'
                  ? 'bg-slate-100 dark:bg-gray-800 text-slate-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                  : 'bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-300'
                }`}
            >
              {permission === 'granted' ? (
                /* Campana activa */
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              ) : (
                /* Campana inactiva con tachado */
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              )}
              {/* Punto verde cuando está activo */}
              {permission === 'granted' && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
              )}
            </button>
          )}

          {/* Toggle modo oscuro / claro */}
          {!isEmergency && (
            <button
              onClick={toggleTheme}
              title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              aria-pressed={!isDark}
              className="p-2 rounded-lg transition-colors bg-slate-100 dark:bg-gray-800
                         hover:bg-slate-200 dark:hover:bg-gray-700
                         text-slate-500 dark:text-gray-300"
            >
              {isDark ? (
                /* Sol — click para ir a modo claro */
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                /* Luna — click para ir a modo oscuro */
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          )}

          {/* Flag RD */}
          <span className="hidden md:flex items-center gap-1 text-xs text-slate-300 dark:text-gray-600">
            🇩🇴 <span>RD</span>
          </span>
        </div>
      </div>
    </header>
  );
}
