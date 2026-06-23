"""Tests unitarios para emergency_monitor.py"""
import pytest
import responses as resp_mock
from datetime import datetime, timedelta
from freezegun import freeze_time
from unittest.mock import patch, MagicMock


BACKEND_URL = "http://localhost:3001/api"

# ─── _get_alert_status ────────────────────────────────────────────────────────

class TestGetAlertStatus:
    @resp_mock.activate
    def test_retorna_dict_en_respuesta_exitosa(self):
        resp_mock.add(
            resp_mock.GET,
            f"{BACKEND_URL}/alerts/status",
            json={"success": True, "data": {"level": "normal", "isEmergency": False}},
            status=200,
        )
        import importlib, emergency_monitor
        importlib.reload(emergency_monitor)

        result = emergency_monitor._get_alert_status()
        assert result["level"] == "normal"
        assert result["isEmergency"] is False

    @resp_mock.activate
    def test_retorna_none_cuando_backend_no_responde(self):
        resp_mock.add(
            resp_mock.GET,
            f"{BACKEND_URL}/alerts/status",
            body=Exception("Connection refused"),
        )
        import importlib, emergency_monitor
        importlib.reload(emergency_monitor)

        result = emergency_monitor._get_alert_status()
        assert result is None


# ─── _hours_since_last_report ─────────────────────────────────────────────────

class TestHoursSinceLastReport:
    def test_retorna_inf_si_no_hay_reporte_previo(self):
        import importlib, emergency_monitor
        importlib.reload(emergency_monitor)
        emergency_monitor._last_report_sent_at = None

        result = emergency_monitor._hours_since_last_report()
        assert result == float("inf")

    @freeze_time("2026-06-22 15:00:00")
    def test_calcula_horas_correctamente(self):
        import importlib, emergency_monitor
        importlib.reload(emergency_monitor)
        emergency_monitor._last_report_sent_at = datetime(2026, 6, 22, 13, 0, 0)

        result = emergency_monitor._hours_since_last_report()
        assert result == pytest.approx(2.0, abs=0.01)

    @freeze_time("2026-06-22 15:00:00")
    def test_retorna_menos_de_1_si_no_paso_la_hora(self):
        import importlib, emergency_monitor
        importlib.reload(emergency_monitor)
        emergency_monitor._last_report_sent_at = datetime(2026, 6, 22, 14, 30, 0)

        result = emergency_monitor._hours_since_last_report()
        assert result < 1.0


# ─── monitor_tick ─────────────────────────────────────────────────────────────

class TestMonitorTick:
    def _reset_state(self, em):
        em._emergency_active    = False
        em._last_report_sent_at = None

    @resp_mock.activate
    def test_envia_alerta_inmediata_al_activarse_emergencia(self, mocker):
        resp_mock.add(resp_mock.GET, f"{BACKEND_URL}/alerts/status",
            json={"data": {"isEmergency": True, "level": "emergency"}})
        resp_mock.add(resp_mock.POST, f"{BACKEND_URL}/reports/generate",
            json={"data": {"alertLevel": "emergency", "generatedAt": "2026-06-22T15:00:00Z", "summary": "..."}})

        import importlib, emergency_monitor
        importlib.reload(emergency_monitor)
        self._reset_state(emergency_monitor)

        mock_broadcast = mocker.patch("emergency_monitor.broadcast", return_value=[])
        emergency_monitor.monitor_tick()

        mock_broadcast.assert_called_once()
        assert emergency_monitor._emergency_active is True

    @resp_mock.activate
    @freeze_time("2026-06-22 16:00:00")
    def test_envia_update_horario_si_paso_1_hora(self, mocker):
        resp_mock.add(resp_mock.GET, f"{BACKEND_URL}/alerts/status",
            json={"data": {"isEmergency": True, "level": "emergency"}})
        resp_mock.add(resp_mock.POST, f"{BACKEND_URL}/reports/generate",
            json={"data": {"alertLevel": "emergency", "generatedAt": "2026-06-22T16:00:00Z", "summary": "..."}})

        import importlib, emergency_monitor
        importlib.reload(emergency_monitor)
        emergency_monitor._emergency_active    = True
        emergency_monitor._last_report_sent_at = datetime(2026, 6, 22, 14, 55, 0)  # > 1 hora antes

        mock_broadcast = mocker.patch("emergency_monitor.broadcast", return_value=[])
        emergency_monitor.monitor_tick()

        mock_broadcast.assert_called_once()

    @resp_mock.activate
    @freeze_time("2026-06-22 15:30:00")
    def test_no_envia_update_si_no_paso_1_hora(self, mocker):
        resp_mock.add(resp_mock.GET, f"{BACKEND_URL}/alerts/status",
            json={"data": {"isEmergency": True, "level": "emergency"}})

        import importlib, emergency_monitor
        importlib.reload(emergency_monitor)
        emergency_monitor._emergency_active    = True
        emergency_monitor._last_report_sent_at = datetime(2026, 6, 22, 15, 0, 0)  # hace 30 min

        mock_broadcast = mocker.patch("emergency_monitor.broadcast", return_value=[])
        emergency_monitor.monitor_tick()

        mock_broadcast.assert_not_called()

    @resp_mock.activate
    def test_envia_all_clear_cuando_emergencia_se_levanta(self, mocker):
        resp_mock.add(resp_mock.GET, f"{BACKEND_URL}/alerts/status",
            json={"data": {"isEmergency": False, "level": "normal"}})

        import importlib, emergency_monitor
        importlib.reload(emergency_monitor)
        emergency_monitor._emergency_active    = True   # estaba activa
        emergency_monitor._last_report_sent_at = datetime(2026, 6, 22, 14, 0, 0)

        mock_broadcast = mocker.patch("emergency_monitor.broadcast", return_value=[])
        emergency_monitor.monitor_tick()

        mock_broadcast.assert_called_once()
        call_args = mock_broadcast.call_args[0][0]
        assert "NORMALIZ" in call_args.upper()
        assert emergency_monitor._emergency_active is False
        assert emergency_monitor._last_report_sent_at is None

    @resp_mock.activate
    def test_no_hace_nada_cuando_status_retorna_none(self, mocker):
        resp_mock.add(resp_mock.GET, f"{BACKEND_URL}/alerts/status",
            body=Exception("Connection refused"))

        import importlib, emergency_monitor
        importlib.reload(emergency_monitor)
        self._reset_state(emergency_monitor)

        mock_broadcast = mocker.patch("emergency_monitor.broadcast", return_value=[])
        emergency_monitor.monitor_tick()

        mock_broadcast.assert_not_called()
        assert emergency_monitor._emergency_active is False
