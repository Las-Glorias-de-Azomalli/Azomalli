"""Modelo ORM — Cuenta."""

from sqlalchemy.dialects.postgresql import ENUM as PgENUM

from app.database import db
from app.models.enums import RolDeUsuario


class Cuenta(db.Model):
    """Cuenta de usuario (autenticación y rol)."""

    __tablename__ = "Cuenta"

    cuenta_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), nullable=False, unique=True)
    telefono = db.Column(db.String(10), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    rol = db.Column(
        PgENUM(RolDeUsuario, name="rol_de_usuario", create_type=False),
        nullable=False,
    )
    persona_id = db.Column(
        db.Integer,
        db.ForeignKey("Persona.persona_id"),
        nullable=False,
        unique=True,
    )

    # Relaciones
    persona = db.relationship("Persona", back_populates="cuenta")
    pedidos = db.relationship("Pedido", back_populates="cuenta")
    tokens_recuperacion = db.relationship(
        "TokenRecuperacion", back_populates="cuenta"
    )

    def set_password(self, raw_password: str):
        """Genera el hash Bcrypt de la contraseña."""
        from app import bcrypt
        self.password = bcrypt.generate_password_hash(raw_password).decode('utf-8')

    def check_password(self, raw_password: str) -> bool:
        """Verifica la contraseña ingresada contra el hash almacenado."""
        from app import bcrypt
        return bcrypt.check_password_hash(self.password, raw_password)

    def to_dict(self):
        """Representación en diccionario (omitiendo la contraseña por seguridad)."""
        return {
            "cuenta_id": self.cuenta_id,
            "email": self.email,
            "telefono": self.telefono,
            "rol": self.rol.value if hasattr(self.rol, "value") else str(self.rol),
            "persona_id": self.persona_id
        }

    def __repr__(self):
        return f"<Cuenta {self.cuenta_id}: {self.email}>"
