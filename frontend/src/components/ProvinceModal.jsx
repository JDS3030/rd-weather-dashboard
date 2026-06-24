import { useEffect, useCallback } from 'react';
import { CARDINAL_META, GEO_HIERARCHY } from '../data/geoData';
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
  if (t == null || t < 24) return 'from-blue-950/30';
  if (t < 28) return 'from-emerald-950/20';
  if (t < 32) return 'from-orange-950/25';
  return 'from-red-950/30';
}

function trendIcon(trend) {
  if (trend === 'up')   return <span className="text-red-400 text-xs">▲</span>;
  if (trend === 'down') return <span className="text-blue-400 text-xs">▼</span>;
  return <span className="text-gray-600 text-xs">▬</span>;
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
  const meta       = CARDINAL_META[qid];
  const geoProvinces = GEO_HIERARCHY[qid] ?? [];
  const province   = provinceIdx !== null ? geoProvinces[provinceIdx] : null;
  const municipality = (munIdx !== null && province) ? province.municipalities[munIdx] : null;

  // Nivel 0=zona, 1=provincia, 2=municipio, 3=distrito (si hubiera sub-nivel)
  const level = municipality ? 2 : province ? 1 : 0;

  const handleKey = useCallback((e) => { if (e.key === 'Escape') onClose(); }, [onClose]);
  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Navegar hacia atrás desde el stepper
  function stepBack(stepId) {
    if (stepId <= 0) onNavigate({ qid, provinceIdx: null, munIdx: null });
    else if (stepId === 1) onNavigate({ qid, provinceIdx, munIdx: null });
  }

  // Título dinámico
  const titleParts = [meta.label];
  if (province)     titleParts.push(province.name);
  if (municipality) titleParts.push(municipality.name);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(3,7,18,0.88)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full flex flex-col bg-[#0d1117] rounded-2xl overflow-hidden"
        style={{
          maxWidth: 1000,
          maxHeight: '90vh',
          border: `1px solid ${meta.accentHex}33`,
          boxShadow: `0 0 60px ${meta.accentHex}16`,
          animation: 'modalIn .25s cubic-bezier(.34,1.2,.64,1)',
        }}
      >
        {/* ── CABECERA ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black leading-none" style={{ color: meta.accent }}>
              {meta.arrow}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">{titleParts.join(' › ')}</h2>
                {meta.hasDN && !province && (
                  <span className="dn-badge">★ D.N.</span>
                )}
                {province?.isDN && (
                  <span className="dn-badge">★ Distrito Nacional</span>
                )}
              </div>
              <p className="text-xs font-medium mt-0.5" style={{ color: meta.accent + 'aa' }}>
                {meta.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border border-white/8 bg-white/3">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse 2s ease infinite' }} />
              <span className="text-xs text-gray-400">Datos en vivo</span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full border border-white/10 flex items-center justify-center
                         text-gray-500 hover:text-white hover:bg-white/10 transition-colors text-sm"
            >
              ×
            </button>
          </div>
        </div>

        {/* ── STEPPER ──────────────────────────────────────────────────── */}
        <div className="px-6 py-2.5 border-b border-white/5 flex-shrink-0 flex items-center justify-between">
          <DrilldownStepper level={level} accent={meta.accentHex} onStepClick={stepBack} />
          <span className="text-xs text-gray-600 font-mono">
            {municipality
              ? `${municipality.districts.length} distritos`
              : province
              ? `${province.municipalities.length} municipios`
              : `${geoProvinces.length} provincias`}
          </span>
        </div>

        {/* ── BANNER GPS ────────────────────────────────────────────────── */}
        {userProvinceName && (
          <div className="px-6 py-2 border-b border-cyan-900/40 bg-cyan-950/20 flex items-center gap-2 flex-shrink-0"
               style={{ animation: 'fadeDown .2s ease' }}>
            <span className="text-base">📍</span>
            <p className="text-xs text-cyan-300 font-medium">
              Tu ubicación aproximada: <span className="text-white font-bold">{userProvinceName}</span>
              <span className="text-cyan-400/60"> · Haz clic en la provincia resaltada para ver el clima detallado</span>
            </p>
          </div>
        )}

        {/* ── CONTENIDO ─────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Panel izquierdo: lista de provincias o municipios */}
          <div className="w-64 flex-shrink-0 border-r border-white/5 overflow-y-auto">
            <LeftPanel
              qid={qid} meta={meta}
              geoProvinces={geoProvinces}
              provinceIdx={provinceIdx} munIdx={munIdx}
              userProvinceName={userProvinceName}
              onSelectProvince={pi => onNavigate({ qid, provinceIdx: pi, munIdx: null })}
              onSelectMun={mi => onNavigate({ qid, provinceIdx, munIdx: mi })}
            />
          </div>

          {/* Panel derecho: tarjetas de municipios o lista de distritos */}
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
        <div className="px-6 py-2.5 border-t border-white/5 flex-shrink-0 flex items-center justify-between bg-black/20">
          {provinceIdx !== null ? (
            <button
              onClick={() => munIdx !== null
                ? onNavigate({ qid, provinceIdx, munIdx: null })
                : onNavigate({ qid, provinceIdx: null, munIdx: null })}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
            >
              ← Volver
            </button>
          ) : <span />}
          <p className="text-xs text-gray-700">
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
function LeftPanel({ qid, meta, geoProvinces, provinceIdx, munIdx, userProvinceName, onSelectProvince, onSelectMun }) {
  const province = provinceIdx !== null ? geoProvinces[provinceIdx] : null;

  function isUserProv(pName) {
    if (!userProvinceName) return false;
    const a = (pName || '').toLowerCase().split(' ')[0];
    const b = (userProvinceName || '').toLowerCase().split(' ')[0];
    return a.includes(b) || b.includes(a);
  }

  if (province) {
    return (
      <>
        <div className="px-4 py-2.5 border-b border-white/5 sticky top-0 bg-[#0d1117]/95 backdrop-blur-sm z-10">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.accent }}>
            {province.name}
          </p>
          <p className="text-xs text-gray-600">{province.municipalities.length} municipios</p>
        </div>
        {province.municipalities.map((m, mi) => (
          <button
            key={m.name}
            onClick={() => onSelectMun(mi)}
            className={`w-full text-left px-4 py-2.5 border-b border-white/5 last:border-0
                         flex items-center justify-between transition-colors hover:bg-white/4
                         ${munIdx === mi ? 'bg-white/6' : ''}`}
            style={munIdx === mi ? { borderLeft: `2px solid ${meta.accentHex}` } : {}}
          >
            <div>
              <p className="text-sm font-semibold text-white">{m.name}</p>
              <p className="text-xs text-gray-600">
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
      <div className="px-4 py-2.5 border-b border-white/5 sticky top-0 bg-[#0d1117]/95 backdrop-blur-sm z-10">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: meta.accent }}>
          Provincias
        </p>
        <p className="text-xs text-gray-600">{geoProvinces.length} en zona {meta.label}</p>
      </div>
      {geoProvinces.map((p, pi) => {
        const userHere = isUserProv(p.name);
        return (
          <button
            key={p.name}
            onClick={() => onSelectProvince(pi)}
            className={`w-full text-left px-4 py-2.5 border-b border-white/5 last:border-0
                         flex items-center justify-between transition-colors hover:bg-white/4
                         ${provinceIdx === pi ? 'bg-white/6' : userHere ? 'bg-cyan-950/20' : ''}`}
            style={{
              borderLeft: provinceIdx === pi
                ? `2px solid ${meta.accentHex}`
                : userHere ? '2px solid #22d3ee' : '2px solid transparent',
            }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className={`text-sm font-semibold truncate
                               ${userHere ? 'text-cyan-300' : p.isDN ? 'text-amber-300' : 'text-white'}`}>
                  {p.name}
                </p>
                {p.isDN && <span className="dn-badge flex-shrink-0">★</span>}
                {userHere && <span className="text-cyan-400 text-xs flex-shrink-0">📍</span>}
              </div>
              <p className="text-xs text-gray-600">{p.municipalities.length} mun.</p>
            </div>
            <span className="text-gray-600 text-xs flex-shrink-0">›</span>
          </button>
        );
      })}
    </>
  );
}

// ── Panel Derecho ─────────────────────────────────────────────────────────────
function RightPanel({ meta, geoProvinces, provinceIdx, munIdx, onSelectProvince, onSelectMun }) {
  const province = provinceIdx !== null ? geoProvinces[provinceIdx] : null;
  const municipality = (munIdx !== null && province) ? province.municipalities[munIdx] : null;

  // Vista: Distritos municipales
  if (municipality) {
    return (
      <div style={{ animation: 'fadeDown .2s ease' }}>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-sm font-black text-white">{municipality.name}</h3>
          <span className="text-gray-600 text-xs">· Distritos Municipales</span>
        </div>

        {/* Nota de datos de clima (nivel provincia) */}
        <div className="flex items-center gap-2 text-xs text-gray-600 mb-4 px-3 py-2 rounded-lg border border-white/5 bg-white/2">
          <span>ℹ️</span>
          <span>Datos climáticos del municipio: nivel provincial (API ONAMET/WeatherAPI no desglosa por municipio).</span>
        </div>

        {municipality.districts.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {municipality.districts.map((d, i) => (
              <div
                key={d}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/8 bg-white/4
                           text-sm text-gray-300 hover:bg-white/8 hover:text-white transition-colors cursor-default"
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
          <p className="text-sm text-gray-600 italic">
            Este municipio no registra distritos municipales en la división administrativa actual.
          </p>
        )}
      </div>
    );
  }

  // Vista: Tarjetas de municipios (nivel provincia seleccionada)
  if (province) {
    return (
      <div style={{ animation: 'slideUp .22s ease' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-white">{province.name}</h3>
            <p className="text-xs text-gray-500">{province.municipalities.length} municipios</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse 2s ease infinite' }} />
            <span className="text-xs text-gray-500">Datos en vivo</span>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
          {province.municipalities.map((m, mi) => (
            <MunCard key={m.name} mun={m} mi={mi} meta={meta} onSelect={() => onSelectMun(mi)} />
          ))}
        </div>
      </div>
    );
  }

  // Vista: Tarjetas de provincias (zona seleccionada, ninguna provincia activa)
  return (
    <div style={{ animation: 'fadeDown .2s ease' }}>
      <div className="mb-4">
        <h3 className="text-sm font-black text-white">Vista general — {meta.label}</h3>
        <p className="text-xs text-gray-500">Selecciona una provincia para ver sus municipios</p>
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
function MunCard({ mun, mi, meta, onSelect }) {
  const hasDistricts = mun.districts.length > 0;

  return (
    <button
      onClick={onSelect}
      className={`text-left rounded-2xl border border-white/8 overflow-hidden
                   bg-gradient-to-br ${tempBg(null)} to-transparent
                   hover:border-white/20 hover:translate-y-[-2px] hover:shadow-xl
                   transition-all duration-150 bg-gray-900/50`}
    >
      {/* Header */}
      <div className="px-3.5 pt-3 pb-2 border-b border-white/5">
        <p className="text-sm font-bold text-white leading-tight">{mun.name}</p>
        <p className="text-xs text-gray-600 mt-0.5">
          {hasDistricts ? `${mun.districts.length} distritos` : 'Sin distritos'}
        </p>
      </div>

      {/* Datos climáticos — provenientes de la API provincial */}
      <div className="px-3.5 py-2.5">
        <p className="text-xs text-gray-600 mb-1.5">Datos provinciales</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { icon: '🌡️', label: 'Temp', value: '—°C' },
            { icon: '💧', label: 'Hum', value: '—%' },
            { icon: '💨', label: 'Viento', value: '— km/h' },
            { icon: '🔆', label: 'UV', value: '—' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <span style={{ fontSize: 10 }}>{s.icon}</span>
              <span className="text-gray-600" style={{ fontSize: 10 }}>{s.label}:</span>
              <span className="text-white font-semibold" style={{ fontSize: 10 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3.5 py-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-gray-600">Municipio #{mi + 1}</span>
        {hasDistricts
          ? <span className="text-xs font-semibold" style={{ color: meta.accent }}>Ver distritos →</span>
          : <span className="text-xs text-gray-700">—</span>}
      </div>
    </button>
  );
}

// ── Tarjeta de Provincia (en vista de zona) ───────────────────────────────────
function ProvCard({ prov, meta, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className="text-left rounded-2xl border border-white/8 overflow-hidden
                 bg-gray-900/50 hover:border-white/20 hover:translate-y-[-2px] hover:shadow-xl
                 transition-all duration-150"
    >
      <div className="px-3.5 py-3 border-b border-white/5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className={`text-sm font-bold truncate ${prov.isDN ? 'text-amber-300' : 'text-white'}`}>
            {prov.name}
          </p>
          {prov.isDN && <span className="dn-badge flex-shrink-0">★</span>}
        </div>
        <p className="text-xs text-gray-600">{prov.municipalities.length} municipios</p>
      </div>
      <div className="px-3.5 py-2 flex items-center justify-between">
        <span className="text-xs text-gray-600">Ver municipios</span>
        <span className="text-xs font-semibold" style={{ color: meta.accent }}>→</span>
      </div>
    </button>
  );
}
