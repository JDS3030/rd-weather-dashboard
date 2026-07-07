import { useEffect, useCallback } from 'react';
import { CARDINAL_META, GEO_HIERARCHY, normalizeName } from '../data/geoData';
import { useWeatherData } from '../hooks/useWeatherData';
import { useTheme }       from '../context/ThemeContext';
import DrilldownStepper from './DrilldownStepper';

// ── Utilidades ────────────────────────────────────────────────────────────────
function uvColor(uv) {
  if (uv == null) return '#6b7280';
  if (uv <= 2)  return '#22c55e';
  if (uv <= 5)  return '#84cc16';
  if (uv <= 7)  return '#eab308';
  if (uv <= 10) return '#ef4444';
  return '#a855f7';
}

function tempBg(t) {
  if (t == null || t < 24) return 'from-blue-100 dark:from-blue-950/30';
  if (t < 28) return 'from-emerald-100 dark:from-emerald-950/20';
  if (t < 32) return 'from-orange-100 dark:from-orange-950/25';
  return 'from-red-100 dark:from-red-950/30';
}

function trendIcon(trend) {
  if (trend === 'up')   return <span className="text-red-400 text-xs">▲</span>;
  if (trend === 'down') return <span className="text-blue-400 text-xs">▼</span>;
  return <span className="text-slate-400 dark:text-gray-600 text-xs">▬</span>;
}

function windLabel(kph) {
  if (!kph)     return 'N/D';
  if (kph < 10) return 'Calmo';
  if (kph < 20) return 'Suave';
  if (kph < 35) return 'Moderado';
  if (kph < 63) return 'Fuerte';
  return 'Severo';
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ProvinceModal({ qid, provinceIdx, munIdx, userProvinceName, onClose, onNavigate }) {
  const meta         = CARDINAL_META[qid];
  const { isDark }   = useTheme();
  const geoProvinces = GEO_HIERARCHY[qid] ?? [];
  const province     = provinceIdx !== null ? geoProvinces[provinceIdx] : null;
  const municipality = (munIdx !== null && province) ? province.municipalities[munIdx] : null;

  const level = municipality ? 2 : province ? 1 : 0;

  const handleKey = useCallback((e) => { if (e.key === 'Escape') onClose(); }, [onClose]);
  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  function stepBack(stepId) {
    if (stepId <= 0) onNavigate({ qid, provinceIdx: null, munIdx: null });
    else if (stepId === 1) onNavigate({ qid, provinceIdx, munIdx: null });
  }

  const titleParts = [meta.label];
  if (province)     titleParts.push(province.name);
  if (municipality) titleParts.push(municipality.name);

  const modalBg    = isDark ? '#0d1117'  : '#ffffff';
  const backdropBg = isDark ? 'rgba(3,7,18,0.88)' : 'rgba(15,23,42,0.6)';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: backdropBg, backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxWidth: 1000,
          maxHeight: '90vh',
          background: modalBg,
          border: `1px solid ${isDark ? meta.accentHex + '33' : meta.accentHex + '55'}`,
          boxShadow: `0 0 60px ${meta.accentHex}16`,
          animation: 'modalIn .25s cubic-bezier(.34,1.2,.64,1)',
        }}
      >
        {/* ── CABECERA ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black leading-none" style={{ color: meta.accent }}>
              {meta.arrow}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">{titleParts.join(' › ')}</h2>
                {meta.hasDN && !province && <span className="dn-badge">★ D.N.</span>}
                {province?.isDN && <span className="dn-badge">★ Distrito Nacional</span>}
              </div>
              <p className="text-xs font-medium mt-0.5" style={{ color: meta.accent + 'aa' }}>
                {meta.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse 2s ease infinite' }} />
              <span className="text-xs text-slate-500 dark:text-gray-400">Datos en vivo</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full border border-slate-200 dark:border-gray-600 flex items-center justify-center
                         text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-white
                         hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── STEPPER ──────────────────────────────────────────────────── */}
        <div className="px-6 py-2.5 border-b border-slate-100 dark:border-gray-700/60 flex-shrink-0 flex items-center justify-between">
          <DrilldownStepper level={level} accent={meta.accentHex} onStepClick={stepBack} />
          <span className="text-xs text-slate-400 dark:text-gray-600 font-mono">
            {municipality
              ? `${municipality.districts.length} distritos`
              : province
              ? `${province.municipalities.length} municipios`
              : `${geoProvinces.length} provincias`}
          </span>
        </div>

        {/* ── BANNER GPS ────────────────────────────────────────────────── */}
        {userProvinceName && (
          <div className="px-6 py-2 border-b border-cyan-200 dark:border-cyan-900/40 bg-cyan-50 dark:bg-cyan-950/20
                           flex items-center gap-2 flex-shrink-0"
               style={{ animation: 'fadeDown .2s ease' }}>
            <span className="text-base">📍</span>
            <p className="text-xs text-cyan-700 dark:text-cyan-300 font-medium">
              Tu ubicación aproximada: <span className="text-slate-900 dark:text-white font-bold">{userProvinceName}</span>
              <span className="text-cyan-500 dark:text-cyan-400/60"> · Haz clic en la provincia resaltada para ver el clima detallado</span>
            </p>
          </div>
        )}

        {/* ── CONTENIDO ─────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Panel izquierdo */}
          <div className="w-64 flex-shrink-0 border-r border-slate-100 dark:border-gray-700/60 overflow-y-auto">
            <LeftPanel
              qid={qid} meta={meta}
              geoProvinces={geoProvinces}
              provinceIdx={provinceIdx} munIdx={munIdx}
              userProvinceName={userProvinceName}
              isDark={isDark}
              onSelectProvince={pi => onNavigate({ qid, provinceIdx: pi, munIdx: null })}
              onSelectMun={mi => onNavigate({ qid, provinceIdx, munIdx: mi })}
            />
          </div>

          {/* Panel derecho */}
          <div className="flex-1 overflow-y-auto p-5">
            <RightPanel
              meta={meta}
              geoProvinces={geoProvinces}
              provinceIdx={provinceIdx}
              munIdx={munIdx}
              onSelectProvince={pi => onNavigate({ qid, provinceIdx: pi, munIdx: null })}
              onSelectMun={mi => onNavigate({ qid, provinceIdx, munIdx: mi })}
            />
          </div>
        </div>

        {/* ── PIE ──────────────────────────────────────────────────────── */}
        <div className="px-6 py-2.5 border-t border-slate-100 dark:border-gray-700/60 flex-shrink-0
                        flex items-center justify-between bg-slate-50/80 dark:bg-black/20">
          {provinceIdx !== null ? (
            <button
              onClick={() => munIdx !== null
                ? onNavigate({ qid, provinceIdx, munIdx: null })
                : onNavigate({ qid, provinceIdx: null, munIdx: null })}
              className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              ← Volver
            </button>
          ) : <span />}
          <p className="text-xs text-slate-400 dark:text-gray-700">
            {municipality
              ? `Distritos de ${municipality.name}`
              : province
              ? 'Clic en un municipio para ver sus distritos municipales'
              : 'Clic en una provincia para ver sus municipios'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Panel Izquierdo ───────────────────────────────────────────────────────────
function LeftPanel({ qid, meta, geoProvinces, provinceIdx, munIdx, userProvinceName, isDark, onSelectProvince, onSelectMun }) {
  const province = provinceIdx !== null ? geoProvinces[provinceIdx] : null;
  const stickyBg = isDark ? '#0d1117' : '#ffffff';

  function isUserProv(pName) {
    if (!userProvinceName) return false;
    const a = (pName || '').toLowerCase().split(' ')[0];
    const b = (userProvinceName || '').toLowerCase().split(' ')[0];
    return a.includes(b) || b.includes(a);
  }

  if (province) {
    return (
      <>
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-gray-700/60 sticky top-0 backdrop-blur-sm z-10"
             style={{ background: stickyBg + 'f5' }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.accent }}>
            {province.name}
          </p>
          <p className="text-xs text-slate-400 dark:text-gray-600">{province.municipalities.length} municipios</p>
        </div>
        {province.municipalities.map((m, mi) => (
          <button
            key={m.name}
            onClick={() => onSelectMun(mi)}
            className={`w-full text-left px-4 py-2.5 border-b border-slate-100 dark:border-gray-700/60 last:border-0
                         flex items-center justify-between transition-colors
                         hover:bg-slate-50 dark:hover:bg-gray-700/40
                         ${munIdx === mi ? 'bg-slate-100 dark:bg-gray-700/50' : ''}`}
            style={munIdx === mi ? { borderLeft: `2px solid ${meta.accentHex}` } : {}}
          >
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">{m.name}</p>
              <p className="text-xs text-slate-400 dark:text-gray-600">
                {m.districts.length > 0 ? `${m.districts.length} dist.` : 'Sin distritos'}
              </p>
            </div>
            {m.districts.length > 0 && (
              <span className="text-xs" style={{ color: meta.accent }}>›</span>
            )}
          </button>
        ))}
      </>
    );
  }

  return (
    <>
      <div className="px-4 py-2.5 border-b border-slate-100 dark:border-gray-700/60 sticky top-0 backdrop-blur-sm z-10"
           style={{ background: stickyBg + 'f5' }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.accent }}>
          Provincias
        </p>
        <p className="text-xs text-slate-400 dark:text-gray-600">{geoProvinces.length} en zona {meta.label}</p>
      </div>
      {geoProvinces.map((p, pi) => {
        const userHere = isUserProv(p.name);
        return (
          <button
            key={p.name}
            onClick={() => onSelectProvince(pi)}
            className={`w-full text-left px-4 py-2.5 border-b border-slate-100 dark:border-gray-700/60 last:border-0
                         flex items-center justify-between transition-colors
                         hover:bg-slate-50 dark:hover:bg-gray-700/40
                         ${provinceIdx === pi ? 'bg-slate-100 dark:bg-gray-700/50' : userHere ? 'bg-cyan-50 dark:bg-cyan-950/20' : ''}`}
            style={{
              borderLeft: provinceIdx === pi
                ? `2px solid ${meta.accentHex}`
                : userHere ? '2px solid #22d3ee' : '2px solid transparent',
            }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={`text-sm font-semibold truncate
                               ${userHere ? 'text-cyan-600 dark:text-cyan-300' : p.isDN ? 'text-amber-600 dark:text-amber-300' : 'text-slate-800 dark:text-white'}`}>
                  {p.name}
                </p>
                {p.isDN && <span className="dn-badge flex-shrink-0">★</span>}
                {userHere && <span className="text-cyan-500 dark:text-cyan-400 text-xs flex-shrink-0">📍</span>}
              </div>
              <p className="text-xs text-slate-400 dark:text-gray-600">{p.municipalities.length} mun.</p>
            </div>
            <span className="text-slate-300 dark:text-gray-600 text-xs flex-shrink-0">›</span>
          </button>
        );
      })}
    </>
  );
}

// ── Panel Derecho ─────────────────────────────────────────────────────────────
function RightPanel({ meta, geoProvinces, provinceIdx, munIdx, onSelectProvince, onSelectMun }) {
  const province     = provinceIdx !== null ? geoProvinces[provinceIdx] : null;
  const municipality = (munIdx !== null && province) ? province.municipalities[munIdx] : null;

  const { provinces: apiProvinces } = useWeatherData();

  const apiMatch = province
    ? (apiProvinces || []).find(ap => {
        const a = normalizeName(ap.name);
        const b = normalizeName(province.name);
        return a === b || a.includes(b);
      })
    : null;

  const provinceWeather  = apiMatch?.current  ?? null;
  const provinceForecast = apiMatch?.forecast ?? [];

  // Vista: Distritos municipales
  if (municipality) {
    return (
      <div style={{ animation: 'fadeDown .2s ease' }}>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white">{municipality.name}</h3>
          <span className="text-slate-400 dark:text-gray-600 text-xs">· Distritos Municipales</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-gray-600 mb-4 px-3 py-2 rounded-lg
                        border border-slate-200 dark:border-gray-700/60 bg-slate-50 dark:bg-gray-800/30">
          <span>ℹ️</span>
          <span>Datos climáticos del municipio: nivel provincial (API ONAMET/WeatherAPI no desglosa por municipio).</span>
        </div>

        {municipality.districts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {municipality.districts.map((d, i) => (
              <div
                key={d}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-gray-700
                           bg-slate-50 dark:bg-gray-800/50 text-sm text-slate-700 dark:text-gray-300
                           hover:bg-slate-100 dark:hover:bg-gray-600/50 hover:text-slate-900 dark:hover:text-white
                           transition-colors cursor-default"
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: meta.accentHex + '22', color: meta.accentHex }}
                >
                  {i + 1}
                </span>
                {d}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 dark:text-gray-600 italic">
            Este municipio no registra distritos municipales en la división administrativa actual.
          </p>
        )}
      </div>
    );
  }

  // Vista: Tarjetas de municipios + pronóstico
  if (province) {
    return (
      <div style={{ animation: 'slideUp .22s ease' }}>
        {/* Cabecera de provincia */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">{province.name}</h3>
            <p className="text-xs text-slate-400 dark:text-gray-500">{province.municipalities.length} municipios</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse 2s ease infinite' }} />
            <span className="text-xs text-slate-400 dark:text-gray-500">Datos en vivo</span>
          </div>
        </div>

        {/* Pronóstico extendido 3 días */}
        {provinceForecast.length > 0 && (
          <ForecastSection forecast={provinceForecast} meta={meta} />
        )}

        {/* Municipios */}
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-3">
          Municipios
        </h4>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          {province.municipalities.map((m, mi) => (
            <MunCard key={m.name} mun={m} mi={mi} meta={meta} weather={provinceWeather} onSelect={() => onSelectMun(mi)} />
          ))}
        </div>
      </div>
    );
  }

  // Vista: Tarjetas de provincias
  return (
    <div style={{ animation: 'fadeDown .2s ease' }}>
      <div className="mb-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-white">Vista general — {meta.label}</h3>
        <p className="text-xs text-slate-400 dark:text-gray-500">Selecciona una provincia para ver sus municipios</p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
        {geoProvinces.map((p, pi) => (
          <ProvCard key={p.name} prov={p} meta={meta} onSelect={() => onSelectProvince(pi)} />
        ))}
      </div>
    </div>
  );
}

// ── Tarjeta de Municipio ──────────────────────────────────────────────────────
function MunCard({ mun, mi, meta, weather, onSelect }) {
  const hasDistricts = mun.districts.length > 0;
  const w = weather;

  const stats = [
    { icon: '🌡️', label: 'Temp',   value: w?.temp_c   != null ? `${w.temp_c.toFixed(1)}°C`      : '—°C'    },
    { icon: '💧', label: 'Hum',    value: w?.humidity  != null ? `${w.humidity}%`                : '—%'     },
    { icon: '💨', label: 'Viento', value: w?.wind_kph  != null ? `${w.wind_kph.toFixed(0)} km/h` : '— km/h' },
    { icon: '🔆', label: 'UV',     value: w?.uv        != null ? String(w.uv)                    : '—'      },
  ];

  return (
    <button
      onClick={onSelect}
      className={`text-left rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden
                   bg-gradient-to-br ${tempBg(w?.temp_c ?? null)} to-transparent
                   hover:border-slate-300 dark:hover:border-gray-500 hover:translate-y-[-2px] hover:shadow-xl
                   transition-all duration-150 bg-white dark:bg-gray-900/50`}
    >
      <div className="px-3.5 pt-3 pb-2 border-b border-slate-100 dark:border-gray-700/60">
        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{mun.name}</p>
        <p className="text-xs text-slate-400 dark:text-gray-600 mt-0.5">
          {hasDistricts ? `${mun.districts.length} distritos` : 'Sin distritos'}
        </p>
      </div>

      <div className="px-3.5 py-2.5">
        <p className="text-xs text-slate-400 dark:text-gray-600 mb-1.5">Datos provinciales</p>
        <div className="grid grid-cols-2 gap-1.5">
          {stats.map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <span style={{ fontSize: 10 }}>{s.icon}</span>
              <span className="text-slate-400 dark:text-gray-600" style={{ fontSize: 10 }}>{s.label}:</span>
              <span className="text-slate-700 dark:text-white font-semibold" style={{ fontSize: 10 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3.5 py-2 border-t border-slate-100 dark:border-gray-700/60 flex items-center justify-between">
        <span className="text-xs text-slate-400 dark:text-gray-600">Municipio #{mi + 1}</span>
        {hasDistricts
          ? <span className="text-xs font-semibold" style={{ color: meta.accent }}>Ver distritos →</span>
          : <span className="text-xs text-slate-300 dark:text-gray-700">—</span>}
      </div>
    </button>
  );
}

// ── Pronóstico 3 días ─────────────────────────────────────────────────────────

function forecastEmoji(condText) {
  const t = (condText || '').toLowerCase();
  if (t.includes('tormenta') || t.includes('storm'))    return '⛈️';
  if (t.includes('lluvi') || t.includes('rain'))        return '🌧️';
  if (t.includes('nublado') || t.includes('cloud'))     return '⛅';
  if (t.includes('cubierto') || t.includes('overcast')) return '☁️';
  if (t.includes('niebla') || t.includes('fog'))        return '🌫️';
  return '☀️';
}

function ForecastSection({ forecast, meta }) {
  return (
    <div className="mb-5">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-3 flex items-center gap-1.5">
        <span>📅</span> Pronóstico 3 días
      </h4>
      <div className="grid grid-cols-3 gap-3">
        {forecast.map((day, i) => (
          <ForecastCard key={day.date} day={day} index={i} meta={meta} />
        ))}
      </div>
    </div>
  );
}

function ForecastCard({ day, index, meta }) {
  const DAY_LABELS = ['Hoy', 'Mañana'];
  const fecha = new Date(day.date + 'T12:00:00');
  const dayLabel = index < 2
    ? DAY_LABELS[index]
    : fecha.toLocaleDateString('es-DO', { weekday: 'short', day: 'numeric', month: 'short' });

  const rain    = day.daily_chance_of_rain ?? 0;
  const precip  = day.totalprecip_mm ?? 0;
  const maxWind = day.maxwind_kph ?? 0;
  const emoji   = forecastEmoji(day.condition?.text);

  // Color de la barra de lluvia
  const rainBarColor = rain >= 70 ? '#3b82f6'   // blue-500
                     : rain >= 40 ? '#06b6d4'   // cyan-500
                     : '#22c55e';               // green-500

  // Color del texto de temperatura máxima según calor
  const maxTempColor = (day.maxtemp_c ?? 0) >= 33 ? 'text-red-500'
                     : (day.maxtemp_c ?? 0) >= 28 ? 'text-orange-500'
                     : 'text-slate-700 dark:text-gray-200';

  return (
    <div className={`rounded-xl border overflow-hidden transition-all duration-200
                     ${index === 0
                       ? 'border-slate-300 dark:border-gray-600 bg-slate-50 dark:bg-gray-700/40'
                       : 'border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900/40'
                     }`}
         style={index === 0 ? { boxShadow: `0 0 12px ${meta.accentHex}18` } : {}}
    >
      {/* Etiqueta del día */}
      <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-wider ${
          index === 0 ? 'text-slate-700 dark:text-gray-200' : 'text-slate-400 dark:text-gray-500'
        }`}>
          {dayLabel}
        </span>
        {index === 0 && (
          <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: meta.accentHex + '22', color: meta.accentHex, fontSize: 9 }}>
            LIVE
          </span>
        )}
      </div>

      {/* Emoji y condición */}
      <div className="px-3 pb-2 flex items-center gap-2">
        <span className="text-3xl leading-none">{emoji}</span>
        <p className="text-xs text-slate-400 dark:text-gray-500 leading-snug line-clamp-2 flex-1">
          {day.condition?.text ?? '—'}
        </p>
      </div>

      {/* Temperatura máx / mín */}
      <div className="px-3 pb-2 flex items-baseline gap-1.5">
        <span className={`text-xl font-black leading-none ${maxTempColor}`}>
          {day.maxtemp_c != null ? `${day.maxtemp_c.toFixed(0)}°` : '—'}
        </span>
        <span className="text-slate-300 dark:text-gray-700 text-sm">/</span>
        <span className="text-sm font-semibold text-blue-500 dark:text-blue-400">
          {day.mintemp_c != null ? `${day.mintemp_c.toFixed(0)}°` : '—'}
        </span>
      </div>

      {/* Barra de probabilidad de lluvia */}
      <div className="px-3 pb-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-400 dark:text-gray-600" style={{ fontSize: 10 }}>💧 Lluvia</span>
          <span className="font-bold" style={{ fontSize: 10, color: rainBarColor }}>{rain}%</span>
        </div>
        <div className="h-1 bg-slate-200 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
               style={{ width: `${rain}%`, background: rainBarColor }} />
        </div>
      </div>

      {/* Stats inferiores */}
      <div className="px-3 py-2 border-t border-slate-100 dark:border-gray-700/60 grid grid-cols-2 gap-x-2 gap-y-0.5">
        <div className="flex items-center gap-1">
          <span style={{ fontSize: 10 }}>🌧️</span>
          <span className="text-slate-500 dark:text-gray-500 font-medium" style={{ fontSize: 10 }}>
            {precip.toFixed(1)} mm
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span style={{ fontSize: 10 }}>💨</span>
          <span className="text-slate-500 dark:text-gray-500 font-medium" style={{ fontSize: 10 }}>
            {maxWind.toFixed(0)} km/h
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta de Provincia ──────────────────────────────────────────────────────
function ProvCard({ prov, meta, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="text-left rounded-2xl border border-slate-200 dark:border-gray-700 overflow-hidden
                 bg-white dark:bg-gray-900/50 hover:border-slate-300 dark:hover:border-gray-500
                 hover:translate-y-[-2px] hover:shadow-xl transition-all duration-150"
    >
      <div className="px-3.5 py-3 border-b border-slate-100 dark:border-gray-700/60">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className={`text-sm font-bold truncate ${prov.isDN ? 'text-amber-600 dark:text-amber-300' : 'text-slate-900 dark:text-white'}`}>
            {prov.name}
          </p>
          {prov.isDN && <span className="dn-badge flex-shrink-0">★</span>}
        </div>
        <p className="text-xs text-slate-400 dark:text-gray-600">{prov.municipalities.length} municipios</p>
      </div>
      <div className="px-3.5 py-2 flex items-center justify-between">
        <span className="text-xs text-slate-400 dark:text-gray-600">Ver municipios</span>
        <span className="text-xs font-semibold" style={{ color: meta.accent }}>→</span>
      </div>
    </button>
  );
}
