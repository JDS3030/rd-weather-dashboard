import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

export const WeatherContext = createContext(null);

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const REFRESH_NORMAL    = 5 * 60 * 1000;   // 5 minutos
const REFRESH_EMERGENCY = 60 * 1000;        // 1 minuto durante emergencia

export function WeatherProvider({ children }) {
  const [provinces,   setProvinces]   = useState([]);
  const [alertState,  setAlertState]  = useState({
    level: 'normal', isEmergency: false, triggers: [], onaMetAlerts: [], lastChecked: null,
  });
  const [latestReport, setLatestReport] = useState(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [lastUpdate,   setLastUpdate]   = useState(null);
  const [error,        setError]        = useState(null);
  const [isStale,      setIsStale]      = useState(false);
  const [staleFrom,    setStaleFrom]    = useState(null);

  const timerRef = useRef(null);

  const fetchAll = useCallback(async () => {
    try {
      const [weatherRes, alertRes, reportRes] = await Promise.all([
        axios.get(`${API}/weather`),
        axios.get(`${API}/alerts/status`),
        axios.get(`${API}/reports/latest`).catch(() => ({ data: { data: null } })),
      ]);

      setProvinces(weatherRes.data.data   || []);
      setAlertState(alertRes.data.data    || {});
      setLatestReport(reportRes.data.data || null);
      setLastUpdate(new Date());
      setIsStale(weatherRes.data.isStale   || false);
      setStaleFrom(weatherRes.data.staleFrom || null);
      setError(null);
    } catch (err) {
      // Si ya hay datos, conservarlos y marcarlos como desactualizados
      if (provinces.length > 0) {
        setIsStale(true);
        setStaleFrom(sf => sf ?? lastUpdate?.toISOString() ?? null);
      } else {
        setError('No se pudo conectar con el servidor. Verifique que el backend esté activo.');
      }
      console.error('[WeatherContext] fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh: 1 minuto en emergencia, 5 minutos en modo normal
  useEffect(() => {
    const interval = alertState.isEmergency ? REFRESH_EMERGENCY : REFRESH_NORMAL;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(fetchAll, interval);
    return () => clearInterval(timerRef.current);
  }, [alertState.isEmergency, fetchAll]);

  // Carga inicial
  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <WeatherContext.Provider value={{
      provinces, alertState, latestReport,
      isLoading, lastUpdate, error,
      isStale, staleFrom,
      refresh: fetchAll,
    }}>
      {children}
    </WeatherContext.Provider>
  );
}
