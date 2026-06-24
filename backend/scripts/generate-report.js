#!/usr/bin/env node
'use strict';

/**
 * Generador de reporte HTML de pruebas unitarias — NubeVigía RD
 *
 * Uso: node scripts/generate-report.js
 *      npm run test:report
 *
 * Flujo:
 *   1. Ejecuta Jest con --json para capturar resultados estructurados
 *   2. Parsea el JSON de salida
 *   3. Genera test-report.html con estilos embebidos
 */

const { spawnSync } = require('child_process');
const { writeFileSync, existsSync } = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '..', 'test-report.html');
const ROOT_DIR    = path.join(__dirname, '..');

// ─── Descripciones enriquecidas de cada suite ─────────────────────────────────
// Mapa: nombre parcial de archivo → descripción del módulo que se testea
const SUITE_DESCRIPTIONS = {
  'weatherParser':  'Funciones puras de parseo meteorológico: mapeo WMO → texto legible, conversión de dirección de viento en grados a rosa de los vientos.',
  'weatherCache':   'Caché en memoria con TTL configurable para datos meteorológicos. Gestiona frescura, expiración y datos obsoletos (stale fallback).',
  'alertDetector':  'Detector puro de detonadores de emergencia: analiza provincias por alertas oficiales, texto de condición y umbrales de viento. Calcula nivel de alerta resultante.',
  'alertService':   'Servicio de estado de alerta global. Orquesta la detección de detonadores, mantiene el estado entre ciclos y gestiona el caché de datos meteorológicos.',
  'reportService':  'Generador de reportes diarios y de emergencia. Formatea resúmenes de texto para WhatsApp/SMS con estadísticas nacionales y detalles por provincia.',
  'onaMetService':  'Servicio de integración con ONAMET. Simula o procesa boletines oficiales y expone alertas normalizadas al sistema de detección.',
  'weatherApiService': 'Cliente de la API Open-Meteo. Obtiene condiciones actuales y pronóstico de 3 días para cada provincia de la RD.',
  'api':            'Tests de integración de los endpoints REST. Valida rutas, códigos HTTP, estructura de respuesta y manejo de errores.',
};

// ─── 1. Ejecutar Jest ─────────────────────────────────────────────────────────

console.log('⏳  Ejecutando suite de pruebas…\n');

const jestResult = spawnSync(
  'node',
  [
    require.resolve('jest/bin/jest'),
    '--json',
    '--forceExit',
    '--testPathPattern', '__tests__',
  ],
  { cwd: ROOT_DIR, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
);

let jestData;
try {
  // Jest --json puede mezclar texto verbose + JSON en stdout.
  // Extraemos el objeto JSON buscando el primer '{' que sea el inicio del resultado.
  const raw = jestResult.stdout || '';
  const jsonStart = raw.indexOf('{"numFailed');
  const jsonStr   = jsonStart >= 0 ? raw.slice(jsonStart) : raw;
  jestData = JSON.parse(jsonStr);
} catch {
  console.error('❌  No se pudo parsear la salida JSON de Jest.');
  console.error('stdout (primeros 800 chars):', (jestResult.stdout || '').slice(0, 800));
  console.error('stderr (primeros 400 chars):', (jestResult.stderr || '').slice(0, 400));
  process.exit(1);
}

// ─── 2. Procesar resultados ───────────────────────────────────────────────────

const {
  numTotalTests    = 0,
  numPassedTests   = 0,
  numFailedTests   = 0,
  numPendingTests  = 0,
  testResults      = [],
  startTime,
  success,
} = jestData;

const durationSec = startTime
  ? ((Date.now() - startTime) / 1000).toFixed(2)
  : '—';

const passRate = numTotalTests > 0
  ? Math.round((numPassedTests / numTotalTests) * 100)
  : 0;

const generatedAt = new Date().toLocaleString('es-DO', {
  dateStyle: 'full', timeStyle: 'medium',
});

// ─── 3. Helpers de HTML ───────────────────────────────────────────────────────

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Jest 29 JSON: suite.name holds the file path (not suite.testFilePath)
function suiteName(filePath) {
  if (!filePath) return 'unknown';
  const rel = filePath
    .replace(/\\/g, '/')
    .replace(/.*__tests__\//, '')
    .replace(/\.test\.js$/, '');
  return rel;
}

function suiteLabel(name) {
  const parts = name.split('/');
  return parts[parts.length - 1];
}

function suiteDescription(name) {
  const key = Object.keys(SUITE_DESCRIPTIONS).find(k =>
    name.toLowerCase().includes(k.toLowerCase())
  );
  return key ? SUITE_DESCRIPTIONS[key] : 'Suite de pruebas del módulo.';
}

function statusBadge(status) {
  if (status === 'passed')  return '<span class="badge badge-pass">✓ PASÓ</span>';
  if (status === 'failed')  return '<span class="badge badge-fail">✗ FALLÓ</span>';
  return '<span class="badge badge-skip">— OMITIDO</span>';
}

function groupByDescribe(assertionResults) {
  const groups = new Map();
  for (const r of assertionResults) {
    const key = r.ancestorTitles.join(' › ') || '(raíz)';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }
  return groups;
}

// ─── 4. Construir HTML ────────────────────────────────────────────────────────

function buildSuiteRows(testResults) {
  return testResults.map(suite => {
    // Jest 29 JSON uses `suite.name` for the file path and `suite.assertionResults` for tests
    const name     = suiteName(suite.name || suite.testFilePath || '');
    const label    = suiteLabel(name);
    const desc     = suiteDescription(name);
    const tests    = suite.assertionResults || suite.testResults || [];
    const passed   = tests.filter(t => t.status === 'passed').length;
    const failed   = tests.filter(t => t.status === 'failed').length;
    const total    = tests.length;
    const pct      = total > 0 ? Math.round((passed / total) * 100) : 0;
    const suiteOk  = failed === 0 && suite.status !== 'failed';
    const groups   = groupByDescribe(tests);

    const groupRows = [...groups.entries()].map(([groupName, tests]) => {
      const testRows = tests.map(t => {
        const dur   = typeof t.duration === 'number' ? `${t.duration} ms` : '—';
        const err   = t.failureMessages?.length
          ? `<pre class="error-block">${escHtml(t.failureMessages[0].slice(0, 600))}</pre>`
          : '';
        return `
          <tr class="test-row ${t.status}">
            <td class="td-name">${escHtml(t.title)}</td>
            <td class="td-status">${statusBadge(t.status)}</td>
            <td class="td-duration">${dur}</td>
          </tr>
          ${err ? `<tr class="err-row"><td colspan="3">${err}</td></tr>` : ''}
        `;
      }).join('');

      return `
        <tr class="group-header">
          <td colspan="3">
            <span class="group-icon">▸</span>
            <strong>${escHtml(groupName)}</strong>
            <span class="group-count">${tests.length} prueba${tests.length !== 1 ? 's' : ''}</span>
          </td>
        </tr>
        ${testRows}
      `;
    }).join('');

    return `
      <div class="suite-card ${suiteOk ? 'suite-ok' : 'suite-fail'}">
        <div class="suite-header" onclick="this.parentElement.classList.toggle('collapsed')">
          <span class="suite-toggle">▼</span>
          <div class="suite-title-block">
            <span class="suite-label">${escHtml(label)}</span>
            <span class="suite-path">${escHtml(name)}</span>
          </div>
          <div class="suite-meta">
            <span class="suite-pct" style="color:${suiteOk ? '#22c55e' : '#ef4444'}">${pct}%</span>
            <span class="suite-counts">
              <span class="c-pass">${passed} ✓</span>
              ${failed > 0 ? `<span class="c-fail">${failed} ✗</span>` : ''}
            </span>
          </div>
        </div>

        <div class="suite-description">${escHtml(desc)}</div>

        <div class="suite-body">
          <table class="test-table">
            <thead>
              <tr>
                <th>Descripción de la prueba</th>
                <th>Resultado</th>
                <th>Duración</th>
              </tr>
            </thead>
            <tbody>${groupRows}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');
}

const suiteHtml = buildSuiteRows(testResults);

const statusColor = success ? '#22c55e' : '#ef4444';
const statusText  = success ? 'TODAS LAS PRUEBAS PASARON' : 'HAY PRUEBAS FALLIDAS';

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reporte de Pruebas — NubeVigía RD</title>
  <style>
    /* ── Reset & base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      min-height: 100vh;
      line-height: 1.5;
    }

    /* ── Header ── */
    .page-header {
      background: linear-gradient(135deg, #1e3a5f 0%, #0f2744 100%);
      border-bottom: 3px solid #3b82f6;
      padding: 2rem 2.5rem 1.5rem;
    }
    .header-top {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }
    .header-icon { font-size: 2.2rem; }
    .header-title { font-size: 1.8rem; font-weight: 700; color: #f1f5f9; }
    .header-subtitle { color: #94a3b8; font-size: 0.9rem; margin-top: 0.15rem; }
    .header-meta { color: #64748b; font-size: 0.8rem; margin-top: 0.75rem; }

    /* ── Status banner ── */
    .status-banner {
      background: #1e293b;
      border-left: 6px solid ${statusColor};
      padding: 1rem 1.5rem;
      margin: 1.5rem 2.5rem;
      border-radius: 0 8px 8px 0;
      font-weight: 700;
      font-size: 1rem;
      color: ${statusColor};
      letter-spacing: 0.05em;
    }

    /* ── Summary cards ── */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      padding: 0 2.5rem 1.5rem;
    }
    .stat-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 1.2rem 1rem;
      text-align: center;
    }
    .stat-value {
      font-size: 2.2rem;
      font-weight: 800;
      display: block;
      line-height: 1;
    }
    .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 0.4rem; }
    .stat-total  .stat-value { color: #93c5fd; }
    .stat-passed .stat-value { color: #4ade80; }
    .stat-failed .stat-value { color: #f87171; }
    .stat-skip   .stat-value { color: #fbbf24; }
    .stat-rate   .stat-value { color: ${passRate >= 90 ? '#4ade80' : passRate >= 70 ? '#fbbf24' : '#f87171'}; }

    /* ── Section title ── */
    .section-title {
      padding: 0 2.5rem 1rem;
      font-size: 1.1rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      border-bottom: 1px solid #1e293b;
      margin-bottom: 1.5rem;
    }

    /* ── Suite cards ── */
    .suites-container { padding: 0 2.5rem 3rem; }
    .suite-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      margin-bottom: 1.25rem;
      overflow: hidden;
      transition: border-color 0.2s;
    }
    .suite-ok   { border-left: 4px solid #22c55e; }
    .suite-fail { border-left: 4px solid #ef4444; }
    .suite-card.collapsed .suite-body,
    .suite-card.collapsed .suite-description { display: none; }
    .suite-card.collapsed .suite-toggle { transform: rotate(-90deg); }

    .suite-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      cursor: pointer;
      user-select: none;
    }
    .suite-header:hover { background: #263348; }
    .suite-toggle { font-size: 0.85rem; color: #64748b; transition: transform 0.2s; display: inline-block; }
    .suite-title-block { flex: 1; }
    .suite-label { font-weight: 700; font-size: 1rem; display: block; }
    .suite-path  { font-size: 0.75rem; color: #64748b; font-family: monospace; }
    .suite-meta  { display: flex; align-items: center; gap: 1rem; }
    .suite-pct   { font-weight: 700; font-size: 1.1rem; }
    .suite-counts { display: flex; gap: 0.5rem; font-size: 0.85rem; }
    .c-pass { color: #4ade80; }
    .c-fail { color: #f87171; }

    .suite-description {
      padding: 0.5rem 1.25rem 1rem;
      font-size: 0.85rem;
      color: #94a3b8;
      border-top: 1px solid #263348;
      background: #172033;
    }

    /* ── Test table ── */
    .suite-body { overflow-x: auto; }
    .test-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    .test-table thead tr {
      background: #0f172a;
      color: #64748b;
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.08em;
    }
    .test-table th {
      padding: 0.6rem 1rem;
      text-align: left;
      font-weight: 600;
    }
    .test-table th:nth-child(2),
    .test-table th:nth-child(3) { text-align: center; }

    .test-row td { padding: 0.55rem 1rem; border-top: 1px solid #1e293b; }
    .test-row.passed { background: transparent; }
    .test-row.failed { background: rgba(239, 68, 68, 0.05); }
    .test-row:hover { background: #263348; }

    .td-name     { color: #cbd5e1; max-width: 520px; }
    .td-status   { text-align: center; white-space: nowrap; }
    .td-duration { text-align: center; color: #64748b; font-family: monospace; white-space: nowrap; }

    /* ── Group headers ── */
    .group-header td {
      padding: 0.45rem 1rem;
      background: #172033;
      color: #7dd3fc;
      font-size: 0.8rem;
      border-top: 2px solid #0f172a;
    }
    .group-icon { margin-right: 0.4rem; font-size: 0.7rem; }
    .group-count { color: #475569; font-size: 0.75rem; margin-left: 0.5rem; }

    /* ── Badges ── */
    .badge {
      display: inline-block;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .badge-pass { background: rgba(34,197,94,0.15);  color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
    .badge-fail { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
    .badge-skip { background: rgba(251,191,36,0.12); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); }

    /* ── Error block ── */
    .err-row td { padding: 0 1rem 0.75rem; }
    .error-block {
      background: #1a0a0a;
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 6px;
      padding: 0.75rem;
      font-family: 'Courier New', monospace;
      font-size: 0.75rem;
      color: #fca5a5;
      white-space: pre-wrap;
      word-break: break-all;
      max-height: 200px;
      overflow-y: auto;
    }

    /* ── Footer ── */
    .page-footer {
      text-align: center;
      padding: 1.5rem;
      color: #334155;
      font-size: 0.78rem;
      border-top: 1px solid #1e293b;
    }

    @media (max-width: 640px) {
      .page-header, .status-banner, .summary-grid,
      .section-title, .suites-container { padding-left: 1rem; padding-right: 1rem; }
      .status-banner { margin-left: 1rem; margin-right: 1rem; }
    }
  </style>
</head>
<body>

<header class="page-header">
  <div class="header-top">
    <span class="header-icon">🌩️</span>
    <div>
      <div class="header-title">NubeVigía RD — Reporte de Pruebas Unitarias</div>
      <div class="header-subtitle">Dashboard Climático para la República Dominicana</div>
    </div>
  </div>
  <div class="header-meta">
    Generado el ${escHtml(generatedAt)} &nbsp;·&nbsp; Duración total: ${escHtml(durationSec)} s &nbsp;·&nbsp; ${testResults.length} suite${testResults.length !== 1 ? 's' : ''}
  </div>
</header>

<div class="status-banner">${escHtml(statusText)}</div>

<div class="summary-grid">
  <div class="stat-card stat-total">
    <span class="stat-value">${numTotalTests}</span>
    <div class="stat-label">Total de pruebas</div>
  </div>
  <div class="stat-card stat-passed">
    <span class="stat-value">${numPassedTests}</span>
    <div class="stat-label">Pasaron</div>
  </div>
  <div class="stat-card stat-failed">
    <span class="stat-value">${numFailedTests}</span>
    <div class="stat-label">Fallaron</div>
  </div>
  <div class="stat-card stat-skip">
    <span class="stat-value">${numPendingTests}</span>
    <div class="stat-label">Omitidas</div>
  </div>
  <div class="stat-card stat-rate">
    <span class="stat-value">${passRate}%</span>
    <div class="stat-label">Tasa de éxito</div>
  </div>
</div>

<div class="section-title">Resultados por módulo</div>

<div class="suites-container">
  ${suiteHtml}
</div>

<footer class="page-footer">
  Generado con <strong>scripts/generate-report.js</strong> &nbsp;·&nbsp;
  Jest ${jestData.testResults[0]?.testFilePath ? '29' : '—'} &nbsp;·&nbsp;
  NubeVigía RD v1.1.0
</footer>

</body>
</html>`;

// ─── 5. Escribir archivo ──────────────────────────────────────────────────────

writeFileSync(OUTPUT_FILE, html, 'utf8');

const icon = success ? '✅' : '⚠️ ';
console.log(`\n${icon}  ${numPassedTests}/${numTotalTests} pruebas pasaron (${passRate}%)`);
console.log(`📄  Reporte generado: ${OUTPUT_FILE}\n`);

if (!success) process.exitCode = 1;
