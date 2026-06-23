"""Tests unitarios para whatsapp_notifier.py"""
import pytest
from unittest.mock import MagicMock, patch


# ─── send_whatsapp ────────────────────────────────────────────────────────────

class TestSendWhatsapp:
    def test_envia_mensaje_correctamente(self, mocker):
        mock_client = MagicMock()
        mock_client.messages.create.return_value = MagicMock(sid="SM123456")
        mocker.patch("whatsapp_notifier.get_client", return_value=mock_client)

        from whatsapp_notifier import send_whatsapp
        result = send_whatsapp("whatsapp:+1809123456", "Mensaje de prueba")

        mock_client.messages.create.assert_called_once_with(
            body="Mensaje de prueba",
            from_=mocker.ANY,
            to="whatsapp:+1809123456",
        )
        assert result["success"] is True
        assert result["sid"] == "SM123456"

    def test_retorna_success_false_cuando_twilio_falla(self, mocker):
        mock_client = MagicMock()
        mock_client.messages.create.side_effect = Exception("Twilio API error")
        mocker.patch("whatsapp_notifier.get_client", return_value=mock_client)

        from whatsapp_notifier import send_whatsapp
        result = send_whatsapp("whatsapp:+1809123456", "Mensaje")

        assert result["success"] is False
        assert "error" in result

    def test_lanza_error_si_faltan_credenciales(self, mocker):
        mocker.patch("whatsapp_notifier.TWILIO_ACCOUNT_SID", None)
        mocker.patch("whatsapp_notifier.TWILIO_AUTH_TOKEN", None)

        from whatsapp_notifier import get_client
        with pytest.raises(EnvironmentError, match="Credenciales Twilio"):
            get_client()


# ─── broadcast ────────────────────────────────────────────────────────────────

class TestBroadcast:
    def test_envia_a_todos_los_contactos(self, mocker):
        contacts = ["whatsapp:+18091111111", "whatsapp:+18092222222"]
        mocker.patch("whatsapp_notifier.EMERGENCY_CONTACTS", contacts)
        mock_send = mocker.patch(
            "whatsapp_notifier.send_whatsapp",
            return_value={"success": True, "sid": "SMxxx"}
        )

        from whatsapp_notifier import broadcast
        results = broadcast("Alerta de prueba")

        assert mock_send.call_count == 2
        assert len(results) == 2
        assert all(r["success"] for r in results)

    def test_retorna_lista_vacia_sin_contactos(self, mocker):
        mocker.patch("whatsapp_notifier.EMERGENCY_CONTACTS", [])

        from whatsapp_notifier import broadcast
        results = broadcast("Mensaje sin contactos")

        assert results == []


# ─── fmt_emergency ────────────────────────────────────────────────────────────

class TestFmtEmergency:
    def test_incluye_nivel_de_alerta(self):
        from whatsapp_notifier import fmt_emergency
        report = {"alertLevel": "emergency", "generatedAt": "2026-06-22T14:00:00Z", "summary": "Resumen"}
        msg = fmt_emergency(report)
        assert "EMERGENCY" in msg.upper()

    def test_incluye_timestamp(self):
        from whatsapp_notifier import fmt_emergency
        report = {"alertLevel": "emergency", "generatedAt": "2026-06-22T14:00:00Z", "summary": "Resumen"}
        msg = fmt_emergency(report)
        assert "2026-06-22" in msg

    def test_trunca_summary_a_1400_caracteres(self):
        from whatsapp_notifier import fmt_emergency
        long_summary = "X" * 2000
        report = {"alertLevel": "emergency", "generatedAt": "2026-06-22T14:00:00Z", "summary": long_summary}
        msg = fmt_emergency(report)
        # El summary dentro del mensaje no debe superar 1400 chars
        assert msg.count("X") <= 1400

    def test_maneja_reporte_sin_summary(self):
        from whatsapp_notifier import fmt_emergency
        report = {"alertLevel": "emergency", "generatedAt": "2026-06-22T14:00:00Z"}
        msg = fmt_emergency(report)
        assert "Sin detalles" in msg


# ─── fmt_daily ────────────────────────────────────────────────────────────────

class TestFmtDaily:
    def test_incluye_fecha_del_reporte(self):
        from whatsapp_notifier import fmt_daily
        report = {"generatedAt": "2026-06-22T07:00:00Z", "summary": "Resumen del día"}
        msg = fmt_daily(report)
        assert "2026-06-22" in msg

    def test_incluye_el_summary(self):
        from whatsapp_notifier import fmt_daily
        report = {"generatedAt": "2026-06-22T07:00:00Z", "summary": "Temperatura: 28°C"}
        msg = fmt_daily(report)
        assert "Temperatura: 28°C" in msg


# ─── fmt_all_clear ────────────────────────────────────────────────────────────

class TestFmtAllClear:
    def test_contiene_el_timestamp(self):
        from whatsapp_notifier import fmt_all_clear
        msg = fmt_all_clear("2026-06-22 15:00:00")
        assert "2026-06-22 15:00:00" in msg

    def test_indica_situacion_normalizada(self):
        from whatsapp_notifier import fmt_all_clear
        msg = fmt_all_clear("2026-06-22 15:00:00")
        assert "NORMALIZ" in msg.upper()
