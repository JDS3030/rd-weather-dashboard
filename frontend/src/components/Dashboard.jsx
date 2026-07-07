import { useWeatherData }  from '../hooks/useWeatherData';
import Header              from './Header';
import StatsOverview       from './StatsOverview';
import CardinalDashboard   from './CardinalDashboard';
import AlertPanel          from './AlertPanel';
import ReportPanel         from './ReportPanel';
import SkeletonDashboard   from './SkeletonDashboard';

// ─── Pantalla de error ────────────────────────────────────────────────────────
function ErrorScreen({ message }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl p-8 max-w-md text-center">
        <p className="text-5xl mb-4">⚠️</p>
        <h2 className="text-red-600 dark:text-red-300 font-bold text-xl mb-2">Error de Conexión</h2>
        <p className="text-slate-500 dark:text-gray-400 text-sm">{message}</p>
        <p className="text-slate-400 dark:text-gray-600 text-xs mt-3">
          Asegúrese de que el backend esté corriendo en <code className="text-slate-600 dark:text-gray-400">localhost:3001</code>
        </p>
      </div>
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const { provinces, isLoading, error, alertState } = useWeatherData();
  const isEmergency = alertState.isEmergency;

  if (isLoading && !provinces.length) return <SkeletonDashboard />;
  if (error      && !provinces.length) return <ErrorScreen message={error} />;

  return (
    <div>
      <Header />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6">

        {/* Estadísticas nacionales */}
        <StatsOverview />

        {/* Layout principal: cards (3/4) + sidebar (1/4) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

          {/* Dashboard cardinal */}
          <section className="lg:col-span-3">
            <CardinalDashboard />
          </section>

          {/* Sidebar */}
          <aside className="space-y-4">
            <AlertPanel />
            <ReportPanel />

            {/* Créditos y fuentes */}
            <div className={`rounded-xl border p-4 text-center ${
              isEmergency
                ? 'border-red-900/50 bg-red-950/20'
                : 'border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900/30'
            }`}>
              <p className={`text-xs font-semibold mb-1 ${
                isEmergency ? 'text-red-500' : 'text-slate-400 dark:text-gray-600'
              }`}>
                Fuentes Oficiales
              </p>
              <p className={`text-xs leading-relaxed ${
                isEmergency ? 'text-red-400' : 'text-slate-500 dark:text-gray-500'
              }`}>
                🏛 ONAMET<br />
                🌐 Open-Meteo · GFS/ECMWF<br />
                🌍 Earth Nullschool<br />
                🛡 Defensa Civil RD
              </p>
              <div className={`mt-3 pt-3 border-t ${
                isEmergency ? 'border-red-900/40' : 'border-slate-200 dark:border-gray-800'
              }`}>
                <p className={`text-xs font-mono font-bold ${
                  isEmergency ? 'text-red-400' : 'text-slate-400 dark:text-gray-600'
                }`}>
                  Emergencias: 911
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
