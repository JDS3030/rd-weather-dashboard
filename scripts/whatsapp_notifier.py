"""
Módulo de notificaciones WhatsApp via Twilio.
Maneja el envío de alertas de emergencia y reportes diarios.
"""
import logging
from twilio.rest import Client
from config import (
    TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
    TWILIO_WHATSAPP_FROM, EMERGENCY_CONTACTS,
)

logger = logging.getLogger(__name__)


def get_client() -> Client:
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
        raise EnvironmentError("Credenciales Twilio no configuradas en .env")
    return Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


def send_whatsapp(to: str, body: str) -> dict:
    """Enviar un mensaje WhatsApp a un número específico."""
    try:
        msg = get_client().messages.create(
            body=body,
            from_=TWILIO_WHATSAPP_FROM,
            to=to,
        )
        logger.info(f"✅ Mensaje enviado a {to} | SID: {msg.sid}")
        return {"success": True, "sid": msg.sid, "to": to}
    except Exception as exc:
        logger.error(f"❌ Error enviando a {to}: {exc}")
        return {"success": False, "error": str(exc), "to": to}


def broadcast(message: str) -> list[dict]:
    """Enviar el mismo mensaje a todos los contactos de emergencia."""
    if not EMERGENCY_CONTACTS:
        logger.warning("No hay contactos de emergencia configurados.")
        return []

    results = [send_whatsapp(contact, message) for contact in EMERGENCY_CONTACTS]
    ok      = sum(1 for r in results if r["success"])
    logger.info(f"Broadcast: {ok}/{len(results)} mensajes enviados")
    return results


# ─── Formateadores de mensaje ─────────────────────────────────────────────────

def fmt_emergency(report: dict) -> str:
    level  = report.get("alertLevel", "DESCONOCIDO").upper()
    ts     = report.get("generatedAt", "")[:19].replace("T", " ")
    summary = (report.get("summary") or "Sin detalles")[:1400]

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
    summary = (report.get("summary") or "Sin detalles")[:1400]

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
