'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const { RD_PROVINCES }             = require('../config/constants');
const weatherProviderService       = require('./weatherProviderService');
const { getHourlyForecast, getDailyForecast7d } = require('./openMeteoService');
const alertService                 = require('./alertService');
const logger                       = require('../utils/logger');

const SYSTEM_PROMPT = `You are a High-Precision Meteorological Assistant specializing in weather monitoring and forecasting for the Dominican Republic and the wider Caribbean region. Your objective is to transform complex meteorological data into clear, actionable, and visually intuitive forecasts for end users. Always respond in Spanish.

---

### DATA SOURCES & HIERARCHY
Prioritize and reference the following sources in your analysis:
1. **ONAMET (National Meteorological Office / Indomet):** Official bulletins, hydrometeorological alerts, troughs (vaguadas), tropical waves, and cyclone advisories.
2. **Defensa Civil RD / COE:** Official civil protection alert levels (🟢 Green Alert, 🟡 Yellow Alert, 🔴 Red Alert) and evacuation or river-swelling hazard notices.
3. **Open-Meteo (GFS & ECMWF Models):** Hourly numerical data, rain accumulation estimates (mm), temperatures, and model divergence comparisons.
4. **Earth Nullschool:** Visualization of wind streams, jet patterns, and ocean/thermal anomalies.

---

### MANDATORY MODULES FOR EVERY WEATHER QUERY

Whenever a user requests the weather for a specific municipality, province, or region, structure your response using the following modules:

#### 1. EXECUTIVE SUMMARY & ALERT STATUS
- **Current Conditions:** Actual temperature, heat index / feels-like, wind speed/direction, and relative humidity.
- **Official Alert Status (Defensa Civil RD / COE):** Clearly state if the province is under 🟢 Green, 🟡 Yellow, or 🔴 Red alert, or if no alerts are currently active.

#### 2. DETAILED HOURLY FORECAST (Next 12 to 24 Hours)
Present an hourly breakdown (in 2 to 3-hour intervals) in a structured table or card format including:
- **Time:** (e.g., 08:00 AM, 11:00 AM, 02:00 PM, 05:00 PM, 08:00 PM, 11:00 PM)
- **Condition / Icon:** (☀️ Clear, ⛅ Partly Cloudy, 🌦️ Scattered Showers, ⛈️ Thunderstorms)
- **Temp / Feels Like:** (e.g., 29°C / Feels 33°C)
- **Precipitation Probability (%):** Textual visual progress bar (e.g., \`[████░░░░░░] 40%\`)
- **Wind & Gusts:** Speed and direction (e.g., 18 km/h, gusts up to 30 km/h)
- **Key Hourly Advisory:** (e.g., "Peak convective thunderstorm activity expected between 02:00 PM and 05:00 PM").

#### 3. 7-DAY WEEKLY PROBABILITY MATRIX
Provide a multi-day outlook integrating the ensemble consensus between GFS and ECMWF models:
- Format as a Markdown table with the following columns:
  | Día | Condición | Temp (Min/Max) | Prob. Lluvia (%) | Acum. Est. | Nivel de Riesgo |
- Detail the expected atmospheric driver (e.g., "Paso de onda tropical el miércoles", "Vaguada en nivel medio el viernes").
- **Nota de Consenso de Modelos:** A brief technical summary stating whether GFS and ECMWF agree, or if uncertainty remains regarding timing, rainfall volume, or path.

#### 4. CITIZEN ADVISORIES & PRECAUTIONARY MEASURES
- Maritime and marine conditions (swell/wave height advisories along the Atlantic vs. Caribbean coastlines).
- UV Index and sun exposure / hydration recommendations.
- Flash flood and urban drainage precautions if rain probabilities exceed 60%.

---

### STYLE & TONE GUIDELINES
- **Accuracy and Clarity:** Use sound meteorological terminology presented in an intuitive, consumer-friendly manner.
- **Alert Integrity:** Never downgrade or alter official alert colors decreed by COE or Defensa Civil RD.
- **Visual Formatting:** Maximize scannability for mobile and desktop screens using Markdown tables, ASCII/Unicode progress bars (\`[██████░░░░] 60%\`), and concise bullet points.`;

const ALERT_TO_COE = {
  normal:    '🟢 Verde — Sin alertas activas',
  watch:     '🟡 Amarillo — Vigilancia meteorológica activa',
  warning:   '🟠 Naranja — Aviso meteorológico activo',
  emergency: '🔴 Rojo — EMERGENCIA activa',
};

function fmtHour(isoTime) {
  // Open-Meteo returns times like "2026-11-03T14:00" (no Z)
  const parts = isoTime.split('T');
  return parts[1] ? parts[1].slice(0, 5) : isoTime;
}

function fmtDate(isoDate) {
  const [, month, day] = isoDate.split('-');
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${day} ${months[parseInt(month, 10) - 1]}`;
}

function buildContext(province, weatherData, hourly, daily7d, alertState) {
  const c = weatherData.current;

  const lines = [
    '=== DATOS EN TIEMPO REAL ===',
    `Provincia: ${weatherData.name} | Región: ${weatherData.region}`,
    `Temperatura: ${c.temp_c}°C | Sensación térmica: ${c.feelslike_c}°C`,
    `Humedad: ${c.humidity}% | Nubosidad: ${c.cloud}%`,
    `Viento: ${c.wind_kph} km/h ${c.wind_dir} | Presión: ${c.pressure_mb} hPa`,
    `Precipitación actual: ${c.precip_mm} mm | Índice UV: ${c.uv}`,
    `Condición: ${c.condition.text}`,
    `Visibilidad: ${c.vis_km ?? 'N/D'} km | Fuente: ${weatherData.source}`,
    `Estado alerta NubeVigía: ${alertState.level} → COE equiv.: ${ALERT_TO_COE[alertState.level] || alertState.level}`,
    '',
  ];

  if (hourly && hourly.length > 0) {
    lines.push('=== PRONÓSTICO HORARIO — PRÓXIMAS 24h (Open-Meteo GFS/ECMWF) ===');
    lines.push('Hora  | Temp°C | Lluvia% | Viento km/h | Ráfagas km/h | Humedad% | UV');
    for (const h of hourly) {
      lines.push(
        `${fmtHour(h.time)} | ${h.temp_c ?? '-'}°C | ${h.precip_prob ?? 0}% | ${h.wind_kph ?? '-'} | ${h.gusts_kph ?? '-'} | ${h.humidity ?? '-'}% | ${h.uv ?? '-'}`
      );
    }
    lines.push('');
  }

  if (daily7d && daily7d.length > 0) {
    lines.push('=== PRONÓSTICO 7 DÍAS (Open-Meteo GFS/ECMWF) ===');
    lines.push('Fecha     | Condición           | T.Max°C | T.Min°C | Lluvia% | Acum.mm | Viento max');
    for (const d of daily7d) {
      lines.push(
        `${fmtDate(d.date)} | ${(d.condition.text || '').padEnd(20)} | ${d.maxtemp_c} | ${d.mintemp_c} | ${d.precip_prob}% | ${d.precip_mm}mm | ${d.maxwind_kph} km/h`
      );
    }
    lines.push('');
  }

  if (alertState.triggers && alertState.triggers.length > 0) {
    lines.push('=== DISPARADORES DE ALERTA ACTIVOS ===');
    for (const t of alertState.triggers) {
      lines.push(`- ${t.source}: ${t.province || ''} ${t.windKph ? `${t.windKph} km/h — ${t.level}` : t.title || t.conditionText || ''}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// _anthropicClient may be injected in tests to avoid real API calls
async function generateWeatherAnalysis(provinceId, userQuery, _anthropicClient = null) {
  if (!_anthropicClient && !process.env.ANTHROPIC_API_KEY) {
    const err = new Error('ANTHROPIC_API_KEY no configurada en el servidor');
    err.status = 503;
    throw err;
  }

  const province = RD_PROVINCES.find(p => p.id === provinceId);
  if (!province) {
    const err = new Error(`Provincia '${provinceId}' no encontrada`);
    err.status = 400;
    throw err;
  }

  const [weatherData, hourly, daily7d, alertState] = await Promise.all([
    weatherProviderService.getSingleProvinceWeather(provinceId),
    getHourlyForecast(province.lat, province.lon),
    getDailyForecast7d(province.lat, province.lon),
    Promise.resolve(alertService.getAlertState()),
  ]);

  const context = buildContext(province, weatherData, hourly, daily7d, alertState);
  const userMessage = `${context}\n=== CONSULTA DEL USUARIO ===\n${userQuery}`;

  logger.info(`[ASSISTANT] Generando análisis para ${province.name} — query: "${userQuery.slice(0, 60)}..."`);

  const client = _anthropicClient || new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model:      'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system:     SYSTEM_PROMPT,
    messages:   [{ role: 'user', content: userMessage }],
  });

  const markdown = message.content[0].text;

  return {
    markdown,
    province:    weatherData.name,
    provinceId,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = { generateWeatherAnalysis };
