import { useState, useMemo } from 'react';
import { useWeatherData } from '../hooks/useWeatherData';
import { useGeolocation } from '../hooks/useGeolocation';
import { GEO_HIERARCHY, CARDINAL_META, getCardinalForProvince } from '../data/geoData';
import CardinalQuadrant from './CardinalQuadrant';
import ProvinceModal from './ProvinceModal';

const QUADRANTS = ['norte', 'este', 'oeste', 'sur'];

export default function CardinalDashboard() {
  const { provinces: apiProvinces, alertState, isLoading } = useWeatherData();
  const isEmergency = alertState.isEmergency;
  const geo = useGeolocation();

  const [modal, setModal] = useState(null);

  const apiByQuadrant = useMemo(() => {
    const map = { norte: [], este: [], oeste: [], sur: [] };
    apiProvinces.forEach(p => {
      const qid = getCardinalForProvince(p.name);
      map[qid].push(p);
    });
    return map;
  }, [apiProvinces]);

  function avgTemp(qid) {
    const temps = apiByQuadrant[qid]
      .map(p => p.current?.temp_c)
      .filter(Number.isFinite);
    return temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : null;
  }

  function openModal(qid, provinceIdx = null) {
    setModal({ qid, provinceIdx, munIdx: null });
  }

  function handleLocate() {
    geo.locate();
  }

  useMemo(() => {
    if (geo.status !== 'found' || !geo.result) return;
    const { qid, name } = geo.result;
    const geoList = GEO_HIERARCHY[qid] ?? [];
    const pi = geoList.findIndex(p =>
      p.name.toLowerCase().includes(name.toLowerCase().split(' ')[0]) ||
      name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
    );
    const t = setTimeout(() => openModal(qid, pi >= 0 ? pi : null), 600);
    return () => clearTimeout(t);
  }, [geo.status, geo.result?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const geoApiMatch = useMemo(() => {
    if (!geo.result) return null;
    return apiProvinces.find(p =>
      p.name.toLowerCase().includes(geo.result.name.toLowerCase().split(' ')[0])
    );
  }, [geo.result, apiProvinces]);

  const geoTemp = geoApiMatch?.current?.temp_c;
  const geoCond = geoApiMatch?.current?.condition?.text;

  return (
    <>
      {/* ── Barra de resumen por zona ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {QUADRANTS.map(qid => {
          const meta       = CARDINAL_META[qid];
          const avg        = avgTemp(qid);
          const count      = GEO_HIERARCHY[qid].length;
          const isUserZone = geo.status === 'found' && geo.result?.qid === qid;
          return (
            <button
              key={qid}
              onClick={() => openModal(qid)}
              className="text-left rounded-xl px-4 py-3 border transition-all duration-300
                         hover:scale-[1.01] bg-white dark:bg-gray-900/40 relative
                         hover:bg-slate-50 dark:hover:bg-white/5"
              style={{
                borderColor:     isUserZone ? '#22d3ee' : meta.accentHex + '44',
                borderLeftWidth: 2,
                borderLeftColor: isUserZone ? '#22d3ee' : meta.accentHex,
                boxShadow:       isUserZone ? '0 0 16px #22d3ee33' : undefined,
              }}
            >
              {isUserZone && (
                <span className="absolute top-1.5 right-2 text-xs text-cyan-400 font-bold">
                  📍
                </span>
              )}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider"
                      style={{ color: isUserZone ? '#22d3ee' : meta.accent }}>
                  {meta.arrow} {meta.label}
                </span>
                {meta.hasDN && <span className="dn-badge">★ D.N.</span>}
              </div>
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {avg ? `${avg}°C` : isLoading ? '…' : '—'}
              </p>
              <p className="text-xs text-slate-400 dark:text-gray-600 font-medium">
                {count} prov. · {meta.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Fila de controles: título + botón GPS ──────────────────────── */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={`text-xs font-bold uppercase tracking-wider ${
          isEmergency ? 'text-red-500' : 'text-slate-400 dark:text-gray-500'
        }`}>
          🗺️ Estado por Punto Cardinal · {apiProvinces.length} provincias
        </h2>

        <div className="flex items-center gap-3">
          {isEmergency && (
            <span className="text-xs text-red-400 font-semibold animate-pulse">
              ⟳ Actualización cada 60 s
            </span>
          )}

          {/* Botón Mi Ubicación */}
          <button
            onClick={geo.status === 'found' ? geo.reset : handleLocate}
            disabled={geo.status === 'loading'}
            className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full
                         border transition-all duration-200 flex-shrink-0
                         ${geo.status === 'loading'
                           ? 'border-cyan-600 text-cyan-600 cursor-wait bg-cyan-50 dark:bg-cyan-950/20'
                           : geo.status === 'found'
                           ? 'border-cyan-500 text-cyan-600 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/30 hover:bg-cyan-100 dark:hover:bg-cyan-950/50'
                           : geo.status === 'error' || geo.status === 'outside'
                           ? 'border-red-400 dark:border-red-700 text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40'
                           : 'border-slate-300 dark:border-gray-700 text-slate-500 dark:text-gray-400 hover:border-cyan-500 hover:text-cyan-600 dark:hover:border-cyan-700 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/20'
                         }`}
          >
            {geo.status === 'loading' ? (
              <>
                <span className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                Obteniendo…
              </>
            ) : geo.status === 'found' ? (
              <>📍 {geo.result.name} · Limpiar</>
            ) : (
              <>📍 Mi Ubicación</>
            )}
          </button>
        </div>
      </div>

      {/* ── Banner de resultado GPS ─────────────────────────────────────── */}
      {geo.status === 'found' && geo.result && (
        <div
          className="mb-4 rounded-xl border border-cyan-300 dark:border-cyan-800/60 bg-cyan-50 dark:bg-cyan-950/25 px-4 py-3
                     flex items-center justify-between"
          style={{ animation: 'fadeDown .25s ease' }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">📍</span>
            <div>
              <p className="text-sm font-bold text-cyan-700 dark:text-cyan-300">
                Estás en <span className="text-slate-900 dark:text-white">{geo.result.name}</span>
                {' '}· Zona <span className="text-slate-900 dark:text-white">{CARDINAL_META[geo.result.qid].label}</span>
              </p>
              <p className="text-xs text-cyan-600/70 dark:text-cyan-400/70 mt-0.5">
                {geoTemp != null ? `${geoTemp.toFixed(1)}°C · ${geoCond ?? ''}` : 'Datos provinciales disponibles en el detalle'}
                {' '}· Coords: {geo.result.lat.toFixed(4)}°N, {geo.result.lng.toFixed(4)}°W
              </p>
            </div>
          </div>
          <button
            onClick={() => openModal(geo.result.qid)}
            className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 border border-cyan-400/50 dark:border-cyan-700/50
                       px-3 py-1.5 rounded-full hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors flex-shrink-0"
          >
            Ver zona →
          </button>
        </div>
      )}

      {/* ── Banner de error GPS ─────────────────────────────────────────── */}
      {(geo.status === 'error' || geo.status === 'outside') && (
        <div
          className="mb-4 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 px-4 py-2.5
                     flex items-center justify-between"
          style={{ animation: 'fadeDown .2s ease' }}
        >
          <div className="flex items-center gap-2">
            <span>{geo.status === 'outside' ? '🌎' : '⚠️'}</span>
            <p className="text-xs text-red-500 dark:text-red-300">{geo.errorMsg}</p>
          </div>
          <button onClick={geo.reset} className="text-xs text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 transition-colors ml-3">
            Cerrar ×
          </button>
        </div>
      )}

      {/* ── Cuadrícula 2×2 ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUADRANTS.map(qid => (
          <CardinalQuadrant
            key={qid}
            qid={qid}
            geoProvinces={GEO_HIERARCHY[qid]}
            apiProvinces={apiProvinces}
            onOpenModal={openModal}
            isUserZone={geo.status === 'found' && geo.result?.qid === qid}
            userProvinceName={geo.status === 'found' && geo.result?.qid === qid ? geo.result.name : null}
          />
        ))}
      </div>

      {/* ── Modal de detalle drill-down ────────────────────────────────── */}
      {modal && (
        <ProvinceModal
          qid={modal.qid}
          provinceIdx={modal.provinceIdx}
          munIdx={modal.munIdx}
          userProvinceName={geo.result?.qid === modal.qid ? geo.result.name : null}
          onClose={() => setModal(null)}
          onNavigate={next => setModal(next)}
        />
      )}
    </>
  );
}
