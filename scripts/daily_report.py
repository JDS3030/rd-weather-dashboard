"""
Servicio de reporte diario.
Genera y envía el resumen meteorológico de la RD cada mañana via WhatsApp.
Ejecutar: python daily_report.py
"""
import logging
import schedule
import time
import requests
from config import BACKEND_URL, DAILY_REPORT_HOUR
from whatsapp_notifier import broadcast, fmt_daily

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("daily_report")


def run_daily_report():
    logger.info("▶ Generando reporte diario...")
    try:
        r = requests.post(
            f"{BACKEND_URL}/reports/generate",
            params={"type": "daily"},
            timeout=30,
        )
        r.raise_for_status()
        report = r.json().get("data", {})
        message = fmt_daily(report)
        results = broadcast(message)
        ok = sum(1 for x in results if x.get("success"))
        logger.info(f"✅ Reporte diario enviado a {ok}/{len(results)} contactos.")
        return report
    except requests.RequestException as exc:
        logger.error(f"Error contactando backend: {exc}")
    except Exception as exc:
        logger.error(f"Error inesperado: {exc}")


def start():
    schedule.every().day.at(f"{DAILY_REPORT_HOUR:02d}:00").do(run_daily_report)
    logger.info(f"📅 Reporte diario programado para las {DAILY_REPORT_HOUR:02d}:00 cada día.")

    # Ejecutar una vez al iniciar (útil para prueba)
    run_daily_report()

    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    start()
