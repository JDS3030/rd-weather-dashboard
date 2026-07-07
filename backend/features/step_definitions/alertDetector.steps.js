'use strict';

const { Given, When, Then, Before } = require('@cucumber/cucumber');
const assert = require('assert');

const {
  detectFromWeather,
  detectFromOnamet,
  computeAlertLevel,
} = require('../../src/services/alertDetector');

const { ALERT_LEVELS } = require('../../src/config/constants');

// ─── Estado compartido por escenario ─────────────────────────────────────────

Before(function () {
  this.provincesData = [];
  this.onaMetAlerts  = [];
  this.triggers      = [];
  this.alertLevel    = null;
  this.error         = null;
});

// ─── Helper: provincia base con todos los campos requeridos ───────────────────

const DEFAULT_CURRENT = {
  temp_c: 28, feelslike_c: 30, humidity: 65,
  wind_kph: 20, wind_dir: 'E', pressure_mb: 1013,
  vis_km: 10, uv: 7, precip_mm: 0, cloud: 10,
  condition: { text: 'Despejado', icon: '', code: 1000 },
};

function makeProvince(name, overrides = {}) {
  return {
    id: name.toLowerCase().replace(/\s+/g, '_'),
    name,
    region: 'Test',
    current: { ...DEFAULT_CURRENT },
    forecast: [],
    alerts: [],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// GIVEN — construcción de datos de entrada
// ══════════════════════════════════════════════════════════════════════════════

// ── Viento ────────────────────────────────────────────────────────────────────

Given('una provincia {string} con viento de {float} km\\/h', function (name, windKph) {
  this.provincesData = [
    makeProvince(name, { current: { ...DEFAULT_CURRENT, wind_kph: windKph } }),
  ];
});

Given('una provincia {string} con wind_kph nulo', function (name) {
  this.provincesData = [
    makeProvince(name, { current: { ...DEFAULT_CURRENT, wind_kph: null } }),
  ];
});

Given('una provincia {string} con wind_kph en string {string}', function (name, windStr) {
  // Simula dato corrupto: string en lugar de número
  this.provincesData = [
    makeProvince(name, { current: { ...DEFAULT_CURRENT, wind_kph: windStr } }),
  ];
});

Given('las siguientes provincias con viento:', function (dataTable) {
  const rows = dataTable.hashes();
  this.provincesData = rows.map(row =>
    makeProvince(row.provincia, {
      current: { ...DEFAULT_CURRENT, wind_kph: parseFloat(row.wind_kph) },
    })
  );
});

// ── Condición ─────────────────────────────────────────────────────────────────

Given('una provincia {string} con condición de texto {string}', function (name, condText) {
  this.provincesData = [
    makeProvince(name, {
      current: { ...DEFAULT_CURRENT, condition: { text: condText, icon: '', code: 1000 } },
    }),
  ];
});

Given('una provincia {string} con condition nulo', function (name) {
  this.provincesData = [
    makeProvince(name, {
      current: { ...DEFAULT_CURRENT, condition: null },
    }),
  ];
});

// ── Alertas oficiales WeatherAPI ──────────────────────────────────────────────

Given('una provincia {string} con alerta oficial de evento {string}', function (name, event) {
  this.provincesData = [
    makeProvince(name, { alerts: [{ event, desc: '' }] }),
  ];
});

Given('una provincia {string} con alerta oficial de descripción {string}', function (name, desc) {
  this.provincesData = [
    makeProvince(name, { alerts: [{ event: '', desc }] }),
  ];
});

Given('una provincia {string} con lista de alertas vacía', function (name) {
  this.provincesData = [makeProvince(name, { alerts: [] })];
});

// ── Estructuras ausentes ──────────────────────────────────────────────────────

Given('una provincia {string} sin datos de current', function (name) {
  this.provincesData = [{ id: name.toLowerCase(), name, region: 'Test', alerts: [] }];
});

Given('una provincia {string} sin propiedad alerts', function (name) {
  const province = makeProvince(name);
  delete province.alerts;
  this.provincesData = [province];
});

Given('un array de provincias vacío', function () {
  this.provincesData = [];
});

// ── ONAMET ────────────────────────────────────────────────────────────────────

Given('una alerta ONAMET con severity {string}', function (severity) {
  this.onaMetAlerts = [{
    id: 'TEST-001',
    title: `Alerta de prueba (${severity})`,
    description: 'Descripción de prueba para tests BDD.',
    type: 'test',
    severity,
  }];
});

Given('una alerta ONAMET con severity {string} y título {string}', function (severity, title) {
  this.onaMetAlerts = [{
    id: 'TEST-001',
    title,
    description: 'Descripción de prueba para tests BDD.',
    type: 'test',
    severity,
  }];
});

Given('una alerta ONAMET sin propiedad severity', function () {
  this.onaMetAlerts = [{
    id: 'TEST-001',
    title: 'Alerta sin severity',
    description: 'Sin campo severity.',
    type: 'test',
    // severity: deliberadamente omitida
  }];
});

Given('una lista de alertas ONAMET vacía', function () {
  this.onaMetAlerts = [];
});

Given(
  '{int} alertas ONAMET con severidades {string}, {string} y {string}',
  function (count, sev1, sev2, sev3) {
    this.onaMetAlerts = [sev1, sev2, sev3].map((severity, i) => ({
      id: `TEST-00${i + 1}`,
      title: `Alerta de prueba ${i + 1}`,
      description: 'Descripción de prueba.',
      type: 'test',
      severity,
    }));
  }
);

// ── Triggers para computeAlertLevel ──────────────────────────────────────────

Given('los siguientes triggers:', function (dataTable) {
  const rows = dataTable.hashes();
  this.triggers = rows.map(row => {
    const trigger = {};
    // Solo asigna campos presentes y no vacíos (columnas opcionales del DataTable)
    if (row.source)   trigger.source   = row.source;
    if (row.level)    trigger.level    = row.level;
    if (row.severity) trigger.severity = row.severity;
    if (row.keyword)  trigger.keyword  = row.keyword;
    return trigger;
  });
});

Given('una lista de triggers vacía', function () {
  this.triggers = [];
});

// ── Escenario Outline: nivel de trigger prearmado ─────────────────────────────
Given('los triggers de nivel más alto es {string}', function (nivelTrigger) {
  const map = {
    hurricane:      [{ source: 'WeatherAPI-Wind', level: 'Huracán Categoría 1+', windKph: 120 }],
    onamet_warn:    [{ source: 'ONAMET', severity: 'warning' }],
    solo_condicion: [{ source: 'WeatherAPI-Condition', keyword: 'hurricane' }],
    ninguno:        [],
  };
  this.triggers = map[nivelTrigger] ?? [];
});

// ══════════════════════════════════════════════════════════════════════════════
// WHEN — ejecución de las funciones bajo prueba
// ══════════════════════════════════════════════════════════════════════════════

When('ejecuto detectFromWeather', function () {
  try {
    this.triggers = detectFromWeather(this.provincesData);
  } catch (err) {
    this.error = err;
    this.triggers = [];
  }
});

When('ejecuto detectFromOnamet', function () {
  try {
    this.triggers = detectFromOnamet(this.onaMetAlerts);
  } catch (err) {
    this.error = err;
    this.triggers = [];
  }
});

When('ejecuto computeAlertLevel', function () {
  try {
    this.alertLevel = computeAlertLevel(this.triggers);
  } catch (err) {
    this.error = err;
    this.alertLevel = null;
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// THEN — aserciones
// ══════════════════════════════════════════════════════════════════════════════

// ── Conteo de triggers ────────────────────────────────────────────────────────

Then('obtengo {int} trigger\\(s\\) de fuente {string}', function (expected, source) {
  const found = this.triggers.filter(t => t.source === source);
  assert.strictEqual(
    found.length, expected,
    `Esperaba ${expected} trigger(s) de fuente '${source}', obtuve ${found.length}.\nTriggers: ${JSON.stringify(this.triggers, null, 2)}`
  );
});

Then('no obtengo triggers de fuente {string}', function (source) {
  const found = this.triggers.filter(t => t.source === source);
  assert.strictEqual(
    found.length, 0,
    `Esperaba 0 triggers de fuente '${source}', obtuve ${found.length}.`
  );
});

Then('obtengo una lista de triggers vacía', function () {
  assert.strictEqual(
    this.triggers.length, 0,
    `Esperaba lista vacía, obtuve ${this.triggers.length} trigger(s).`
  );
});

// ── Propiedades del trigger de viento ────────────────────────────────────────

Then('el trigger de viento tiene nivel que contiene {string}', function (fragment) {
  const t = this.triggers.find(tr => tr.source === 'WeatherAPI-Wind');
  assert.ok(t, 'No se encontró ningún trigger de WeatherAPI-Wind.');
  assert.ok(
    t.level.includes(fragment),
    `El nivel '${t.level}' no contiene '${fragment}'.`
  );
});

Then('el trigger de viento registra windKph de {float}', function (expected) {
  const t = this.triggers.find(tr => tr.source === 'WeatherAPI-Wind');
  assert.ok(t, 'No se encontró trigger de WeatherAPI-Wind.');
  assert.strictEqual(t.windKph, expected, `windKph esperado: ${expected}, obtuve: ${t.windKph}`);
});

// ── Propiedades del trigger de condición ─────────────────────────────────────

Then('el trigger de condición tiene keyword {string}', function (expectedKw) {
  const t = this.triggers.find(tr => tr.source === 'WeatherAPI-Condition');
  assert.ok(t, 'No se encontró trigger de WeatherAPI-Condition.');
  assert.strictEqual(
    t.keyword.toLowerCase(), expectedKw.toLowerCase(),
    `Keyword esperada: '${expectedKw}', obtuve: '${t.keyword}'.`
  );
});

// ── Propiedades del trigger de alerta oficial ─────────────────────────────────

Then('el trigger de alerta tiene provincia {string}', function (provinceName) {
  const t = this.triggers.find(tr => tr.source === 'WeatherAPI-Alert' && tr.province === provinceName);
  assert.ok(t, `No se encontró trigger WeatherAPI-Alert para la provincia '${provinceName}'.`);
});

// ── Propiedades del trigger ONAMET ───────────────────────────────────────────

Then('obtengo {int} trigger\\(s\\) ONAMET', function (expected) {
  const found = this.triggers.filter(t => t.source === 'ONAMET');
  assert.strictEqual(
    found.length, expected,
    `Esperaba ${expected} trigger(s) ONAMET, obtuve ${found.length}.`
  );
});

Then('el trigger ONAMET tiene source {string}', function (expectedSource) {
  const t = this.triggers[0];
  assert.ok(t, 'No hay triggers en la lista.');
  assert.strictEqual(t.source, expectedSource);
});

Then('el trigger ONAMET tiene el título {string}', function (expectedTitle) {
  const t = this.triggers.find(tr => tr.source === 'ONAMET');
  assert.ok(t, 'No se encontró trigger ONAMET.');
  assert.strictEqual(t.title, expectedTitle, `Título esperado: '${expectedTitle}', obtuve: '${t.title}'.`);
});

Then('el trigger ONAMET tiene severity {string}', function (expectedSeverity) {
  const t = this.triggers.find(tr => tr.source === 'ONAMET');
  assert.ok(t, 'No se encontró trigger ONAMET.');
  assert.strictEqual(t.severity, expectedSeverity);
});

// ── Nivel de alerta global ────────────────────────────────────────────────────

Then('el nivel de alerta calculado es {string}', function (expected) {
  assert.strictEqual(
    this.alertLevel, expected,
    `Nivel esperado: '${expected}', obtuve: '${this.alertLevel}'.`
  );
});

// ── Control de errores ────────────────────────────────────────────────────────

Then('no se lanza ningún error', function () {
  assert.strictEqual(
    this.error, null,
    `Se lanzó un error inesperado: ${this.error?.message}`
  );
});

// ── Then para Scenario Outline: resultado de viento (boundary) ────────────────

Then('el resultado de viento es {string}', function (resultado) {
  const windTriggers = this.triggers.filter(t => t.source === 'WeatherAPI-Wind');

  if (resultado === 'sin trigger') {
    assert.strictEqual(windTriggers.length, 0,
      `Esperaba sin trigger de viento, pero se encontró: ${JSON.stringify(windTriggers)}`);
    return;
  }

  assert.strictEqual(windTriggers.length, 1,
    `Esperaba 1 trigger de viento, obtuve ${windTriggers.length}.`);
  assert.ok(
    windTriggers[0].level.includes(resultado),
    `El nivel '${windTriggers[0].level}' no coincide con '${resultado}'.`
  );
});

// ── Then para Scenario Outline: resultado de condición (boundary) ─────────────

Then('el resultado de condición es {string}', function (resultado) {
  const condTriggers = this.triggers.filter(t => t.source === 'WeatherAPI-Condition');

  if (resultado === 'sin trigger') {
    assert.strictEqual(condTriggers.length, 0,
      `Esperaba sin trigger de condición, obtuve ${condTriggers.length}.`);
  } else {
    assert.ok(condTriggers.length >= 1,
      `Esperaba al menos 1 trigger de condición, obtuve 0.`);
  }
});

// ── Then para Scenario Outline: resultado ONAMET (boundary) ──────────────────

Then('el resultado ONAMET es {string}', function (resultado) {
  const onaMetTriggers = this.triggers.filter(t => t.source === 'ONAMET');

  if (resultado === 'excluida') {
    assert.strictEqual(onaMetTriggers.length, 0,
      `Esperaba alerta excluida, pero se encontró trigger ONAMET.`);
  } else {
    assert.ok(onaMetTriggers.length >= 1,
      `Esperaba alerta incluida, obtuve 0 triggers ONAMET.`);
  }
});
