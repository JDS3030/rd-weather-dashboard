'use strict';

// sgMail es un singleton CJS: la misma instancia que usa emailService.js.
// vi.spyOn en runtime es suficiente — no se necesita vi.mock() con hoisting.
const sgMail       = require('@sendgrid/mail');
const emailService = require('../src/services/emailService');

const TRIGGERS = [
  { province: 'Santiago',     condition: 'Tormenta eléctrica', windKph: 75 },
  { province: 'Puerto Plata', condition: 'Lluvia intensa',     windKph: 65 },
];

beforeEach(() => {
  process.env.SENDGRID_API_KEY  = 'SG.test-key';
  process.env.ALERT_EMAIL_TO    = 'test@example.com';
  process.env.ALERT_EMAIL_FROM  = 'noreply@nubevigia.com';
  vi.spyOn(sgMail, 'setApiKey').mockImplementation(() => {});
  vi.spyOn(sgMail, 'send').mockResolvedValue([{ statusCode: 202 }]);
});

afterEach(() => vi.restoreAllMocks());

// ─── sendAlertEmail ───────────────────────────────────────────────────────────

describe('sendAlertEmail()', () => {
  test('envía email cuando nivel sube a warning', async () => {
    await emailService.sendAlertEmail('warning', TRIGGERS, 'normal');
    expect(sgMail.send).toHaveBeenCalledTimes(1);
    const call = sgMail.send.mock.calls[0][0];
    expect(call.to).toBe('test@example.com');
    expect(call.subject).toContain('Aviso');
  });

  test('envía email cuando nivel sube a emergency', async () => {
    await emailService.sendAlertEmail('emergency', TRIGGERS, 'normal');
    expect(sgMail.send).toHaveBeenCalledTimes(1);
    const call = sgMail.send.mock.calls[0][0];
    expect(call.subject).toContain('EMERGENCIA');
  });

  test('envía email cuando escala de warning a emergency', async () => {
    await emailService.sendAlertEmail('emergency', TRIGGERS, 'warning');
    expect(sgMail.send).toHaveBeenCalledTimes(1);
  });

  test('no lanza error si SendGrid falla', async () => {
    sgMail.send.mockRejectedValueOnce(new Error('SendGrid down'));
    await expect(
      emailService.sendAlertEmail('warning', TRIGGERS, 'normal')
    ).resolves.not.toThrow();
    expect(sgMail.send).toHaveBeenCalledTimes(1);
  });

  test('omite envío si SENDGRID_API_KEY no está configurado', async () => {
    delete process.env.SENDGRID_API_KEY;
    await emailService.sendAlertEmail('warning', TRIGGERS, 'normal');
    expect(sgMail.send).not.toHaveBeenCalled();
  });

  test('omite envío si ALERT_EMAIL_TO no está configurado', async () => {
    delete process.env.ALERT_EMAIL_TO;
    await emailService.sendAlertEmail('warning', TRIGGERS, 'normal');
    expect(sgMail.send).not.toHaveBeenCalled();
  });
});

// ─── buildEmailHtml ───────────────────────────────────────────────────────────

describe('buildEmailHtml()', () => {
  test('incluye nivel actual y nivel anterior', () => {
    const html = emailService.buildEmailHtml('warning', TRIGGERS, 'normal');
    expect(html).toContain('Aviso');
    expect(html).toContain('Normal');
  });

  test('incluye datos de los detonadores', () => {
    const html = emailService.buildEmailHtml('warning', TRIGGERS, 'normal');
    expect(html).toContain('Santiago');
    expect(html).toContain('75 km/h');
  });

  test('incluye enlace al dashboard', () => {
    const html = emailService.buildEmailHtml('emergency', TRIGGERS, 'watch');
    expect(html).toContain('frontend-two-gilt-77.vercel.app');
  });

  test('maneja lista de detonadores vacía sin romper', () => {
    const html = emailService.buildEmailHtml('warning', [], 'normal');
    expect(html).toContain('Sin detonadores detallados disponibles');
  });

  test('usa color rojo para emergency y ámbar para warning', () => {
    const htmlEmergency = emailService.buildEmailHtml('emergency', [], 'normal');
    const htmlWarning   = emailService.buildEmailHtml('warning',   [], 'normal');
    expect(htmlEmergency).toContain('#dc2626');
    expect(htmlWarning).toContain('#d97706');
  });
});
