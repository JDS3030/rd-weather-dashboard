import { CARDINAL_META, normalizeName } from '../data/geoData';
import { useWeatherData } from '../hooks/useWeatherData';

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
  if (t.includes('lluvi') || t.includes('rain'))     return '🌧️';
  if (t.includes('tormenta') || t.includes('storm')) return '⛈️';
  if (t.includes('nublado') || t.includes('cloud'))  return '⛅';
  if (t.includes('cubierto') || t.includes('overcast')) return '☁️';
  if (t.includes('niebla') || t.includes('fog'))     return '🌫️';
  return '☀️';
}

export default function CardinalQuadrant({
  qid, geoProvinces, apiProvinces, onOpenModal, isUserZone, userProvinceName,
}) {
  const meta           = CARDINAL_META[qid];
  const { alertState } = useWeatherData();

  const merged = geoProvinces.map(geoProv => {
    const apiMatch = apiProvinces.find(ap => {
      const a = normalizeName(ap.name);
      const b = normalizeName(geoProv.name);
      return a.includes(b) || b.includes(a);
    });
    const hasAlert = alertState?.triggers?.some(t =>
      (t.province || '').toLowerCase()
        .includes((geoProv.name || '').toLowerCase().split(' ')[0])
    ) ?? false;

    return { ...geoProv, weather: apiMatch?.current ?? null, hasAlert };
  });

  const temps   = merged.map(p => p.weather?.temp_c).filter(Number.isFinite);
  const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length) : null;

  const borderColor = isUserZone ? '#22d3ee' : meta.accentHex + '88';
  const glowShadow  = isUserZone
    ? '0 0 28px #22d3ee28, 0 0 3px #22d3ee44'
    : `0 0 24px ${meta.accentHex}12, 0 0 2px ${meta.accentHex}20`;

  return (
    <div
      className="rounded-2xl border-2 bg-gray-900/40 overflow-hidden flex flex-col transition-all duration-500"
      style={{ borderColor, boxShadow: glowShadow }}
    >
      {/* Cabecera */}
      <div
        className="border-b px-5 py-3 flex items-center justify-between flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${meta.dimBg} 0%, ${meta.dimBg}55 100%)`, borderColor: meta.accentHex + '44' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black leading-none" style={{ color: isUserZone ? '#22d3ee' : meta.accent }}>
            {meta.arrow}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-white tracking-tight">{meta.label}</h2>
              {meta.hasDN && <span className="dn-badge">★ D.N.</span>}
              {isUserZone && (
                <span className="text-xs font-bold text-cyan-400" style={{ animation: 'pulse 2s ease infinite' }}>
                  📍 Tu zona
                </span>
              )}
            </div>
            <p className="text-xs font-medium" style={{ color: meta.accent + '99', fontSize: 10 }}>
              {geoProvinces.length} provincias · {meta.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {avgTemp !== null && (
            <div className="text-right">
              <p className="text-xs" style={{ color: meta.accent + '80' }}>prom.</p>
              <p className="text-sm font-black text-white">{avgTemp.toFixed(1)}°</p>
            </div>
          )}
          <button
            onClick={() => onOpenModal(qid)}
            className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors hover:bg-white/8"
            style={{ color: isUserZone ? '#22d3ee' : meta.accent, borderColor: (isUserZone ? '#22d3ee' : meta.accentHex) + '55' }}
          >
            Ver detalle →
          </button>
        </div>
      </div>

      {/* Lista de provincias */}
      <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
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

          return (
            <button
              key={prov.name}
              onClick={() => onOpenModal(qid, pi)}
              className={`w-full text-left border-b border-white/5 last:border-0 px-4 py-2.5
                           flex items-center justify-between transition-all duration-100
                           hover:bg-white/5 hover:translate-x-0.5
                           ${isUserProv    ? 'bg-cyan-950/25 border-l-2 border-l-cyan-400'
                           : prov.hasAlert ? 'border-l-2 border-l-red-500'
                           :                 'border-l-2 border-l-transparent'}`}
            >
              {/* Izquierda */}
              <div className="min-w-0 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: isUserProv ? '#22d3ee' : meta.accentHex }} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-semibold truncate
                      ${isUserProv ? 'text-cyan-300' : prov.isDN ? 'text-amber-300' : 'text-white'}`}>
                      {prov.name}
                    </span>
                    {prov.isDN     && <span className="dn-badge flex-shrink-0">★</span>}
                    {isUserProv    && <span className="text-xs text-cyan-400 font-bold flex-shrink-0">📍</span>}
                    {prov.hasAlert && <span className="text-red-400 text-xs flex-shrink-0">⚠️</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                           style={{ width: `${hw}%`, background: hc }} />
                    </div>
                    <span className="text-gray-600" style={{ fontSize: 10 }}>
                      {cond ?? '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Derecha */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right">
                  <p className="text-sm font-black text-white leading-none">
                    {temp != null ? `${temp.toFixed(1)}°` : '—'}
                  </p>
                  <p className="text-gray-600 mt-0.5" style={{ fontSize: 10 }}>
                    {hum != null ? `hum ${hum}%` : ''}
                  </p>
                </div>
                <span className="text-base">{emoji}</span>
                <span className="text-gray-700 text-xs">›</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
