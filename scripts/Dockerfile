# Scripts de notificación (Python) — monitor de emergencia y reporte diario
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# El comando concreto (emergency_monitor.py / daily_report.py) lo define
# docker-compose por servicio.
CMD ["python", "emergency_monitor.py"]
