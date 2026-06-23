import { useWeatherData } from '../hooks/useWeatherData';

export default function EmergencyBanner() {
  const { alertState } = useWeatherData();
  const { triggers = [], onaMetAlerts = [], activatedAt } = alertState;

  const primary = onaMetAlerts[0];
  const title   = primary?.title
    ?? (triggers[0]?.source?.includes('Wind')
        ? `Vientos de ${triggers[0].windKph} km/h — ${triggers[0].level}`
        : triggers[0]?.alertText ?? 'ALERTA METEOROLÓGICA ACTIVA');

  const desc = primary?.description
    ?? 'Se han detectado condiciones meteorológicas severas. Siga las instrucciones de ONAMET y las autoridades competentes.';

  // Construir ticker con todos los detonadores
  const tickerItems = [
    ...onaMetAlerts.map(a => `🏛 ONAMET: ${a.title}`),
    ...triggers.map(t =>
      t.source.includes('Wind')
        ? `💨 ${t.province}: ${t.windKph} km/h (${t.level})`
        : `⚠️ ${t.province || ''}: ${t.alertText || t.conditionText || t.keyword}`
    ),
  ].join('   ·   ');

  return (
    <div className="relative overflow-hidden">
      {/* Fondo degradado rojo */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-950 via-red-800 to-red-950" />
      {/* Patrón de franjas */}
      <div className="absolute inset-0 opacity-10"
           style={{ backgroundImage: 'repeating-linear-gradient(45deg,#000 0,#000 10px,transparent 10px,transparent 20px)' }} />

      <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-start gap-4">
          {/* Ícono animado */}
          <div className="flex-shrink-0 w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-2xl animate-bounce shadow-lg shadow-red-900/50">
            🌀
          </div>

          {/* Cuerpo */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="bg-white text-red-800 text-xs font-black px-2 py-0.5 rounded uppercase tracking-widest animate-siren">
                ⚠ EMERGENCIA
              </span>
              {activatedAt && (
                <span className="text-red-300 text-xs">
                  Activo desde: {new Date(activatedAt).toLocaleString('es-DO')}
                </span>
              )}
            </div>

            <h2 className="text-white font-bold text-lg sm:text-xl leading-tight truncate">
              {title}
            </h2>
            <p className="text-red-200 text-sm mt-1 line-clamp-2">{desc}</p>

            {/* Regiones afectadas */}
            {primary?.affectedRegions?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-red-400 text-xs font-semibold">Regiones:</span>
                {primary.affectedRegions.map(r => (
                  <span key={r} className="bg-red-900/60 text-red-200 text-xs px-2 py-0.5 rounded border border-red-700/50">
                    {r}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Contador de alertas */}
          <div className="flex-shrink-0 text-center bg-red-900/60 rounded-xl p-3 border border-red-700/50">
            <p className="text-3xl font-black text-white">{triggers.length + onaMetAlerts.length}</p>
            <p className="text-red-400 text-xs">alertas</p>
          </div>
        </div>

        {/* Ticker de noticias */}
        {tickerItems && (
          <div className="mt-3 bg-black/30 rounded px-3 py-1.5 ticker-wrapper">
            <span className="text-red-400 text-xs font-bold mr-2 flex-shrink-0">BOLETÍN »</span>
            <span className="ticker-content text-xs text-red-200">{tickerItems}</span>
          </div>
        )}
      </div>
    </div>
  );
}
