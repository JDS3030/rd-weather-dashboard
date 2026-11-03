import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

export function useExtendedForecast(provinceId) {
  const [hourly,  setHourly]  = useState(null);
  const [daily7d, setDaily7d] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!provinceId) {
      setHourly(null);
      setDaily7d(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API_URL}/weather/${provinceId}/extended`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        if (json.success) {
          setHourly(json.data.hourly);
          setDaily7d(json.data.daily7d);
        } else {
          setError(json.error || 'Error al obtener pronóstico extendido');
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [provinceId]);

  return { hourly, daily7d, loading, error };
}
