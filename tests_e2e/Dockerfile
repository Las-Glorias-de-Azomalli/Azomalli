FROM mcr.microsoft.com/playwright/python:v1.44.0-jammy

WORKDIR /app

# Instalar dependencias de Python (pytest, playwright, pytest-playwright)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar archivos de prueba y configuración
COPY . .

# Ejecución por defecto con pytest en modo verbose y con colores
CMD ["pytest", "-v", "--color=yes"]
