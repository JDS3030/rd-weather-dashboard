import os
from dotenv import load_dotenv

load_dotenv()

# Backend Node.js
BACKEND_URL = os.getenv('BACKEND_URL', 'http://localhost:3001/api')

# Credenciales Twilio
TWILIO_ACCOUNT_SID   = os.getenv('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN    = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_FROM = os.getenv('TWILIO_WHATSAPP_FROM', 'whatsapp:+14155238886')

# Contactos de emergencia
_raw = os.getenv('EMERGENCY_CONTACTS', '')
EMERGENCY_CONTACTS = [c.strip() for c in _raw.split(',') if c.strip()]

# Horarios
DAILY_REPORT_HOUR                  = int(os.getenv('DAILY_REPORT_HOUR', '7'))
EMERGENCY_CHECK_INTERVAL_MINUTES   = int(os.getenv('EMERGENCY_CHECK_INTERVAL_MINUTES', '5'))
EMERGENCY_REPORT_INTERVAL_HOURS    = int(os.getenv('EMERGENCY_REPORT_INTERVAL_HOURS', '1'))
