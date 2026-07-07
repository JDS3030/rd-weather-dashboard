'use strict';

const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

const LEVEL_LABEL = {
  normal:    'Normal',
  watch:     'Vigilancia',
  warning:   'Aviso',
  emergency: 'EMERGENCIA',
};

const LEVEL_EMOJI = {
  normal:    '✅',
  watch:     '👁️',
  warning:   '⚠️',
  emergency: '🚨',
};

const DASHBOARD_URL = 'https://frontend-two-gilt-77.vercel.app';

// ─── HTML builder ─────────────────────────────────────────────────────────────

function buildEmailHtml(level, triggers, prevLevel) {
  const emoji     = LEVEL_EMOJI[level]    ?? '⚠️';
  const labelNow  = LEVEL_LABEL[level]    ?? level;
  const labelPrev = LEVEL_LABEL[prevLevel] ?? prevLevel;
  const now       = new Date().toLocaleString('es-DO', {
    timeZone:     'America/Santo_Domingo',
    dateStyle:    'full',
    timeStyle:    'short',
  });

  const triggerRows = (triggers ?? []).slice(0, 10).map(t => `
    <tr>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${t.province ?? '—'}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${t.condition ?? '—'}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #f0f0f0">${t.windKph != null ? `${t.windKph} km/h` : '—'}</td>
    </tr>`).join('');

  const triggerTable = triggerRows ? `
    <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">
      <thead>
        <tr style="background:#f5f5f5">
          <th style="padding:8px 12px;text-align:left">Provincia</th>
          <th style="padding:8px 12px;text-align:left">Condición</th>
          <th style="padding:8px 12px;text-align:left">Viento</th>
        </tr>
      </thead>
      <tbody>${triggerRows}</tbody>
    </table>` : '<p style="color:#666">Sin detonadores detallados disponibles.</p>';

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f9f9f9">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
    <div style="background:${level === 'emergency' ? '#dc2626' : '#d97706'};padding:24px;text-align:center">
      <h1 style="margin:0;color:#fff;font-size:24px">${emoji} NubeVigía RD</h1>
      <p style="margin:8px 0 0;color:#fff;font-size:16px;opacity:.9">Alerta ${labelNow} activa</p>
    </div>
    <div style="padding:24px">
      <p style="margin:0 0 8px;font-size:15px;color:#333">
        El nivel de alerta ha escalado de <strong>${labelPrev}</strong> a <strong>${labelNow}</strong>.
      </p>
      <p style="margin:0 0 16px;font-size:13px;color:#888">Detectado: ${now}</p>
      ${triggerTable}
      <div style="margin-top:24px;text-align:center">
        <a href="${DASHBOARD_URL}"
           style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:14px">
          Ver dashboard →
        </a>
      </div>
    </div>
    <div style="padding:16px 24px;background:#f5f5f5;font-size:12px;color:#999;text-align:center">
      NubeVigía RD — Monitoreo climático República Dominicana
    </div>
  </div>
</body>
</html>`;
}

// ─── SendGrid client (isolated for testing) ───────────────────────────────────

async function _send(to, subject, html) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  await sgMail.send({
    to,
    from: process.env.ALERT_EMAIL_FROM,
    subject,
    html,
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function sendAlertEmail(level, triggers, prevLevel) {
  const to = process.env.ALERT_EMAIL_TO;
  if (!to || !process.env.SENDGRID_API_KEY) {
    logger.warn('[Email] SENDGRID_API_KEY o ALERT_EMAIL_TO no configurados — email omitido');
    return;
  }

  const emoji   = LEVEL_EMOJI[level] ?? '⚠️';
  const label   = LEVEL_LABEL[level] ?? level;
  const subject = `${emoji} NubeVigía RD — Alerta ${label} activa`;
  const html    = buildEmailHtml(level, triggers, prevLevel);

  try {
    await _send(to, subject, html);
    logger.info(`[Email] Alerta ${label} enviada a ${to}`);
  } catch (err) {
    logger.error(`[Email] Error al enviar alerta: ${err.message}`);
  }
}

module.exports = { sendAlertEmail, buildEmailHtml, _send };
