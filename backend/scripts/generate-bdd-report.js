'use strict';

const fs   = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../reports/cucumber-report.json');
const OUT_PATH  = path.join(__dirname, '../reports/bdd-reporte.html');

const raw      = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const features = Array.isArray(raw) ? raw : [raw];

// ── Estadísticas globales ─────────────────────────────────────────────────────

let totalScenarios = 0, passedScenarios = 0, failedScenarios = 0;
let countPos = 0, countNeg = 0, countLim = 0;
let totalSteps = 0, passedSteps = 0;

for (const feature of features) {
  for (const el of (feature.elements || [])) {
    if (el.keyword === 'Before' || el.keyword === 'After') continue;
    totalScenarios++;
    const nonHidden = el.steps.filter(s => !s.hidden);
    const allPassed = nonHidden.every(s => s.result?.status === 'passed');
    if (allPassed) passedScenarios++; else failedScenarios++;
    const tags = (el.tags || []).map(t => t.name);
    if (tags.includes('@positivo')) countPos++;
    else if (tags.includes('@negativo')) countNeg++;
    else if (tags.includes('@limite'))  countLim++;
    for (const step of nonHidden) {
      totalSteps++;
      if (step.result?.status === 'passed') passedSteps++;
    }
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const KEYWORD_ES = {
  'Dado ': 'Dado', 'Cuando ': 'Cuando', 'Entonces ': 'Entonces', 'Y ': 'Y', 'Pero ': 'Pero',
};
const STATUS_ICON  = { passed: '✅', failed: '❌', skipped: '⏭️', undefined: '❓', pending: '⏳' };

// Configuración visual por categoría de tag
const TAG_CONFIG = {
  '@positivo': {
    label:      '✅ Positivo',
    headerCls:  'cat-pos-header',
    badgeCls:   'badge-cat-pos',
    borderCls:  'border-pos',
  },
  '@negativo': {
    label:      '🚫 Negativo',
    headerCls:  'cat-neg-header',
    badgeCls:   'badge-cat-neg',
    borderCls:  'border-neg',
  },
  '@limite': {
    label:      '📐 Límite',
    headerCls:  'cat-lim-header',
    badgeCls:   'badge-cat-lim',
    borderCls:  'border-lim',
  },
};

function getCatConfig(el) {
  const tags = (el.tags || []).map(t => t.name);
  for (const tag of ['@positivo', '@negativo', '@limite']) {
    if (tags.includes(tag)) return TAG_CONFIG[tag];
  }
  return { label: 'Escenario', headerCls: 'cat-pos-header', badgeCls: 'badge-cat-pos', borderCls: 'border-pos' };
}

function renderStep(step) {
  if (step.hidden) return '';
  const status  = step.result?.status ?? 'undefined';
  const kwLabel = KEYWORD_ES[step.keyword] ?? step.keyword?.trim() ?? '';
  const icon    = STATUS_ICON[status] ?? '❓';
  const err     = step.result?.error_message
    ? `<pre class="error-msg">${escHtml(step.result.error_message)}</pre>` : '';

  let tableHtml = '';
  if (step.arguments?.length) {
    for (const arg of step.arguments) {
      if (arg.rows) {
        tableHtml += '<table class="dt">';
        for (const [i, row] of arg.rows.entries()) {
          const tag = i === 0 ? 'th' : 'td';
          tableHtml += '<tr>' + row.cells.map(c => `<${tag}>${escHtml(c.value)}</${tag}>`).join('') + '</tr>';
        }
        tableHtml += '</table>';
      }
    }
  }

  return `
    <div class="step step-${status}">
      <span class="step-icon">${icon}</span>
      <span class="step-kw">${escHtml(kwLabel)}</span>
      <span class="step-name">${escHtml(step.name)}</span>
      ${tableHtml}${err}
    </div>`;
}

function renderScenario(el, index) {
  const nonHidden = el.steps.filter(s => !s.hidden);
  const allPassed = nonHidden.every(s => s.result?.status === 'passed');
  const passBadge = allPassed
    ? '<span class="badge badge-pass">✅ Pasó</span>'
    : '<span class="badge badge-fail">❌ Falló</span>';

  const cat    = getCatConfig(el);
  const catBadge = `<span class="badge ${cat.badgeCls}">${cat.label}</span>`;
  const isOutline = el.keyword?.includes('Esquema') || el.id?.includes(';');
  const typeBadge = isOutline
    ? '<span class="type-tag outline">Ejemplo de tabla</span>'
    : '';

  // Descripción del escenario (texto entre el nombre y el primer Dado)
  const descRaw  = (el.description || '').trim();
  const descHtml = descRaw
    ? `<div class="scenario-desc">
        ${descRaw.split('\n').map(line => {
          const l = escHtml(line.trim());
          if (l.startsWith('Input:'))            return `<p><strong class="desc-label lbl-input">📥 Input</strong> ${l.slice(6).trim()}</p>`;
          if (l.startsWith('Resultado esperado:')) return `<p><strong class="desc-label lbl-result">🎯 Resultado esperado</strong> ${l.slice(19).trim()}</p>`;
          if (l.startsWith('Importancia:'))       return `<p><strong class="desc-label lbl-why">💡 Importancia</strong> ${l.slice(12).trim()}</p>`;
          if (l.startsWith('Prueba'))             return `<p class="desc-general">${l}</p>`;
          return l ? `<p class="desc-general">${l}</p>` : '';
        }).filter(Boolean).join('')}
      </div>` : '';

  const uid = `sc-${index}`;
  return `
  <div class="scenario ${cat.borderCls}">
    <div class="scenario-header ${cat.headerCls}" onclick="toggle('${uid}')">
      <div class="scenario-title">
        ${passBadge}
        ${catBadge}
        ${typeBadge}
        <span class="scenario-name">${escHtml(el.name)}</span>
      </div>
      <span class="chevron" id="chev-${uid}">▼</span>
    </div>
    <div class="scenario-body" id="${uid}">
      ${descHtml}
      <div class="steps-section"><div class="steps-label">Pasos ejecutados</div>${nonHidden.map(renderStep).join('')}</div>
    </div>
  </div>`;
}

function renderFeature(feature, fIdx) {
  const elements    = (feature.elements || []).filter(e => e.keyword !== 'Before' && e.keyword !== 'After');
  const passedCount = elements.filter(e => e.steps.filter(s => !s.hidden).every(s => s.result?.status === 'passed')).length;
  const total       = elements.length;
  const allOk       = passedCount === total;

  // Conteo por categoría dentro de este feature
  const fPos = elements.filter(e => (e.tags||[]).some(t=>t.name==='@positivo')).length;
  const fNeg = elements.filter(e => (e.tags||[]).some(t=>t.name==='@negativo')).length;
  const fLim = elements.filter(e => (e.tags||[]).some(t=>t.name==='@limite')).length;

  return `
  <div class="feature">
    <div class="feature-header">
      <div class="feature-title">
        <span class="feature-icon">${allOk ? '✅' : '❌'}</span>
        <h2>${escHtml(feature.name)}</h2>
      </div>
      <div class="feature-meta">
        <span class="meta-pill pill-pos">✅ ${fPos} positivos</span>
        <span class="meta-pill pill-neg">🚫 ${fNeg} negativos</span>
        <span class="meta-pill pill-lim">📐 ${fLim} límites</span>
        <span class="meta-pill pill-total">${passedCount}/${total} pasaron</span>
      </div>
    </div>
    ${feature.description ? `<p class="feature-desc">${escHtml(feature.description.trim()).replace(/\n/g, '<br>')}</p>` : ''}
    <div class="scenarios-list">
      ${elements.map((el, i) => renderScenario(el, fIdx * 1000 + i)).join('')}
    </div>
  </div>`;
}

// ── HTML ──────────────────────────────────────────────────────────────────────

const now      = new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' });
const pct      = Math.round((passedScenarios / totalScenarios) * 100);
const pctColor = pct === 100 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#ef4444';

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte BDD — NubeVigía RD</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #0f172a; color: #e2e8f0; }

    /* ── Cabecera ── */
    .header {
      background: linear-gradient(135deg, #1e3a5f, #0f2647);
      border-bottom: 2px solid #2563eb;
      padding: 28px 40px;
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
    }
    .header h1   { font-size: 1.7rem; font-weight: 700; color: #fff; }
    .header .sub { font-size: 0.85rem; color: #94a3b8; margin-top: 4px; }
    .header .ts  { font-size: 0.78rem; color: #64748b; margin-top: 5px; }

    /* ── Leyenda ── */
    .legend {
      display: flex; gap: 10px; padding: 20px 40px 0; flex-wrap: wrap; align-items: center;
    }
    .legend-title { font-size: 0.8rem; color: #64748b; margin-right: 6px; }
    .leg { display: flex; align-items: center; gap: 6px; font-size: 0.82rem; padding: 4px 12px;
           border-radius: 999px; font-weight: 600; }
    .leg-pos { background: #0f2d1a; color: #86efac; border: 1px solid #166534; }
    .leg-neg { background: #2d0f0f; color: #fca5a5; border: 1px solid #7f1d1d; }
    .leg-lim { background: #1e1b4b; color: #c4b5fd; border: 1px solid #4c1d95; }

    /* ── Tarjetas resumen ── */
    .summary {
      display: flex; gap: 14px; padding: 20px 40px; flex-wrap: wrap;
    }
    .card {
      flex: 1; min-width: 140px; background: #1e293b; border: 1px solid #334155;
      border-radius: 12px; padding: 18px 20px; text-align: center;
    }
    .card .num   { font-size: 2.4rem; font-weight: 800; line-height: 1; }
    .card .lbl   { font-size: 0.75rem; color: #94a3b8; margin-top: 5px; text-transform: uppercase; letter-spacing: .05em; }
    .blue  .num  { color: #60a5fa; } .green .num { color: #22c55e; }
    .red   .num  { color: #ef4444; } .purple .num { color: #c4b5fd; }
    .orange .num { color: #fb923c; } .yellow .num { color: #fbbf24; }

    /* ── Filtros ── */
    .filters { display: flex; gap: 8px; padding: 0 40px 16px; flex-wrap: wrap; }
    .filter-btn {
      padding: 6px 16px; border-radius: 999px; border: 1px solid #334155;
      background: #1e293b; color: #94a3b8; font-size: 0.8rem; cursor: pointer;
      font-weight: 600; transition: all .2s;
    }
    .filter-btn:hover, .filter-btn.active { background: #334155; color: #f1f5f9; border-color: #60a5fa; }
    .filter-btn.f-pos.active { background: #0f2d1a; color: #86efac; border-color: #166534; }
    .filter-btn.f-neg.active { background: #2d0f0f; color: #fca5a5; border-color: #7f1d1d; }
    .filter-btn.f-lim.active { background: #1e1b4b; color: #c4b5fd; border-color: #4c1d95; }

    /* ── Barra de progreso ── */
    .prog-wrap { padding: 0 40px 20px; }
    .prog-bg { background: #1e293b; border-radius: 999px; height: 14px; overflow: hidden; border: 1px solid #334155; }
    .prog-fill { height: 100%; border-radius: 999px; background: ${pctColor}; width: ${pct}%; }
    .prog-lbl { font-size: 0.82rem; color: #94a3b8; margin-top: 5px; text-align: right; }

    /* ── Feature ── */
    .features { padding: 0 40px 48px; display: flex; flex-direction: column; gap: 20px; }
    .feature { background: #1e293b; border: 1px solid #334155; border-radius: 14px; overflow: hidden; }
    .feature-header {
      padding: 16px 22px; background: #273549; border-bottom: 1px solid #334155;
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
    }
    .feature-title { display: flex; align-items: center; gap: 10px; }
    .feature-icon  { font-size: 1.2rem; }
    .feature-title h2 { font-size: 1rem; font-weight: 600; color: #f1f5f9; }
    .feature-meta  { display: flex; gap: 8px; flex-wrap: wrap; }
    .meta-pill     { padding: 3px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }
    .pill-pos   { background: #0f2d1a; color: #86efac; }
    .pill-neg   { background: #2d0f0f; color: #fca5a5; }
    .pill-lim   { background: #1e1b4b; color: #c4b5fd; }
    .pill-total { background: #1e3a5f; color: #93c5fd; }
    .feature-desc { padding: 10px 22px; font-size: 0.82rem; color: #64748b; font-style: italic; }

    /* ── Scenarios ── */
    .scenarios-list { padding: 10px 14px; display: flex; flex-direction: column; gap: 6px; }
    .scenario { border-radius: 10px; overflow: hidden; border-width: 1px; border-style: solid; }

    /* Bordes por categoría */
    .border-pos { border-color: #166534; }
    .border-neg { border-color: #7f1d1d; }
    .border-lim { border-color: #4c1d95; }

    .scenario-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 10px 15px; cursor: pointer; user-select: none; gap: 8px;
    }
    .scenario-header:hover { filter: brightness(1.15); }

    /* Fondo de cabecera por categoría */
    .cat-pos-header { background: #0a2018; }
    .cat-neg-header { background: #200a0a; }
    .cat-lim-header { background: #130e2e; }

    .scenario-title { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; }
    .scenario-name  { font-size: 0.88rem; color: #e2e8f0; font-weight: 500; }
    .chevron        { font-size: 0.72rem; color: #64748b; transition: transform .2s; flex-shrink: 0; }
    .chevron.open   { transform: rotate(180deg); }

    /* Badges */
    .badge           { padding: 2px 9px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; flex-shrink: 0; }
    .badge-pass      { background: #14532d; color: #86efac; }
    .badge-fail      { background: #450a0a; color: #fca5a5; }
    .badge-cat-pos   { background: #14532d; color: #4ade80; border: 1px solid #166534; }
    .badge-cat-neg   { background: #450a0a; color: #f87171; border: 1px solid #7f1d1d; }
    .badge-cat-lim   { background: #2e1065; color: #c4b5fd; border: 1px solid #4c1d95; }
    .type-tag        { padding: 2px 8px; border-radius: 4px; font-size: 0.68rem;
                       background: #1e3a5f; color: #93c5fd; font-weight: 600; flex-shrink: 0; }
    .type-tag.outline { background: #2d1b6b; color: #c4b5fd; }

    /* Body del escenario */
    .scenario-body      { display: none; background: #0d1829; border-top: 1px solid #1e293b; }
    .scenario-body.open { display: block; }

    /* Descripción del escenario */
    .scenario-desc {
      padding: 12px 16px 10px;
      border-bottom: 1px dashed #1e3a5f;
      display: flex; flex-direction: column; gap: 5px;
    }
    .scenario-desc p { font-size: 0.83rem; color: #94a3b8; line-height: 1.5; display: flex; gap: 8px; flex-wrap: wrap; align-items: baseline; }
    .desc-label {
      flex-shrink: 0; font-size: 0.72rem; padding: 1px 8px;
      border-radius: 4px; font-weight: 700;
    }
    .lbl-input  { background: #1e3a5f; color: #93c5fd; }
    .lbl-result { background: #14532d; color: #86efac; }
    .lbl-why    { background: #422006; color: #fdba74; }
    .desc-general { color: #64748b; font-style: italic; }

    /* Sección de pasos */
    .steps-section { padding: 10px 15px 13px; }
    .steps-label   { font-size: 0.7rem; color: #475569; text-transform: uppercase;
                     letter-spacing: .06em; margin-bottom: 6px; font-weight: 600; }

    /* Steps */
    .step          { display: flex; align-items: flex-start; gap: 9px; padding: 4px 0; font-size: 0.83rem; flex-wrap: wrap; }
    .step-icon     { flex-shrink: 0; }
    .step-kw       { color: #60a5fa; font-weight: 600; min-width: 58px; flex-shrink: 0; }
    .step-name     { color: #cbd5e1; flex: 1; }
    .step-passed .step-name  { color: #d1fae5; }
    .step-failed .step-name  { color: #fecaca; }
    .step-skipped .step-name { color: #475569; }
    .error-msg {
      width: 100%; margin-top: 6px; padding: 8px 12px;
      background: #1c0e0e; border-left: 3px solid #ef4444; border-radius: 4px;
      font-size: 0.76rem; color: #fca5a5; overflow-x: auto; white-space: pre-wrap; word-break: break-all;
    }

    /* DataTable */
    .dt           { width: 100%; margin-top: 6px; border-collapse: collapse; font-size: 0.78rem; }
    .dt th        { background: #1e3a5f; color: #93c5fd; padding: 4px 10px; text-align: left; font-weight: 600; border: 1px solid #2d4a6e; }
    .dt td        { padding: 4px 10px; border: 1px solid #273549; color: #94a3b8; }
    .dt tr:nth-child(even) td { background: #131e2e; }

    /* Ocultar por filtro */
    .scenario.hidden-by-filter { display: none; }

    .footer { text-align: center; padding: 20px; font-size: 0.76rem; color: #475569; border-top: 1px solid #1e293b; }
  </style>
</head>
<body>

<div class="header">
  <div>
    <h1>🌩️ NubeVigía RD — Reporte de Pruebas BDD</h1>
    <div class="sub">Módulo: <strong>alertDetector.js</strong> · Metodología Gherkin / Cucumber.js</div>
    <div class="ts">Generado el ${escHtml(now)}</div>
  </div>
</div>

<!-- Leyenda de colores -->
<div class="legend">
  <span class="legend-title">Categorías:</span>
  <span class="leg leg-pos">✅ Positivo — el sistema hace lo correcto con datos válidos</span>
  <span class="leg leg-neg">🚫 Negativo — el sistema maneja bien datos inválidos o corruptos</span>
  <span class="leg leg-lim">📐 Límite — prueba exactamente en el borde de los umbrales</span>
</div>

<!-- Tarjetas resumen -->
<div class="summary">
  <div class="card blue">
    <div class="num">${totalScenarios}</div>
    <div class="lbl">Total escenarios</div>
  </div>
  <div class="card green">
    <div class="num">${countPos}</div>
    <div class="lbl">✅ Positivos</div>
  </div>
  <div class="card red">
    <div class="num">${countNeg}</div>
    <div class="lbl">🚫 Negativos</div>
  </div>
  <div class="card purple">
    <div class="num">${countLim}</div>
    <div class="lbl">📐 Límites</div>
  </div>
  <div class="card ${pct === 100 ? 'green' : 'orange'}">
    <div class="num">${pct}%</div>
    <div class="lbl">Tasa de éxito</div>
  </div>
  <div class="card blue">
    <div class="num">${totalSteps}</div>
    <div class="lbl">Pasos ejecutados</div>
  </div>
</div>

<!-- Barra de progreso -->
<div class="prog-wrap">
  <div class="prog-bg"><div class="prog-fill"></div></div>
  <div class="prog-lbl">${passedScenarios} de ${totalScenarios} escenarios aprobados</div>
</div>

<!-- Botones de filtro -->
<div class="filters">
  <span style="font-size:0.8rem;color:#64748b;align-self:center;">Filtrar por:</span>
  <button class="filter-btn active" onclick="filterScenarios('todos', this)">Todos</button>
  <button class="filter-btn f-pos"  onclick="filterScenarios('positivo', this)">✅ Solo Positivos</button>
  <button class="filter-btn f-neg"  onclick="filterScenarios('negativo', this)">🚫 Solo Negativos</button>
  <button class="filter-btn f-lim"  onclick="filterScenarios('limite',   this)">📐 Solo Límites</button>
</div>

<!-- Features -->
<div class="features">
  ${features.map(renderFeature).join('')}
</div>

<div class="footer">
  NubeVigía RD · Alterna Academy · Practica 2 · Generado con Cucumber.js + reportero personalizado
</div>

<script>
  function toggle(id) {
    const body = document.getElementById(id);
    const chev = document.getElementById('chev-' + id);
    if (!body) return;
    const isOpen = body.classList.contains('open');
    body.classList.toggle('open', !isOpen);
    chev && chev.classList.toggle('open', !isOpen);
  }

  // Expandir automáticamente los fallidos
  document.querySelectorAll('.scenario').forEach(sc => {
    if (sc.classList.contains('border-fail')) {
      const body = sc.querySelector('.scenario-body');
      const chev = sc.querySelector('.chevron');
      if (body) { body.classList.add('open'); chev && chev.classList.add('open'); }
    }
  });

  // Filtro por categoría
  function filterScenarios(cat, btn) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('.scenario').forEach(sc => {
      if (cat === 'todos') {
        sc.classList.remove('hidden-by-filter');
      } else {
        const hasCat = sc.classList.contains('border-' + cat.slice(0, 3));
        sc.classList.toggle('hidden-by-filter', !hasCat);
      }
    });
  }
</script>
</body>
</html>`;

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, html, 'utf8');
console.log('✅ Reporte generado:', OUT_PATH);
console.log(`   ✅ Positivos: ${countPos}  🚫 Negativos: ${countNeg}  📐 Límites: ${countLim}`);
console.log(`   Escenarios: ${passedScenarios}/${totalScenarios} pasaron (${pct}%)`);
