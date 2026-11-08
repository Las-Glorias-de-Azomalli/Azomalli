import os
import pytest
from app import create_app
from app.database import db


@pytest.fixture(scope="session")
def app():
    """Crea una instancia de la aplicación Flask para pruebas."""
    db_uri = os.getenv("DATABASE_URL", "sqlite:///:memory:")
    test_config = {
        "TESTING": True,
        "SECRET_KEY": "test-super-secret-key",
        "JWT_SECRET_KEY": "test-jwt-secret-key",
        "SQLALCHEMY_DATABASE_URI": db_uri,
    }

    app = create_app(test_config)

    with app.app_context():
        yield app


@pytest.fixture(scope="session")
def client(app):
    """Cliente HTTP de prueba para consultar endpoints de Flask."""
    return app.test_client()


@pytest.fixture(scope="function")
def db_session(app):
    """Provee una sesión de base de datos aislada con rollback al finalizar cada test."""
    with app.app_context():
        # Ejecutar el test
        yield db.session
        # Limpieza: rollback de cualquier transacción pendiente
        db.session.rollback()
