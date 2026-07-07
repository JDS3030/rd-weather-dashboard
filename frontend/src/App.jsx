import { ThemeProvider }    from './context/ThemeContext';
import { WeatherProvider }  from './context/WeatherContext';
import { useWeatherData }   from './hooks/useWeatherData';
import Dashboard            from './components/Dashboard';
import EmergencyBanner      from './components/EmergencyBanner';

function AppContent() {
  const { alertState } = useWeatherData();

  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-gray-950">
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
    <ThemeProvider>
      <WeatherProvider>
        <AppContent />
      </WeatherProvider>
    </ThemeProvider>
  );
}
