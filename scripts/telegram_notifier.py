"""
Módulo de notificaciones vía Telegram Bot API.
Maneja el envío de alertas de emergencia y reportes diarios.
"""
import logging
import requests
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_IDS

logger = logging.getLogger(__name__)

_API_URL = "https://api.telegram.org/bot{token}/sendMessage"


def send_message(chat_id: str, text: str) -> dict:
    """Enviar un mensaje a un chat de Telegram."""
    if not TELEGRAM_BOT_TOKEN:
        raise EnvironmentError("TELEGRAM_BOT_TOKEN no configurado en .env")
    try:
        r = requests.post(
            _API_URL.format(token=TELEGRAM_BOT_TOKEN),
            json={"chat_id": chat_id, "text": text, "parse_mode": "Markdown"},
            timeout=10,
        )
        r.raise_for_status()
        msg_id = r.json().get("result", {}).get("message_id")
        logger.info(f"✅ Mensaje enviado a {chat_id} | message_id: {msg_id}")
        return {"success": True, "message_id": msg_id, "chat_id": chat_id}
    except Exception as exc:
        logger.error(f"❌ Error enviando a {chat_id}: {exc}")
        return {"success": False, "error": str(exc), "chat_id": chat_id}


def broadcast(message: str) -> list:
    """Enviar el mismo mensaje a todos los chat IDs configurados."""
    if not TELEGRAM_CHAT_IDS:
        logger.warning("No hay TELEGRAM_CHAT_IDS configurados.")
        return []
    results = [send_message(chat_id, message) for chat_id in TELEGRAM_CHAT_IDS]
    ok = sum(1 for r in results if r["success"])
    logger.info(f"Broadcast: {ok}/{len(results)} mensajes enviados")
    return results


# ─── Helpers para fmt_daily (Opción D — Semáforo) ────────────────────────────

_LEVEL_EMOJI = {
    'normal':    '🟢',
    'watch':     '🟡',
    'warning':   '🟠',
    'emergency': '🔴',
}

_LEVEL_LABEL = {
    'normal':    'Normal',
    'watch':     'Vigilancia',
    'warning':   'Aviso',
    'emergency': 'Emergencia',
}

_DIAS   = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
_MESES  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']


def _fmt_fecha(iso: str) -> str:
    try:
        from datetime import datetime, timezone
        dt = datetime.fromisoformat(iso.replace('Z', '+00:00')).astimezone(timezone.utc)
        hora = dt.strftime('%I:%M %p').lstrip('0')
        return f"{_DIAS[dt.weekday()]}, {dt.day} {_MESES[dt.month - 1]} {dt.year} | {hora}"
    except Exception:
        return iso[:10]


def _condition_emoji(text: str, precip_mm: float) -> str:
    t = (text or '').lower()
    if 'tormenta' in t or 'thunder' in t:
        return '⛈️'
    if 'lluvia' in t or 'rain' in t or 'drizzle' in t or 'shower' in t or (precip_mm or 0) > 0:
        return '🌧️'
    if 'parcial' in t or 'partly' in t:
        return '⛅'
    if 'nublado' in t or 'cloudy' in t or 'overcast' in t:
        return '☁️'
    if 'despejado' in t or 'clear' in t or 'sunny' in t or 'sol' in t:
        return '☀️'
    return '🌤️'


def _province_level(province: dict, triggers: list) -> str:
    name    = province.get('name', '')
    current = province.get('current') or {}
    wind    = float(current.get('wind_kph') or 0)
    precip  = float(current.get('precip_mm') or 0)
    cond    = (current.get('condition') or {}).get('text', '').lower()

    for t in (triggers or []):
        if t.get('province') == name and 'Wind' in (t.get('source') or ''):
            w = float(t.get('windKph') or 0)
            if w >= 119:
                return 'emergency'
            if w >= 63:
                return 'warning'

    if wind >= 119:
        return 'emergency'
    if wind >= 63:
        return 'warning'
    if precip > 0 or any(k in cond for k in ('lluvia', 'rain', 'shower', 'drizzle', 'tormenta', 'thunder')):
        return 'watch'
    return 'normal'


# ─── Formateadores de mensaje ─────────────────────────────────────────────────

def fmt_emergency(report: dict) -> str:
    level   = report.get("alertLevel", "DESCONOCIDO").upper()
    ts      = report.get("generatedAt", "")[:19].replace("T", " ")
    summary = (report.get("summary") or "Sin detalles")[:3000]

    return (
        f"🚨 *ALERTA METEOROLÓGICA — REPÚBLICA DOMINICANA*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"*Nivel:* {level}\n"
        f"*Hora del reporte:* {ts}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"{summary}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"_Fuente: Dashboard Climático RD / ONAMET_\n"
        f"_En caso de emergencia llame al 911_"
    )


def fmt_daily(report: dict) -> str:
    """Opción D — Semáforo Climático por provincia."""
    generated_at    = report.get('generatedAt') or ''
    alert_level     = report.get('alertLevel') or 'normal'
    provinces_data  = report.get('provincesData') or []
    triggers        = report.get('triggers') or []
    onamet_alerts   = report.get('onaMetAlerts') or []

    fecha     = _fmt_fecha(generated_at)
    lvl_emoji = _LEVEL_EMOJI.get(alert_level, '🟢')
    lvl_label = _LEVEL_LABEL.get(alert_level, alert_level.upper())

    header = (
        f"🚦 *NUBEVIGIA RD — SEMÁFORO CLIMÁTICO*\n"
        f"📅 {fecha}\n\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"{lvl_emoji} *ESTADO NACIONAL: {lvl_label.upper()}*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
        f"*SEMÁFORO POR PROVINCIA*\n"
    )

    if not provinces_data:
        summary = (report.get('summary') or 'Sin detalles')[:2000]
        return header + summary

    counts = {'normal': 0, 'watch': 0, 'warning': 0, 'emergency': 0}
    lines  = []

    for p in provinces_data:
        current   = p.get('current') or {}
        name      = p.get('name', '?')
        temp      = current.get('temp_c')
        precip    = float(current.get('precip_mm') or 0)
        cond_text = (current.get('condition') or {}).get('text', '')

        level = _province_level(p, triggers)
        counts[level] = counts.get(level, 0) + 1

        temp_str   = f"{temp:.0f}°C" if temp is not None else 'N/D'
        icon       = _condition_emoji(cond_text, precip)
        cond_short = cond_text[:20] if cond_text else 'N/D'

        lines.append(f"{_LEVEL_EMOJI[level]} *{name}* — {temp_str} {icon}\n   _{cond_short}_")

    provinces_block = '\n\n'.join(lines)

    resumen = (
        f"\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🟢 Normal: *{counts['normal']}*   "
        f"🟡 Vigilancia: *{counts['watch']}*\n"
        f"🟠 Aviso: *{counts['warning']}*     "
        f"🔴 Emergencia: *{counts['emergency']}*"
    )

    return header + provinces_block + resumen


def fmt_all_clear(timestamp: str) -> str:
    return (
        f"✅ *SITUACIÓN NORMALIZADA — REPÚBLICA DOMINICANA*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"La emergencia meteorológica ha sido levantada.\n"
        f"Estado actual: *NORMAL*\n"
        f"Hora: {timestamp}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"_Continúe atento a los boletines de ONAMET_"
    )
