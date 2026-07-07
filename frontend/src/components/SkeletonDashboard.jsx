// ─── Bloque pulsante reutilizable ─────────────────────────────────────────────
function Sk({ w = 'w-full', h = 'h-3', rounded = 'rounded' }) {
  return (
    <div className={`${w} ${h} ${rounded} bg-slate-200 dark:bg-gray-700/60 animate-pulse`} />
  );
}

// ─── Fila de provincia (en cada cuadrante) ─────────────────────────────────────
function SkProvinceRow() {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-gray-700/40 last:border-0">
      <div className="flex items-center gap-2.5 flex-1">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-gray-700/60 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Sk w="w-28" h="h-2.5" />
          <div className="flex items-center gap-2">
            <Sk w="w-10" h="h-1.5" />
            <Sk w="w-20" h="h-1.5" />
            <div className="flex gap-0.5 ml-1">
              {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-gray-700/60 animate-pulse" />)}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right space-y-1">
          <Sk w="w-10" h="h-3" />
          <Sk w="w-8" h="h-2" />
        </div>
        <Sk w="w-5" h="h-5" rounded="rounded-full" />
        <Sk w="w-2" h="h-2" />
      </div>
    </div>
  );
}

// ─── Tarjeta de cuadrante cardinal ────────────────────────────────────────────
function SkQuadrant({ accentColor }) {
  return (
    <div
      className="rounded-2xl border-2 bg-white dark:bg-gray-900/40 overflow-hidden"
      style={{ borderColor: accentColor + '55' }}
    >
      {/* Cabecera */}
      <div
        className="px-5 py-3 flex items-center justify-between border-b"
        style={{ borderColor: accentColor + '33', background: accentColor + '12' }}
      >
        <div className="flex items-center gap-3">
          <Sk w="w-6" h="h-6" rounded="rounded" />
          <div className="space-y-1.5">
            <Sk w="w-20" h="h-3" />
            <Sk w="w-28" h="h-2" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right space-y-1">
            <Sk w="w-8" h="h-2" />
            <Sk w="w-12" h="h-4" />
          </div>
          <Sk w="w-20" h="h-6" rounded="rounded-full" />
        </div>
      </div>

      {/* Filas de provincias */}
      <div>
        {Array.from({ length: 7 }).map((_, i) => (
          <SkProvinceRow key={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton del panel lateral ───────────────────────────────────────────────
function SkSidePanel({ rows = 3 }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-gray-700/60 bg-white dark:bg-gray-900/40 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-gray-700/60 bg-slate-50 dark:bg-gray-800/30 flex items-center justify-between">
        <Sk w="w-32" h="h-3" />
      </div>
      <div className="p-3 space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-start gap-2">
            <Sk w="w-4" h="h-4" rounded="rounded" />
            <div className="flex-1 space-y-1.5">
              <Sk h="h-2.5" />
              <Sk w="w-3/4" h="h-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Skeleton completo del dashboard ─────────────────────────────────────────
export default function SkeletonDashboard() {
  const ACCENT_COLORS = {
    norte: '#3b82f6',
    este:  '#10b981',
    oeste: '#8b5cf6',
    sur:   '#f59e0b',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">

      {/* ── Header skeleton ───────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b backdrop-blur-md
                         bg-white/90 dark:bg-gray-900/90
                         border-slate-200 dark:border-gray-800 h-14">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sk w="w-9" h="h-9" rounded="rounded-xl" />
            <div className="space-y-1.5">
              <Sk w="w-44" h="h-3.5" />
              <Sk w="w-36" h="h-2.5" />
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Sk w="w-20" h="h-6" rounded="rounded-full" />
            <div className="hidden sm:block space-y-1 text-right">
              <Sk w="w-16" h="h-2" />
              <Sk w="w-12" h="h-2.5" />
            </div>
            <Sk w="w-8" h="h-8" rounded="rounded-lg" />
            <Sk w="w-8" h="h-8" rounded="rounded-lg" />
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">

        {/* ── Stats skeleton (4 tarjetas) ────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 dark:border-gray-700/50
                                    bg-white dark:bg-gray-800/50 p-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sk w="w-4" h="h-4" rounded="rounded" />
                <Sk w="w-24" h="h-2.5" />
              </div>
              <Sk w="w-20" h="h-7" rounded="rounded-md" />
              <div className="mt-1.5">
                <Sk w="w-32" h="h-2" />
              </div>
            </div>
          ))}
        </div>

        {/* ── Layout principal ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Sección cardinal (3 columnas) */}
          <section className="lg:col-span-3 space-y-4">

            {/* Botones de zona (4 en fila) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(ACCENT_COLORS).map(([zone, color]) => (
                <div
                  key={zone}
                  className="rounded-xl bg-white dark:bg-gray-900/40 px-4 py-3 border-l-2"
                  style={{
                    borderColor: color,
                    boxShadow: `inset 0 0 0 1px ${color}22`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Sk w="w-16" h="h-2.5" />
                  </div>
                  <Sk w="w-14" h="h-6" rounded="rounded-md" />
                  <div className="mt-1.5">
                    <Sk w="w-24" h="h-2" />
                  </div>
                </div>
              ))}
            </div>

            {/* Título de sección + botón GPS */}
            <div className="flex items-center justify-between">
              <Sk w="w-64" h="h-2.5" />
              <Sk w="w-28" h="h-7" rounded="rounded-full" />
            </div>

            {/* Cuadrícula 2×2 de cuadrantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(ACCENT_COLORS).map(([zone, color]) => (
                <SkQuadrant key={zone} accentColor={color} />
              ))}
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            <SkSidePanel rows={2} />
            <SkSidePanel rows={3} />

            {/* Créditos */}
            <div className="rounded-xl border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900/30 p-4 space-y-2">
              <Sk w="w-24" h="h-2.5" rounded="rounded mx-auto" />
              <div className="space-y-1.5">
                {[0,1,2,3].map(i => <Sk key={i} w="w-3/4" h="h-2" rounded="rounded mx-auto" />)}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
