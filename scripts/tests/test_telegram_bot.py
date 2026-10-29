"""Tests unitarios para telegram_bot.py"""
import pytest
from unittest.mock import MagicMock


ALLOWED_CHAT = "1234567890"
OTHER_CHAT   = "9999999999"


# ─── handle_message ───────────────────────────────────────────────────────────

class TestHandleMessage:
    def _setup(self, mocker, allowed=None):
        mocker.patch("telegram_bot._ALLOWED", {ALLOWED_CHAT})
        mocker.patch("telegram_bot.BACKEND_URL", "http://backend:3001/api")
        if allowed is None:
            allowed = [ALLOWED_CHAT]

    def test_envia_reporte_con_comando_daily(self, mocker):
        self._setup(mocker)
        mock_post = MagicMock()
        mock_post.return_value.json.return_value = {
            "data": {"generatedAt": "2026-10-29T07:00:00Z", "summary": "Soleado"}
        }
        mocker.patch("telegram_bot.requests.post", return_value=mock_post.return_value)
        mock_send = mocker.patch("telegram_bot.send_message")

        from telegram_bot import handle_message
        handle_message(ALLOWED_CHAT, "/daily")

        mock_send.assert_called_once()
        assert ALLOWED_CHAT in mock_send.call_args[0]

    def test_envia_reporte_con_texto_daily_minuscula(self, mocker):
        self._setup(mocker)
        mock_post = MagicMock()
        mock_post.return_value.json.return_value = {
            "data": {"generatedAt": "2026-10-29T07:00:00Z", "summary": "Nublado"}
        }
        mocker.patch("telegram_bot.requests.post", return_value=mock_post.return_value)
        mock_send = mocker.patch("telegram_bot.send_message")

        from telegram_bot import handle_message
        handle_message(ALLOWED_CHAT, "daily")

        mock_send.assert_called_once()

    def test_envia_reporte_con_daily_mayuscula(self, mocker):
        self._setup(mocker)
        mock_post = MagicMock()
        mock_post.return_value.json.return_value = {
            "data": {"generatedAt": "2026-10-29T07:00:00Z", "summary": "Lluvia"}
        }
        mocker.patch("telegram_bot.requests.post", return_value=mock_post.return_value)
        mock_send = mocker.patch("telegram_bot.send_message")

        from telegram_bot import handle_message
        handle_message(ALLOWED_CHAT, "Daily")

        mock_send.assert_called_once()

    def test_ignora_chat_no_autorizado(self, mocker):
        self._setup(mocker)
        mock_send = mocker.patch("telegram_bot.send_message")

        from telegram_bot import handle_message
        handle_message(OTHER_CHAT, "/daily")

        mock_send.assert_not_called()

    def test_ignora_texto_desconocido(self, mocker):
        self._setup(mocker)
        mock_send = mocker.patch("telegram_bot.send_message")
        mocker.patch("telegram_bot.requests.post")

        from telegram_bot import handle_message
        handle_message(ALLOWED_CHAT, "hola como estas")

        mock_send.assert_not_called()

    def test_envia_error_si_backend_falla(self, mocker):
        self._setup(mocker)
        mocker.patch("telegram_bot.requests.post", side_effect=Exception("Backend down"))
        mock_send = mocker.patch("telegram_bot.send_message")

        from telegram_bot import handle_message
        handle_message(ALLOWED_CHAT, "/daily")

        mock_send.assert_called_once()
        msg = mock_send.call_args[0][1]
        assert "❌" in msg


# ─── get_updates ──────────────────────────────────────────────────────────────

class TestGetUpdates:
    def test_retorna_lista_de_updates(self, mocker):
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "result": [{"update_id": 1, "message": {"text": "/daily"}}]
        }
        mocker.patch("telegram_bot.requests.get", return_value=mock_response)

        from telegram_bot import get_updates
        result = get_updates(offset=0)

        assert len(result) == 1
        assert result[0]["update_id"] == 1

    def test_retorna_lista_vacia_si_api_falla(self, mocker):
        mocker.patch("telegram_bot.requests.get", side_effect=Exception("Timeout"))
        mocker.patch("telegram_bot.time.sleep")

        from telegram_bot import get_updates
        result = get_updates()

        assert result == []
