"""Tests unitarios para telegram_notifier.py"""
import pytest
from unittest.mock import MagicMock, patch


# ─── send_message ─────────────────────────────────────────────────────────────

class TestSendMessage:
    def test_envia_mensaje_correctamente(self, mocker):
        mock_response = MagicMock()
        mock_response.json.return_value = {"result": {"message_id": 42}}
        mocker.patch("telegram_notifier.requests.post", return_value=mock_response)
        mocker.patch("telegram_notifier.TELEGRAM_BOT_TOKEN", "test_token")

        from telegram_notifier import send_message
        result = send_message("123456789", "Mensaje de prueba")

        assert result["success"] is True
        assert result["message_id"] == 42
        assert result["chat_id"] == "123456789"

    def test_retorna_success_false_cuando_api_falla(self, mocker):
        mock_response = MagicMock()
        mock_response.raise_for_status.side_effect = Exception("HTTP 429")
        mocker.patch("telegram_notifier.requests.post", return_value=mock_response)
        mocker.patch("telegram_notifier.TELEGRAM_BOT_TOKEN", "test_token")

        from telegram_notifier import send_message
        result = send_message("123456789", "Mensaje")

        assert result["success"] is False
        assert "error" in result

    def test_retorna_success_false_cuando_requests_falla(self, mocker):
        mocker.patch("telegram_notifier.requests.post", side_effect=Exception("Connection error"))
        mocker.patch("telegram_notifier.TELEGRAM_BOT_TOKEN", "test_token")

        from telegram_notifier import send_message
        result = send_message("123456789", "Mensaje")

        assert result["success"] is False

    def test_lanza_error_si_falta_token(self, mocker):
        mocker.patch("telegram_notifier.TELEGRAM_BOT_TOKEN", None)

        from telegram_notifier import send_message
        with pytest.raises(EnvironmentError, match="TELEGRAM_BOT_TOKEN"):
            send_message("123456789", "Mensaje")

    def test_llama_api_con_parse_mode_markdown(self, mocker):
        mock_response = MagicMock()
        mock_response.json.return_value = {"result": {"message_id": 1}}
        mock_post = mocker.patch("telegram_notifier.requests.post", return_value=mock_response)
        mocker.patch("telegram_notifier.TELEGRAM_BOT_TOKEN", "tok")

        from telegram_notifier import send_message
        send_message("999", "Hola")

        call_kwargs = mock_post.call_args[1]
        assert call_kwargs["json"]["parse_mode"] == "Markdown"
        assert call_kwargs["json"]["chat_id"] == "999"


# ─── broadcast ────────────────────────────────────────────────────────────────

class TestBroadcast:
    def test_envia_a_todos_los_chat_ids(self, mocker):
        chats = ["111", "222", "333"]
        mocker.patch("telegram_notifier.TELEGRAM_CHAT_IDS", chats)
        mock_send = mocker.patch(
            "telegram_notifier.send_message",
            return_value={"success": True, "message_id": 1}
        )

        from telegram_notifier import broadcast
        results = broadcast("Alerta de prueba")

        assert mock_send.call_count == 3
        assert len(results) == 3
        assert all(r["success"] for r in results)

    def test_retorna_lista_vacia_sin_chat_ids(self, mocker):
        mocker.patch("telegram_notifier.TELEGRAM_CHAT_IDS", [])

        from telegram_notifier import broadcast
        results = broadcast("Mensaje sin destinos")

        assert results == []


# ─── fmt_emergency ────────────────────────────────────────────────────────────

class TestFmtEmergency:
    def test_incluye_nivel_de_alerta(self):
        from telegram_notifier import fmt_emergency
        report = {"alertLevel": "emergency", "generatedAt": "2026-06-22T14:00:00Z", "summary": "Resumen"}
        msg = fmt_emergency(report)
        assert "EMERGENCY" in msg.upper()

    def test_incluye_timestamp(self):
        from telegram_notifier import fmt_emergency
        report = {"alertLevel": "emergency", "generatedAt": "2026-06-22T14:00:00Z", "summary": "Resumen"}
        msg = fmt_emergency(report)
        assert "2026-06-22" in msg

    def test_trunca_summary_a_3000_caracteres(self):
        from telegram_notifier import fmt_emergency
        report = {"alertLevel": "emergency", "generatedAt": "2026-06-22T14:00:00Z", "summary": "X" * 4000}
        msg = fmt_emergency(report)
        assert msg.count("X") <= 3000

    def test_maneja_reporte_sin_summary(self):
        from telegram_notifier import fmt_emergency
        report = {"alertLevel": "emergency", "generatedAt": "2026-06-22T14:00:00Z"}
        msg = fmt_emergency(report)
        assert "Sin detalles" in msg


# ─── fmt_daily ────────────────────────────────────────────────────────────────

class TestFmtDaily:
    def test_incluye_fecha_del_reporte(self):
        from telegram_notifier import fmt_daily
        report = {"generatedAt": "2026-06-22T07:00:00Z", "summary": "Resumen del día"}
        msg = fmt_daily(report)
        assert "2026-06-22" in msg

    def test_incluye_el_summary(self):
        from telegram_notifier import fmt_daily
        report = {"generatedAt": "2026-06-22T07:00:00Z", "summary": "Temperatura: 28°C"}
        msg = fmt_daily(report)
        assert "Temperatura: 28°C" in msg


# ─── fmt_all_clear ────────────────────────────────────────────────────────────

class TestFmtAllClear:
    def test_contiene_el_timestamp(self):
        from telegram_notifier import fmt_all_clear
        msg = fmt_all_clear("2026-06-22 15:00:00")
        assert "2026-06-22 15:00:00" in msg

    def test_indica_situacion_normalizada(self):
        from telegram_notifier import fmt_all_clear
        msg = fmt_all_clear("2026-06-22 15:00:00")
        assert "NORMALIZ" in msg.upper()
