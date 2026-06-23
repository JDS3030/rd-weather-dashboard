import { useWeatherData } from '../hooks/useWeatherData';

export default function StatsOverview() {
  const { provinces, alertState } = useWeatherData();
  const isEmergency = alertState.isEmergency;

  if (!provinces.length) return null;

  const temps   = provinces.map(p => p.current?.temp_c).filter(Number.isFinite);
  const winds   = provinces.map(p => p.current?.wind_kph ?? 0);
  const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '--';
  const maxWind = winds.length ? Math.max(...winds) : 0;
  const maxWindProv = provinces[winds.indexOf(maxWind)]?.name ?? '--';

  const rainyCount = provinces.filter(p =>
    (p.current?.precip_mm ?? 0) > 0 ||
    p.current?.condition?.text?.toLowerCase().includes('lluvi')
  ).length;

  const avgHumidity = provinces.length
    ? (provinces.reduce((s, p) => s + (p.current?.humidity ?? 0), 0) / provinces.length).toFixed(0)
    : '--';

  const windColor = maxWind >= 119 ? 'text-red-400'
                  : maxWind >= 63  ? 'text-orange-400'
                  : isEmergency    ? 'text-red-300'
                  : 'text-blue-400';

  const stats = [
    {
      icon: '🌡️', label: 'Temperatura Prom.',
      value: `${avgTemp}°C`,
      sub:   `Máx ${temps.length ? Math.max(...temps).toFixed(1) : '--'}° / Mín ${temps.length ? Math.min(...temps).toFixed(1) : '--'}°`,
      color: isEmergency ? 'text-red-300' : 'text-orange-400',
    },
    {
      icon: '💨', label: 'Viento Máximo',
      value: `${maxWind.toFixed(0)} km/h`,
      sub:   maxWindProv,
      color: windColor,
    },
    {
      icon: '🌧️', label: 'Con Lluvia',
      value: `${rainyCount}/${provinces.length}`,
      sub:   'provincias con precipitación',
      color: isEmergency ? 'text-red-300' : 'text-cyan-400',
    },
    {
      icon: '💧', label: 'Humedad Prom.',
      value: `${avgHumidity}%`,
      sub:   'promedio nacional',
      color: isEmergency ? 'text-red-300' : 'text-teal-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {stats.map(s => (
        <div key={s.label} className={`rounded-xl border p-4 transition-all duration-500 ${
          isEmergency
            ? 'bg-red-950/30 border-red-800/50'
            : 'bg-gray-800/50 border-gray-700/50'
        }`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-base">{s.icon}</span>
            <span className={`text-xs ${isEmergency ? 'text-red-500' : 'text-gray-500'}`}>{s.label}</span>
          </div>
          <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
          <p className={`text-xs mt-0.5 truncate ${isEmergency ? 'text-red-600' : 'text-gray-600'}`}>{s.sub}</p>
        </div>
      ))}
    </div>
  );
}
