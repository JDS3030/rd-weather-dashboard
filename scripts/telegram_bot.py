"""
Listener de comandos Telegram (long-polling).
Responde a /daily o "daily" con el reporte meteorológico inmediato.
Solo atiende a los chat IDs configurados en TELEGRAM_CHAT_IDS.
"""
import logging
import requests
import time
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_IDS, BACKEND_URL
from telegram_notifier import send_message, fmt_daily

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("telegram_bot")

_API = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"
_ALLOWED = set(str(c) for c in TELEGRAM_CHAT_IDS)
_DAILY_TRIGGERS = {"daily", "/daily"}


def get_updates(offset=None) -> list:
    try:
        r = requests.get(
            f"{_API}/getUpdates",
            params={"timeout": 30, "offset": offset},
            timeout=35,
        )
        r.raise_for_status()
        return r.json().get("result", [])
    except Exception as exc:
        logger.error(f"Error polling updates: {exc}")
        time.sleep(5)
        return []


def handle_message(chat_id: str, text: str) -> None:
    if str(chat_id) not in _ALLOWED:
        logger.warning(f"Mensaje ignorado de chat no autorizado: {chat_id}")
        return

    if text.strip().lower() not in _DAILY_TRIGGERS:
        return

    logger.info(f"Comando Daily recibido de {chat_id} — generando reporte...")
    try:
        r = requests.post(
            f"{BACKEND_URL}/reports/generate",
            params={"type": "daily"},
            timeout=30,
        )
        r.raise_for_status()
        report = r.json().get("data", {})
        send_message(str(chat_id), fmt_daily(report))
        logger.info("✅ Reporte diario enviado por comando.")
    except Exception as exc:
        logger.error(f"Error generando reporte: {exc}")
        send_message(str(chat_id), "❌ Error al generar el reporte. Intenta de nuevo en un momento.")


def start() -> None:
    if not TELEGRAM_BOT_TOKEN:
        raise EnvironmentError("TELEGRAM_BOT_TOKEN no configurado en .env")

    logger.info("🤖 Bot Telegram iniciado. Escucha: /daily | daily")
    offset = None

    while True:
        updates = get_updates(offset)
        for update in updates:
            offset = update["update_id"] + 1
            msg = update.get("message", {})
            chat_id = msg.get("chat", {}).get("id")
            text = msg.get("text", "")
            if chat_id and text:
                handle_message(str(chat_id), text)


if __name__ == "__main__":
    start()
