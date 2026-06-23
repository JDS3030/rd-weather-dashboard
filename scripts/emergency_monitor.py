"""
Monitor de emergencias meteorológicas.
Chequea el estado cada N minutos y envía reportes por WhatsApp:
  - Al activarse la emergencia: alerta inmediata.
  - Durante la emergencia: reporte cada 1 hora.
  - Al normalizarse: aviso de situación levantada.
Ejecutar: python emergency_monitor.py
"""
import logging
import schedule
import time
import requests
from datetime import datetime
from config import (
    BACKEND_URL,
    EMERGENCY_CHECK_INTERVAL_MINUTES,
    EMERGENCY_REPORT_INTERVAL_HOURS,
)
from whatsapp_notifier import broadcast, fmt_emergency, fmt_all_clear

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("emergency_monitor")

# ─── Estado interno del monitor ───────────────────────────────────────────────
_emergency_active        = False
_last_report_sent_at     = None   # datetime o None


def _get_alert_status() -> dict | None:
    try:
        r = requests.get(f"{BACKEND_URL}/alerts/status", timeout=10)
        r.raise_for_status()
        return r.json().get("data", {})
    except Exception as exc:
        logger.error(f"No se pudo consultar el estado de alerta: {exc}")
        return None


def _generate_emergency_report() -> dict | None:
    try:
        r = requests.post(
            f"{BACKEND_URL}/reports/generate",
            params={"type": "emergency"},
            timeout=30,
        )
        r.raise_for_status()
        return r.json().get("data", {})
    except Exception as exc:
        logger.error(f"Error generando reporte de emergencia: {exc}")
        return None


def _hours_since_last_report() -> float:
    if _last_report_sent_at is None:
        return float("inf")
    return (datetime.now() - _last_report_sent_at).total_seconds() / 3600


def monitor_tick():
    global _emergency_active, _last_report_sent_at

    status = _get_alert_status()
    if status is None:
        return

    is_emergency = status.get("isEmergency", False)
    level        = status.get("level", "normal")

    if is_emergency:
        logger.warning(f"🚨 EMERGENCIA ACTIVA — Nivel: {level}")

        if not _emergency_active:
            # Primera vez que se activa — enviar alerta inmediata
            logger.warning("Emergencia recién activada. Enviando notificación inmediata...")
            report = _generate_emergency_report()
            if report:
                broadcast(fmt_emergency(report))
                _last_report_sent_at = datetime.now()

        elif _hours_since_last_report() >= EMERGENCY_REPORT_INTERVAL_HOURS:
            # Ya estaba activa — enviar actualización horaria
            logger.info("Enviando actualización horaria de emergencia...")
            report = _generate_emergency_report()
            if report:
                broadcast(fmt_emergency(report))
                _last_report_sent_at = datetime.now()

        _emergency_active = True

    else:
        if _emergency_active:
            logger.info("✅ Emergencia levantada. Enviando aviso de normalización.")
            broadcast(fmt_all_clear(datetime.now().strftime("%Y-%m-%d %H:%M:%S")))

        _emergency_active    = False
        _last_report_sent_at = None
        logger.info(f"Estado: {level}")


def start():
    schedule.every(EMERGENCY_CHECK_INTERVAL_MINUTES).minutes.do(monitor_tick)
    logger.info(
        f"🛡  Monitor de emergencias iniciado. "
        f"Verificando cada {EMERGENCY_CHECK_INTERVAL_MINUTES} minutos."
    )
    monitor_tick()   # ejecución inmediata al arrancar
    while True:
        schedule.run_pending()
        time.sleep(30)


if __name__ == "__main__":
    start()
