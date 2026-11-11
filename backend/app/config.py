import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


def _build_database_uri() -> str:
    """Construye la URI de conexión a la base de datos.

    Neon provee URLs con el scheme ``postgresql://``, pero SQLAlchemy
    necesita ``postgresql+psycopg://`` para usar el adaptador psycopg 3.
    Esta función realiza la conversión automáticamente y da soporte
    tanto a DATABASE_URL como a DATABASE_URL_POOLED (priorizando pooled
    para la app si está disponible).
    """
    url = os.getenv("DATABASE_URL_POOLED") or os.getenv("DATABASE_URL", "")
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    return url


class Config:
    """Configuración central"""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

    SQLALCHEMY_DATABASE_URI = _build_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Neon requiere SSL; parámetro sslmode=require en URL,
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_recycle": 300,    
        "pool_pre_ping": True,   
    }

    # Configuración de JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", os.getenv("SECRET_KEY", "jwt-dev-secret-key"))
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)