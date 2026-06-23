import { useWeatherData } from '../hooks/useWeatherData';

const CLOUD_INFO = [
  { max: 10,  label: 'Despejado',          emoji: '☀️',  color: 'text-yellow-400' },
  { max: 30,  label: 'Parcialmente nublado', emoji: '🌤️', color: 'text-yellow-300' },
  { max: 60,  label: 'Mayormente nublado',  emoji: '⛅',  color: 'text-blue-300'   },
  { max: 85,  label: 'Muy nublado',         emoji: '🌥️', color: 'text-gray-300'   },
  { max: 100, label: 'Cubierto',            emoji: '☁️',  color: 'text-gray-400'   },
];

function cloudInfo(pct) {
  return CLOUD_INFO.find(c => pct <= c.max) ?? CLOUD_INFO[4];
}

function WindTag({ kph }) {
  let cls = 'text-emerald-400', label = 'Calmo';
  if (kph >= 119) { cls = 'text-red-400';    label = 'Huracán'; }
  else if (kph >= 63)  { cls = 'text-orange-400'; label = 'Tormenta'; }
  else if (kph >= 40)  { cls = 'text-yellow-400'; label = 'Fuerte'; }
  else if (kph >= 20)  { cls = 'text-blue-300';   label = 'Moderado'; }

  return (
    <span className={`text-xs font-medium ${cls}`}>
      💨 {kph?.toFixed(0) ?? 0} km/h <span className="opacity-70">({label})</span>
    </span>
  );
}

export default function ProvinceCard({ province }) {
  const { alertState } = useWeatherData();
  const isEmergency  = alertState.isEmergency;
  const hasAlert     = alertState.triggers?.some(t => t.province === province.name);
  const isRaining    = (province.current?.precip_mm ?? 0) > 0 ||
                       province.current?.condition?.text?.toLowerCase().includes('lluvi');

  const ci = cloudInfo(province.current?.cloud ?? 0);

  const baseCard = isEmergency && hasAlert
    ? 'border-red-500 bg-red-950/50 card-alert-pulse'
    : isEmergency
    ? 'border-red-900/40 bg-gray-900/70'
    : 'border-gray-700/40 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800 transition-colors';

  const textPrimary   = isEmergency && hasAlert ? 'text-red-100' : 'text-white';
  const textSecondary = isEmergency && hasAlert ? 'text-red-400' : 'text-gray-500';
  const divider       = isEmergency ? 'border-red-900/40' : 'border-gray-700/40';

  return (
    <div className={`rounded-xl border overflow-hidden ${baseCard}`}>
      {/* Cabecera */}
      <div className={`px-4 py-2.5 border-b flex items-center justify-between ${
        isEmergency && hasAlert ? 'bg-red-900/30 border-red-800' : `bg-gray-900/40 ${divider}`
      }`}>
        <div>
          <h3 className={`font-semibold text-sm ${textPrimary}`}>{province.name}</h3>
          <p className={`text-xs ${textSecondary}`}>{province.region}</p>
        </div>
        <span className="text-2xl">{ci.emoji}</span>
      </div>

      {/* Temperatura principal */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-black ${textPrimary}`}>
            {province.current?.temp_c != null ? `${province.current.temp_c.toFixed(1)}°` : '--'}
          </span>
          <span className={`text-xs ${textSecondary}`}>
            ST {province.current?.feelslike_c?.toFixed(1) ?? '--'}°C
          </span>
        </div>
        <p className={`text-xs mt-0.5 ${ci.color}`}>{province.current?.condition?.text ?? '--'}</p>
      </div>

      {/* Grilla de métricas */}
      <div className={`grid grid-cols-2 gap-px border-t ${divider}`}>
        {[
          { icon: '💧', label: 'Humedad',  value: `${province.current?.humidity ?? '--'}%` },
          { icon: '☁️', label: 'Nubosidad', value: `${province.current?.cloud ?? '--'}%` },
          { icon: '📊', label: 'Presión',  value: `${province.current?.pressure_mb ?? '--'} mb` },
          { icon: '🌞', label: 'Índice UV', value: province.current?.uv ?? '--' },
        ].map(({ icon, label, value }) => (
          <div key={label} className={`px-3 py-2 ${isEmergency ? 'bg-red-950/20' : 'bg-gray-900/30'}`}>
            <p className="text-gray-600 text-xs">{icon} {label}</p>
            <p className={`text-sm font-semibold ${textPrimary}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Viento + lluvia */}
      <div className={`px-4 py-2.5 border-t ${divider} flex items-center justify-between`}>
        <WindTag kph={province.current?.wind_kph ?? 0} />
        {isRaining && (
          <span className="text-xs text-blue-400">
            🌧️ {province.current?.precip_mm?.toFixed(1) ?? '0'} mm
          </span>
        )}
      </div>

      {/* Badge de alerta */}
      {hasAlert && (
        <div className="px-4 py-1.5 bg-red-700 text-white text-xs font-bold text-center tracking-wide">
          🚨 ALERTA ACTIVA EN ESTA PROVINCIA
        </div>
      )}
    </div>
  );
}
