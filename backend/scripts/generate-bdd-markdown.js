'use strict';

const fs   = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../reports/cucumber-report.json');
const OUT_PATH  = path.join(__dirname, '../reports/bdd-reporte.md');

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
    if (tags.includes('@positivo'))     countPos++;
    else if (tags.includes('@negativo')) countNeg++;
    else if (tags.includes('@limite'))   countLim++;
    for (const step of nonHidden) {
      totalSteps++;
      if (step.result?.status === 'passed') passedSteps++;
    }
  }
}

const pct = Math.round((passedScenarios / totalScenarios) * 100);
const now = new Date().toLocaleString('es-DO', { timeZone: 'America/Santo_Domingo' });

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_ICON  = { passed: '✅', failed: '❌', skipped: '⏭️', undefined: '❓', pending: '⏳' };
const KEYWORD_ES   = { 'Dado ': 'Dado', 'Cuando ': 'Cuando', 'Entonces ': 'Entonces', 'Y ': 'Y', 'Pero ': 'Pero' };

function getCat(el) {
  const tags = (el.tags || []).map(t => t.name);
  if (tags.includes('@positivo')) return { icon: '✅', label: 'Positivo' };
  if (tags.includes('@negativo')) return { icon: '🚫', label: 'Negativo' };
  if (tags.includes('@limite'))   return { icon: '📐', label: 'Límite'   };
  return { icon: '🔹', label: 'General' };
}

function parseDesc(raw) {
  if (!raw || !raw.trim()) return null;
  const lines  = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const result = { input: null, esperado: null, importancia: null, extra: [] };
  for (const line of lines) {
    if (line.startsWith('Input:'))             result.input       = line.slice(6).trim();
    else if (line.startsWith('Resultado esperado:')) result.esperado  = line.slice(19).trim();
    else if (line.startsWith('Importancia:'))   result.importancia = line.slice(12).trim();
    else                                         result.extra.push(line);
  }
  return result;
}

function renderStepsMd(steps) {
  const lines = [];
  for (const step of steps) {
    if (step.hidden) continue;
    const kw     = (KEYWORD_ES[step.keyword] ?? step.keyword?.trim() ?? '').padEnd(8);
    const status = STATUS_ICON[step.result?.status] ?? '❓';
    lines.push(`  ${status} \`${kw}\` ${step.name}`);

    // DataTable
    if (step.arguments?.length) {
      for (const arg of step.arguments) {
        if (arg.rows) {
          const rows = arg.rows;
          const header = '  ' + rows[0].cells.map(c => c.value).join(' | ');
          const sep    = '  ' + rows[0].cells.map(() => '---').join(' | ');
          const body   = rows.slice(1).map(r => '  ' + r.cells.map(c => c.value).join(' | '));
          lines.push('', header, sep, ...body, '');
        }
      }
    }

    // Error
    if (step.result?.error_message) {
      lines.push('', '  > ❌ **Error:**', '  > ```', ...step.result.error_message.split('\n').map(l => `  > ${l}`), '  > ```', '');
    }
  }
  return lines.join('\n');
}

function renderScenarioMd(el) {
  const nonHidden = el.steps.filter(s => !s.hidden);
  const allPassed = nonHidden.every(s => s.result?.status === 'passed');
  const cat       = getCat(el);
  const status    = allPassed ? '✅ Pasó' : '❌ Falló';
  const desc      = parseDesc(el.description);
  const isOutline = el.keyword?.includes('Esquema') || el.id?.includes(';');
  const typeLabel = isOutline ? ' *(Ejemplo de tabla)*' : '';

  const lines = [];
  lines.push(`#### ${cat.icon} ${el.name}${typeLabel}`);
  lines.push('');
  lines.push(`| Categoría | Estado |`);
  lines.push(`|---|---|`);
  lines.push(`| **${cat.label}** | ${status} |`);
  lines.push('');

  if (desc) {
    if (desc.input)       lines.push(`> 📥 **Input:** ${desc.input}`);
    if (desc.esperado)    lines.push(`> 🎯 **Resultado esperado:** ${desc.esperado}`);
    if (desc.importancia) lines.push(`> 💡 **Importancia:** ${desc.importancia}`);
    if (desc.extra.length) desc.extra.forEach(l => lines.push(`> ${l}`));
    lines.push('');
  }

  lines.push('**Pasos:**');
  lines.push('');
  lines.push(renderStepsMd(nonHidden));
  lines.push('');
  lines.push('---');
  lines.push('');

  return lines.join('\n');
}

function renderFeatureMd(feature) {
  const elements    = (feature.elements || []).filter(e => e.keyword !== 'Before' && e.keyword !== 'After');
  const passedCount = elements.filter(e => e.steps.filter(s => !s.hidden).every(s => s.result?.status === 'passed')).length;
  const fPos = elements.filter(e => (e.tags||[]).some(t=>t.name==='@positivo')).length;
  const fNeg = elements.filter(e => (e.tags||[]).some(t=>t.name==='@negativo')).length;
  const fLim = elements.filter(e => (e.tags||[]).some(t=>t.name==='@limite')).length;

  const lines = [];
  lines.push(`### 🌩️ ${feature.name}`);
  lines.push('');
  if (feature.description?.trim()) {
    feature.description.trim().split('\n').forEach(l => lines.push(`> ${l.trim()}`));
    lines.push('');
  }

  lines.push(`| Escenarios | ✅ Positivos | 🚫 Negativos | 📐 Límites | Resultado |`);
  lines.push(`|---|---|---|---|---|`);
  lines.push(`| ${elements.length} total | ${fPos} | ${fNeg} | ${fLim} | **${passedCount}/${elements.length} pasaron** |`);
  lines.push('');

  // Agrupar por categoría
  const groups = [
    { tag: '@positivo', icon: '✅', title: 'Escenarios Positivos' },
    { tag: '@negativo', icon: '🚫', title: 'Escenarios Negativos' },
    { tag: '@limite',   icon: '📐', title: 'Escenarios Límite (Valores Frontera)' },
  ];

  for (const g of groups) {
    const group = elements.filter(e => (e.tags||[]).some(t => t.name === g.tag));
    if (!group.length) continue;
    lines.push(`#### ${g.icon} ${g.title}`);
    lines.push('');
    for (const el of group) {
      lines.push(renderScenarioMd(el));
    }
  }

  return lines.join('\n');
}

// ── Documento completo ────────────────────────────────────────────────────────

const progressBar = (() => {
  const filled = Math.round(pct / 5);
  return '█'.repeat(filled) + '░'.repeat(20 - filled) + ` ${pct}%`;
})();

const lines = [];

lines.push(`# 🌩️ Reporte de Pruebas BDD — NubeVigía RD`);
lines.push('');
lines.push(`**Módulo:** \`alertDetector.js\`  `);
lines.push(`**Metodología:** Gherkin / Cucumber.js (BDD)  `);
lines.push(`**Generado:** ${now}  `);
lines.push(`**Proyecto:** Alterna Academy — Practica 2`);
lines.push('');
lines.push('---');
lines.push('');

// Resumen ejecutivo
lines.push('## 📊 Resumen Ejecutivo');
lines.push('');
lines.push(`\`\`\``);
lines.push(`${progressBar}`);
lines.push(`\`\`\``);
lines.push('');
lines.push(`| Métrica | Valor |`);
lines.push(`|---|---|`);
lines.push(`| Total de escenarios | **${totalScenarios}** |`);
lines.push(`| ✅ Pasaron | **${passedScenarios}** |`);
lines.push(`| ❌ Fallaron | **${failedScenarios}** |`);
lines.push(`| Total de pasos ejecutados | **${totalSteps}** |`);
lines.push(`| Pasos exitosos | **${passedSteps}** |`);
lines.push(`| Tasa de éxito | **${pct}%** |`);
lines.push('');

// Desglose por categoría
lines.push('## 🗂️ Desglose por Categoría de Prueba');
lines.push('');
lines.push(`| Categoría | Cantidad | Descripción |`);
lines.push(`|---|---|---|`);
lines.push(`| ✅ **Positivos** | ${countPos} | Datos válidos — el sistema reacciona correctamente |`);
lines.push(`| 🚫 **Negativos** | ${countNeg} | Datos inválidos o corruptos — el sistema no se cae |`);
lines.push(`| 📐 **Límites** | ${countLim} | Valores exactamente en el borde de los umbrales |`);
lines.push('');

// Leyenda
lines.push('## 🔑 Leyenda de Umbrales');
lines.push('');
lines.push(`| Umbral | Valor | Efecto |`);
lines.push(`|---|---|---|`);
lines.push(`| Tormenta Tropical | **≥ 63 km/h** | Genera trigger \`WeatherAPI-Wind\` nivel Tormenta Tropical |`);
lines.push(`| Huracán Categoría 1 | **≥ 119 km/h** | Genera trigger \`WeatherAPI-Wind\` nivel Huracán Categoría 1+ |`);
lines.push(`| ONAMET Emergency | severity = \`"emergency"\` | Incluido como trigger, nivel global: emergency |`);
lines.push(`| ONAMET Warning | severity = \`"warning"\` | Incluido como trigger, nivel global: warning |`);
lines.push(`| ONAMET Watch | severity = \`"watch"\` | **Excluido** del sistema de alertas |`);
lines.push('');
lines.push('---');
lines.push('');

// Features
lines.push('## 📋 Detalle de Escenarios');
lines.push('');
for (const feature of features) {
  lines.push(renderFeatureMd(feature));
}

// Conclusión
lines.push('---');
lines.push('');
lines.push('## ✅ Conclusión');
lines.push('');
if (failedScenarios === 0) {
  lines.push(`Todos los **${totalScenarios} escenarios** pasaron exitosamente (${totalSteps} pasos).`);
  lines.push('El módulo `alertDetector.js` cumple con los criterios de aceptación definidos');
  lines.push('para los tres enfoques de prueba: positivos, negativos y valores límite.');
} else {
  lines.push(`⚠️ **${failedScenarios} escenario(s) fallaron** de un total de ${totalScenarios}.`);
  lines.push('Revisar los escenarios marcados con ❌ para identificar y corregir los problemas.');
}
lines.push('');
lines.push('---');
lines.push('');
lines.push(`*Generado automáticamente con Cucumber.js + reportero personalizado — NubeVigía RD*`);

// Escribir archivo
fs.writeFileSync(OUT_PATH, lines.join('\n'), 'utf8');
console.log(`✅ Markdown generado: ${OUT_PATH}`);
console.log(`   ${totalScenarios} escenarios · ${totalSteps} pasos · ${pct}% éxito`);
