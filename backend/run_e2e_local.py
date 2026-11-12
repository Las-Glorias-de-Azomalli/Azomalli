"""
Servidor Flask para pruebas E2E locales.
Usa SQLite en memoria y datos seed para funcionar sin PostgreSQL.
"""
import os, sys

# Configurar SQLite antes de importar cualquier cosa de la app
os.environ.setdefault("SECRET_KEY", "e2e-local-secret-key-for-testing-min32bytes!")
os.environ.setdefault("JWT_SECRET_KEY", "e2e-local-jwt-secret-key-testing-min32bytes!")
# Forzar DATABASE_URL a SQLite (overwrite)
os.environ["DATABASE_URL"] = "sqlite:///e2e_local.db"
os.environ.pop("DATABASE_URL_POOLED", None)

from sqlalchemy.pool import StaticPool
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import JSONB, ENUM as PgENUM

# Permitir que SQLite compile tipos de PostgreSQL
@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(type_, compiler, **kw):
    return "JSON"

@compiles(PgENUM, "sqlite")
def compile_pgenum_sqlite(type_, compiler, **kw):
    return "VARCHAR"

from app import create_app
from app.database import db
from app.models.token_recuperacion import TokenRecuperacion

config_override = {
    "TESTING": False,
    "SECRET_KEY": os.environ["SECRET_KEY"],
    "JWT_SECRET_KEY": os.environ["JWT_SECRET_KEY"],
    "SQLALCHEMY_DATABASE_URI": "sqlite:///e2e_local.db",
    "SQLALCHEMY_ENGINE_OPTIONS": {
        "connect_args": {"check_same_thread": False},
        "poolclass": StaticPool,
    },
}

# Parchear server_default para token expiración (SQLite)
TokenRecuperacion.__table__.c.fecha_expiracion.server_default = db.text(
    "(datetime('now', '+15 minutes'))"
)

app = create_app(config_override)

with app.app_context():
    db.create_all()
    # Seed de datos de prueba (reutilizamos la lógica inline)
    import datetime as dt
    from app.models.producto import Producto
    from app.models.persona import Persona
    from app.models.cuenta import Cuenta
    from app.models.enums import CategoriaProducto, RolDeUsuario

    if Producto.query.count() == 0:
        from seed import INITIAL_PRODUCTS
        for item in INITIAL_PRODUCTS:
            db.session.add(Producto(**item))
        db.session.commit()
        print("[seed] Productos creados.")

    if not Cuenta.query.filter_by(email="ana@example.com").first():
        persona = Persona(nombre="Ana", primer_apellido="García", fecha_registro=dt.date.today())
        db.session.add(persona)
        db.session.flush()
        cuenta = Cuenta(email="ana@example.com", telefono="9211234567",
                        rol=RolDeUsuario.CLIENTE, persona_id=persona.persona_id)
        cuenta.set_password("Panaderia123!")
        db.session.add(cuenta)
        db.session.commit()
        print("[seed] Cuenta demo ana@example.com creada.")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"[E2E-local] Flask corriendo en http://127.0.0.1:{port}")
    app.run(host="127.0.0.1", port=port, debug=False)
