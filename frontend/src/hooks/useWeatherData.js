import { useContext } from 'react';
import { WeatherContext } from '../context/WeatherContext';

export function useWeatherData() {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeatherData debe usarse dentro de <WeatherProvider>');
  return ctx;
}
