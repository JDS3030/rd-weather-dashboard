import { WeatherProvider } from './context/WeatherContext';
import { useWeatherData }  from './hooks/useWeatherData';
import Dashboard           from './components/Dashboard';
import EmergencyBanner     from './components/EmergencyBanner';

function AppContent() {
  const { alertState } = useWeatherData();

  return (
    <div className={`min-h-screen transition-all duration-700 ${
      alertState.isEmergency ? 'bg-gray-950' : 'bg-gray-950'
    }`}>
      {/* Efecto de borde rojo parpadeante en emergencia */}
      {alertState.isEmergency && (
        <div className="fixed inset-0 pointer-events-none z-50
                        ring-4 ring-red-600/60 animate-pulse-slow" />
      )}

      {alertState.isEmergency && <EmergencyBanner />}
      <Dashboard />
    </div>
  );
}

export default function App() {
  return (
    <WeatherProvider>
      <AppContent />
    </WeatherProvider>
  );
}
