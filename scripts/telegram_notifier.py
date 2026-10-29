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
    date    = (report.get("generatedAt") or "")[:10]
    summary = (report.get("summary") or "Sin detalles")[:3000]

    return (
        f"📊 *REPORTE DIARIO — TIEMPO EN RD*\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"*Fecha:* {date}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"{summary}\n"
        f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        f"_Fuente: WeatherAPI / ONAMET_"
    )


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
