import os
import pytest
from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB, ENUM as PgENUM
from app import create_app
from app.database import db

# Permitir a SQLite compilar los tipos nativos de PostgreSQL (JSONB y ENUM) para pruebas locales
@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"

@compiles(PgENUM, "sqlite")
def compile_pgenum_sqlite(type_, compiler, **kw):
    return "VARCHAR"


@pytest.fixture(scope="session")
def app():
    """Crea una instancia de la aplicación Flask para pruebas."""
    # Priorizar TEST_DATABASE_URL si se define; si no, usar sqlite en memoria para pruebas rápidas
    db_uri = os.getenv("TEST_DATABASE_URL") or "sqlite:///:memory:"
    test_config = {
        "TESTING": True,
        "SECRET_KEY": "test-super-secret-key-32bytes-secure!",
        "JWT_SECRET_KEY": "test-jwt-secret-key-super-secure-32bytes-min!",
        "SQLALCHEMY_DATABASE_URI": db_uri,
    }

    if db_uri.startswith("sqlite"):
        test_config["SQLALCHEMY_ENGINE_OPTIONS"] = {
            "connect_args": {"check_same_thread": False},
            "poolclass": StaticPool
        }
        from app.models.token_recuperacion import TokenRecuperacion
        TokenRecuperacion.__table__.c.fecha_expiracion.server_default = db.text("(datetime('now', '+15 minutes'))")

    app = create_app(test_config)

    with app.app_context():
        if db_uri.startswith("sqlite"):
            db.create_all()
        yield app
        if db_uri.startswith("sqlite"):
            db.drop_all()


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
