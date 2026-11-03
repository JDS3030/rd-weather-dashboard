import { useState, useCallback } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export function useAssistant() {
  const [loading,  setLoading]  = useState(false);
  const [response, setResponse] = useState(null);
  const [error,    setError]    = useState(null);

  const submitQuery = useCallback(async (provinceId, query) => {
    if (!provinceId || !query.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const { data } = await axios.post(`${API}/assistant/query`, { provinceId, query: query.trim() });
      setResponse(data.data);
    } catch (err) {
      const msg = err.response?.data?.error
        || err.message
        || 'Error al consultar el asistente';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return { loading, response, error, submitQuery, clear };
}
