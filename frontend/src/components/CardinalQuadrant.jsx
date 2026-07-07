import { CARDINAL_META, normalizeName } from '../data/geoData';
import { useWeatherData } from '../hooks/useWeatherData';
import { useTheme }       from '../context/ThemeContext';
import { useIsMobile }    from '../hooks/useIsMobile';

function heatBarWidth(temp) {
  if (temp == null) return 0;
  return Math.min(100, Math.round(((temp - 18) / 20) * 100));
}

function heatBarColor(temp) {
  if (temp == null) return '#374151';
  const pct = Math.min(1, (temp - 18) / 20);
  const hue = 220 - pct * 190;
  return `hsl(${hue}, 75%, 55%)`;
}

function conditionEmoji(condText) {
  const t = (condText || '').toLowerCase();
  if (t.includes('lluvi') || t.includes('rain'))      return '🌧️';
  if (t.includes('tormenta') || t.includes('storm'))  return '⛈️';
  if (t.includes('nublado') || t.includes('cloud'))   return '⛅';
  if (t.includes('cubierto') || t.includes('overcast')) return '☁️';
  if (t.includes('niebla') || t.includes('fog'))      return '🌫️';
  return '☀️';
}

export default function CardinalQuadrant({
  qid, geoProvinces, apiProvinces, onOpenModal, isUserZone, userProvinceName,
  isOpen = true, onToggle,
}) {
  const meta           = CARDINAL_META[qid];
  const { alertState } = useWeatherData();
  const { isDark }     = useTheme();
  const isMobile       = useIsMobile();

  const merged = geoProvinces.map(geoProv => {
    const apiMatch = apiProvinces.find(ap => {
      const a = normalizeName(ap.name);
      const b = normalizeName(geoProv.name);
      return a === b || a.includes(b);
    });
    const hasAlert = alertState?.triggers?.some(t =>
      (t.province || '').toLowerCase()
        .includes((geoProv.name || '').toLowerCase().split(' ')[0])
    ) ?? false;

    return { ...geoProv, weather: apiMatch?.current ?? null, forecast: apiMatch?.forecast ?? [], hasAlert };
  });

  const temps   = merged.map(p => p.weather?.temp_c).filter(Number.isFinite);
  const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length) : null;

  const borderColor = isUserZone ? '#22d3ee' : meta.accentHex + '88';
  const glowShadow  = isUserZone
    ? '0 0 28px #22d3ee28, 0 0 3px #22d3ee44'
    : `0 0 24px ${meta.accentHex}12, 0 0 2px ${meta.accentHex}20`;

  return (
    <div
      className="rounded-2xl border-2 bg-white dark:bg-gray-900/40 overflow-hidden flex flex-col transition-all duration-500"
      style={{ borderColor, boxShadow: glowShadow }}
    >
      {/* Cabecera — en mobile actúa como botón de acordeón */}
      <div
        className={`border-b px-4 sm:px-5 py-3 flex items-center justify-between flex-shrink-0 min-h-[52px]
                    ${isMobile && onToggle ? 'cursor-pointer active:opacity-80' : ''}`}
        style={{
          background:  `linear-gradient(135deg, ${meta.dimBg} 0%, ${meta.dimBg}55 100%)`,
          borderColor: meta.accentHex + '44',
        }}
        onClick={isMobile && onToggle ? onToggle : undefined}
        role={isMobile && onToggle ? 'button' : undefined}
        aria-expanded={isMobile && onToggle ? isOpen : undefined}
        aria-label={isMobile && onToggle ? `${isOpen ? 'Contraer' : 'Expandir'} zona ${meta.label}` : undefined}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-xl sm:text-2xl font-black leading-none flex-shrink-0" style={{ color: isUserZone ? '#22d3ee' : meta.accent }}>
            {meta.arrow}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{meta.label}</h2>
              {meta.hasDN && <span className="dn-badge">★ D.N.</span>}
              {isUserZone && (
                <span className="text-xs font-bold text-cyan-500 dark:text-cyan-400" style={{ animation: 'pulse 2s ease infinite' }}>
                  📍 Tu zona
                </span>
              )}
            </div>
            <p className="text-xs font-medium" style={{ color: meta.accent + '99', fontSize: 10 }}>
              {geoProvinces.length} prov. · {avgTemp !== null ? `${avgTemp.toFixed(1)}° prom.` : meta.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Temp promedio — solo desktop */}
          {avgTemp !== null && !isMobile && (
            <div className="text-right">
              <p className="text-xs" style={{ color: meta.accent + '80' }}>prom.</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{avgTemp.toFixed(1)}°</p>
            </div>
          )}

          {/* Botón Ver detalle — solo desktop */}
          {!isMobile && (
            <button
              onClick={e => { e.stopPropagation(); onOpenModal(qid); }}
              aria-label={`Ver detalle de la zona ${meta.label}`}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors
                         hover:bg-black/5 dark:hover:bg-gray-700/50"
              style={{ color: isUserZone ? '#22d3ee' : meta.accent, borderColor: (isUserZone ? '#22d3ee' : meta.accentHex) + '55' }}
            >
              Ver detalle →
            </button>
          )}

          {/* Chevron acordeón — solo mobile */}
          {isMobile && onToggle && (
            <svg
              className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ color: meta.accent }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Lista de provincias — colapsable en mobile */}
      <div className={`overflow-y-auto transition-all duration-200 ${!isOpen ? 'hidden' : ''}`}
           style={{ maxHeight: isMobile ? 320 : 420 }}>

        {/* Botón Ver detalle zona — solo mobile, dentro del panel */}
        {isMobile && (
          <button
            onClick={() => onOpenModal(qid)}
            aria-label={`Ver detalle completo de la zona ${meta.label}`}
            className="w-full text-xs font-semibold py-2.5 border-b flex items-center justify-center gap-1.5 transition-colors
                       hover:bg-slate-50 dark:hover:bg-gray-700/40"
            style={{ color: meta.accent, borderColor: meta.accentHex + '33' }}
          >
            Ver detalle de zona →
          </button>
        )}

        {merged.map((prov, pi) => {
          const temp  = prov.weather?.temp_c;
          const hum   = prov.weather?.humidity;
          const cond  = prov.weather?.condition?.text;
          const emoji = conditionEmoji(cond);
          const hw    = heatBarWidth(temp);
          const hc    = heatBarColor(temp);

          const isUserProv = isUserZone && userProvinceName &&
            (normalizeName(prov.name).includes(normalizeName(userProvinceName.split(' ')[0])) ||
             normalizeName(userProvinceName).includes(normalizeName(prov.name.split(' ')[0])));

          const sinDatosStyle = isDark
            ? { color: '#6b7280', borderColor: '#374151', background: '#1f2937', fontSize: 9 }
            : { color: '#64748b', borderColor: '#e2e8f0', background: '#f1f5f9', fontSize: 9 };

          return (
            <button
              key={prov.name}
              onClick={() => onOpenModal(qid, pi)}
              aria-label={`${prov.name}${temp != null ? ` — ${temp.toFixed(1)}°C` : ''}${cond ? `, ${cond}` : ''}${prov.hasAlert ? ', alerta activa' : ''}`}
              className={`w-full text-left border-b border-slate-100 dark:border-gray-700/60 last:border-0 px-4 py-2.5
                           flex items-center justify-between transition-all duration-100 min-h-[44px]
                           hover:bg-slate-50 dark:hover:bg-gray-700/40 hover:translate-x-0.5
                           ${isUserProv    ? 'bg-cyan-50 dark:bg-cyan-950/25 border-l-2 border-l-cyan-400'
                           : prov.hasAlert ? 'border-l-2 border-l-red-500'
                           :                 'border-l-2 border-l-transparent'}`}
            >
              {/* Izquierda */}
              <div className="min-w-0 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: isUserProv ? '#22d3ee' : meta.accentHex }} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold truncate
                      ${isUserProv ? 'text-cyan-600 dark:text-cyan-300' : prov.isDN ? 'text-amber-600 dark:text-amber-300' : 'text-slate-800 dark:text-white'}`}>
                      {prov.name}
                    </span>
                    {prov.isDN     && <span className="dn-badge flex-shrink-0">★</span>}
                    {isUserProv    && <span className="text-xs text-cyan-500 dark:text-cyan-400 font-bold flex-shrink-0">📍</span>}
                    {prov.hasAlert && <span className="text-red-400 text-xs flex-shrink-0">⚠️</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {/* Barra de calor — oculta en mobile */}
                    {!isMobile && (
                      <div className="w-12 h-1 bg-slate-200 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                             style={{ width: `${hw}%`, background: hc }} />
                      </div>
                    )}
                    <span className="text-slate-400 dark:text-gray-600" style={{ fontSize: 10 }}>
                      {emoji} {isMobile ? '' : (cond ?? '—')}
                    </span>
                    {/* Mini pronóstico 3 días */}
                    {prov.forecast.length > 0 && (
                      <div className="flex items-center gap-0.5 ml-1" title="Probabilidad de lluvia: hoy · mañana · pasado">
                        {prov.forecast.map((d, fi) => {
                          const pct = d.daily_chance_of_rain ?? 0;
                          const dotColor = pct >= 60 ? 'bg-blue-500'
                                         : pct >= 30 ? 'bg-cyan-400'
                                         : 'bg-slate-300 dark:bg-gray-700';
                          return (
                            <span
                              key={fi}
                              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`}
                              title={`Día ${fi + 1}: ${pct}% lluvia`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Derecha */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {prov.weather === null ? (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full border"
                    style={sinDatosStyle}
                    title="Provincia sin cobertura en la API meteorológica"
                  >
                    Sin datos
                  </span>
                ) : (
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900 dark:text-white leading-none">
                      {temp != null ? `${temp.toFixed(1)}°` : '—'}
                    </p>
                    {/* Humedad — oculta en mobile */}
                    {!isMobile && (
                      <p className="text-slate-400 dark:text-gray-600 mt-0.5" style={{ fontSize: 10 }}>
                        {hum != null ? `hum ${hum}%` : ''}
                      </p>
                    )}
                  </div>
                )}
                {prov.weather !== null && isMobile && (
                  <span className="text-base">{emoji}</span>
                )}
                <span className="text-slate-300 dark:text-gray-700 text-xs">›</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
