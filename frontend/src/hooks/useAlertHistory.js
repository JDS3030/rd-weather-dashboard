import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const API          = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
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

/** Adapta una entrada del backend a la forma que consume AlertPanel. */
function mapBackendEntry(e) {
  return {
    id:        e.id,
    from:      e.from,
    to:        e.to,
    timestamp: e.createdAt,
    triggers:  e.triggerCount ?? 0,
    province:  e.province ?? null,
  };
}

/**
 * Mantiene un log de los últimos cambios de nivel de alerta.
 *
 * Fuente primaria: el historial compartido del backend (persistido en
 * PostgreSQL) vía GET /api/alerts/history. Se refresca al montar y cada vez
 * que cambia `alertState.level`.
 *
 * Fallback offline: si el backend no responde o no tiene persistencia (sin
 * base de datos), se conserva la lógica anterior — detecta el cambio de nivel
 * en cliente y lo persiste en localStorage.
 */
export function useAlertHistory(alertState) {
  const [history, setHistory] = useState(() => loadHistory());
  const prevLevel   = useRef(null);
  const usingBackend = useRef(false);

  // ── Fuente primaria: backend ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchHistory() {
      try {
        const res     = await axios.get(`${API}/alerts/history`, { params: { limit: MAX_ENTRIES } });
        const entries = (res.data?.data || []).map(mapBackendEntry);
        if (cancelled) return;

        // El backend respondió con datos → es la fuente de verdad.
        if (entries.length > 0) {
          usingBackend.current = true;
          setHistory(entries);
          return;
        }
        // Respuesta vacía: puede ser backend sin DB o simplemente sin cambios
        // aún. No pisamos el fallback local si ya teníamos algo.
      } catch {
        // Backend caído → seguimos con el fallback local.
        usingBackend.current = false;
      }
    }

    fetchHistory();
    return () => { cancelled = true; };
  }, [alertState?.level]);

  // ── Fallback offline: diff de nivel en cliente + localStorage ──────────────
  useEffect(() => {
    const current = alertState?.level;
    if (!current) return;

    if (prevLevel.current !== null && prevLevel.current !== current && !usingBackend.current) {
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
