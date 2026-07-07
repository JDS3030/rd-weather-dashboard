import { useEffect, useRef, useState } from 'react';

const STORAGE_KEY  = 'nuvigia-alert-history';
const MAX_ENTRIES  = 10;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* cuota excedida — ignorar */ }
}

/**
 * Mantiene un log de los últimos MAX_ENTRIES cambios de nivel de alerta.
 * Detecta cambios en `alertState.level` y persiste en localStorage.
 */
export function useAlertHistory(alertState) {
  const [history, setHistory] = useState(() => loadHistory());
  const prevLevel = useRef(null);

  useEffect(() => {
    const current = alertState?.level;
    if (!current) return;

    // Registra el cambio si el nivel es diferente al anterior
    if (prevLevel.current !== null && prevLevel.current !== current) {
      const entry = {
        id:        Date.now(),
        from:      prevLevel.current,
        to:        current,
        timestamp: new Date().toISOString(),
        triggers:  (alertState.triggers || []).length,
        province:  alertState.triggers?.[0]?.province ?? null,
      };

      setHistory(prev => {
        const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
        saveHistory(updated);
        return updated;
      });
    }

    prevLevel.current = current;
  }, [alertState?.level]);

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return { history, clearHistory };
}
