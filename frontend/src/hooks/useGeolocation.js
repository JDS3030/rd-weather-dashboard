import { useState, useCallback } from 'react';
import { findProvinceByCoords } from '../data/geoData';

// Estados posibles: idle | loading | found | error | outside
export function useGeolocation() {
  const [status,   setStatus]   = useState('idle');   // idle | loading | found | error | outside
  const [result,   setResult]   = useState(null);     // { provinceName, qid, lat, lng, distance }
  const [errorMsg, setErrorMsg] = useState('');

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg('Tu navegador no soporta geolocalización.');
      return;
    }
    setStatus('loading');
    setResult(null);
    setErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const match = findProvinceByCoords(lat, lng);

        if (!match) {
          setStatus('outside');
          setErrorMsg('Tu ubicación está fuera de la República Dominicana.');
          return;
        }
        setResult({ ...match, lat, lng });
        setStatus('found');
      },
      (err) => {
        setStatus('error');
        setErrorMsg(
          err.code === 1 ? 'Permiso de ubicación denegado. Actívalo en tu navegador.' :
          err.code === 2 ? 'No se pudo determinar tu posición. Intenta de nuevo.' :
                          'Tiempo de espera agotado. Intenta de nuevo.'
        );
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: false }
    );
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setErrorMsg('');
  }, []);

  return { status, result, errorMsg, locate, reset };
}
