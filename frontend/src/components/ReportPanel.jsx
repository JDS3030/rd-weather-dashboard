import { useState } from 'react';
import axios from 'axios';
import { useWeatherData } from '../hooks/useWeatherData';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function ReportPanel() {
  const { latestReport, alertState, refresh } = useWeatherData();
  const [generating, setGenerating] = useState(false);
  const isEmergency = alertState.isEmergency;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await axios.post(`${API}/reports/generate`, null, {
        params: { type: isEmergency ? 'emergency' : 'daily' },
      });
      await refresh();
    } catch (e) {
      console.error('Error generando reporte:', e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={`rounded-xl border overflow-hidden ${
      isEmergency
        ? 'border-red-700/50'
        : 'border-slate-200 dark:border-gray-700/50'
    } bg-white dark:bg-gray-900/60`}>
      {/* Cabecera */}
      <div className={`px-4 py-3 border-b flex items-center justify-between ${
        isEmergency
          ? 'bg-red-900/30 border-red-800'
          : 'bg-slate-50 dark:bg-gray-900/40 border-slate-200 dark:border-gray-800'
      }`}>
        <h2 className={`font-bold text-sm ${
          isEmergency ? 'text-red-200' : 'text-slate-700 dark:text-gray-300'
        }`}>
          📄 {isEmergency ? 'Reporte de Emergencia' : 'Reporte Diario'}
        </h2>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors ${
            isEmergency
              ? 'bg-red-700 hover:bg-red-600 text-white'
              : 'bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600 text-white'
          } disabled:opacity-40`}
        >
          {generating ? '⟳ Generando...' : '↻ Generar'}
        </button>
      </div>

      <div className="p-4">
        {latestReport ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                latestReport.type === 'emergency'
                  ? 'bg-red-700 text-white'
                  : 'bg-blue-100 dark:bg-blue-800/60 text-blue-600 dark:text-blue-300'
              }`}>
                {latestReport.type === 'emergency' ? '🚨 Emergencia' : '📊 Diario'}
              </span>
              <span className={`text-xs font-mono ${
                isEmergency ? 'text-red-500' : 'text-slate-400 dark:text-gray-600'
              }`}>
                {new Date(latestReport.generatedAt).toLocaleString('es-DO')}
              </span>
            </div>
            <pre className={`text-xs whitespace-pre-wrap font-mono leading-relaxed max-h-52 overflow-y-auto ${
              isEmergency ? 'text-red-200' : 'text-slate-600 dark:text-gray-300'
            }`}>
              {latestReport.summary}
            </pre>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-slate-400 dark:text-gray-600 text-sm">Sin reportes generados.</p>
            <button onClick={handleGenerate} className="text-blue-500 hover:underline text-xs mt-1">
              Generar ahora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
