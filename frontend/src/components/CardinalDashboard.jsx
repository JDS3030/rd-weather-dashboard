import { useState, useMemo, useRef, lazy, Suspense } from 'react';
import { useWeatherData } from '../hooks/useWeatherData';
import { useGeolocation } from '../hooks/useGeolocation';
import { GEO_HIERARCHY, CARDINAL_META, getCardinalForProvince, normalizeName } from '../data/geoData';
import CardinalQuadrant from './CardinalQuadrant';
import ProvinceModal from './ProvinceModal';

// Carga diferida del mapa para no penalizar el bundle principal
const MapView = lazy(() => import('./MapView'));

const QUADRANTS = ['norte', 'este', 'oeste', 'sur'];

export default function CardinalDashboard() {
  const { provinces: apiProvinces, alertState, isLoading } = useWeatherData();
  const isEmergency = alertState.isEmergency;
  const geo = useGeolocation();

  const [modal,    setModal]    = useState(null);
  const [view,     setView]     = useState('grid');    // 'grid' | 'mapa'
  const [colorBy,  setColorBy]  = useState('temp');    // 'temp' | 'alert'

  // Refs para hacer scroll automático al cuadrante del usuario
  const quadrantRefs = useRef({});

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
    // Scroll suave al cuadrante del usuario (solo en vista grid)
    const scrollTimer = setTimeout(() => {
      const el = quadrantRefs.current[qid];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);

    // Abre el modal con la provincia encontrada, tras dar tiempo al scroll
    const modalTimer = setTimeout(() => openModal(qid, pi >= 0 ? pi : null), 800);
    return () => { clearTimeout(scrollTimer); clearTimeout(modalTimer); };
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
              aria-label={`Abrir detalle zona ${meta.label}${avg ? ` — ${avg}°C promedio` : ''}`}
              className="text-left rounded-xl px-4 py-3 border transition-all duration-300
                         hover:scale-[1.01] bg-white dark:bg-gray-900/40 relative
                         hover:bg-slate-50 dark:hover:bg-gray-700/40"
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

      {/* ── Fila de controles: título + vista + GPS ───────────────────── */}
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <h2 className={`text-xs font-bold uppercase tracking-wider ${
          isEmergency ? 'text-red-500' : 'text-slate-400 dark:text-gray-500'
        }`}>
          🗺️ Estado por Punto Cardinal · {apiProvinces.length} provincias
        </h2>

        {/* Selector de vista: grid / mapa */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-gray-700 p-0.5 bg-slate-100 dark:bg-gray-800/50">
          <button
            onClick={() => setView('grid')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              view === 'grid'
                ? 'bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 shadow-sm'
                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Grid
          </button>
          <button
            onClick={() => setView('mapa')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
              view === 'mapa'
                ? 'bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 shadow-sm'
                : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
            }`}
          >
            🗺️ Mapa
          </button>
        </div>

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
            aria-label={geo.status === 'found' ? `Ubicación activa: ${geo.result?.name ?? ''} — clic para limpiar` : 'Detectar mi ubicación en el mapa'}
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

      {/* ── Vista: Grid 2×2 ────────────────────────────────────────────── */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUADRANTS.map(qid => (
            <div key={qid} ref={el => { quadrantRefs.current[qid] = el; }}>
              <CardinalQuadrant
                qid={qid}
                geoProvinces={GEO_HIERARCHY[qid]}
                apiProvinces={apiProvinces}
                onOpenModal={openModal}
                isUserZone={geo.status === 'found' && geo.result?.qid === qid}
                userProvinceName={geo.status === 'found' && geo.result?.qid === qid ? geo.result.name : null}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Vista: Mapa interactivo ─────────────────────────────────────── */}
      {view === 'mapa' && (
        <div>
          {/* Controles del mapa */}
          <div className="flex items-center justify-between mb-3">
            <p className={`text-xs ${isEmergency ? 'text-red-400' : 'text-slate-400 dark:text-gray-500'}`}>
              Clic en una provincia para ver el detalle · Arrastra para mover · Scroll para zoom
            </p>
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-gray-700 p-0.5 bg-slate-100 dark:bg-gray-800/50">
              {[
                { key: 'temp',  label: '🌡️ Temp' },
                { key: 'alert', label: '🚨 Alerta' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setColorBy(opt.key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    colorBy === opt.key
                      ? 'bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 shadow-sm'
                      : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Leyenda de temperatura */}
          {colorBy === 'temp' && (
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span className="text-xs text-slate-400 dark:text-gray-500 font-semibold">Temp:</span>
              {[
                { color: '#60a5fa', label: '< 22°' },
                { color: '#34d399', label: '22–26°' },
                { color: '#fbbf24', label: '26–29°' },
                { color: '#f97316', label: '29–32°' },
                { color: '#ef4444', label: '> 32°' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs text-slate-500 dark:text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mapa Leaflet con lazy load */}
          <Suspense fallback={
            <div className="w-full rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-100 dark:bg-gray-800/50
                            flex items-center justify-center" style={{ height: 440 }}>
              <p className="text-slate-400 dark:text-gray-500 text-sm">Cargando mapa…</p>
            </div>
          }>
            <MapView
              colorBy={colorBy}
              onSelectProvince={p => {
                // Busca zona + índice exacto de la provincia usando normalizeName
                // para tolerar diferencias de acentos/capitalización entre API y geodata
                const pNorm = normalizeName(p.name).split(' ')[0];
                let foundQid = null;
                let foundIdx = null;

                for (const q of QUADRANTS) {
                  const idx = GEO_HIERARCHY[q].findIndex(g => {
                    const gNorm = normalizeName(g.name).split(' ')[0];
                    return gNorm === pNorm ||
                           normalizeName(g.name).includes(pNorm) ||
                           pNorm.includes(gNorm);
                  });
                  if (idx >= 0) { foundQid = q; foundIdx = idx; break; }
                }

                if (foundQid !== null) openModal(foundQid, foundIdx);
              }}
            />
          </Suspense>
        </div>
      )}

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
