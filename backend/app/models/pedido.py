"""Modelo ORM — Pedido."""

from sqlalchemy.dialects.postgresql import ENUM as PgENUM

from app.database import db
from app.models.enums import EstadoPedido, MetodoDePago


class Pedido(db.Model):
    """Pedido realizado por un cliente."""

    __tablename__ = "Pedido"

    pedido_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    cuenta_id = db.Column(
        db.Integer,
        db.ForeignKey("Cuenta.cuenta_id"),
        nullable=False,
    )
    fecha_pedido = db.Column(db.Date, nullable=False)
    fecha_entrega = db.Column(db.Date, nullable=False)
    lugar_entrega = db.Column(db.String(500), nullable=False)
    estado = db.Column(
        PgENUM(EstadoPedido, name="estado_pedido", create_type=False),
        nullable=False,
        server_default="PENDIENTE",
    )
    pago = db.Column(
        PgENUM(MetodoDePago, name="metodo_de_pago", create_type=False),
        nullable=False,
    )
    monto_total = db.Column(db.Numeric(12, 2), nullable=False)

    # Relaciones
    cuenta = db.relationship("Cuenta", back_populates="pedidos")
    detalles = db.relationship("DetallePedido", back_populates="pedido", cascade="all, delete-orphan")

    def to_dict(self):
        """Serializa el pedido y sus líneas de detalle a JSON."""
        cliente_nombre = None
        cliente_email = None
        if self.cuenta:
            cliente_email = self.cuenta.email
            if self.cuenta.persona:
                cliente_nombre = f"{self.cuenta.persona.nombre} {self.cuenta.persona.primer_apellido or ''}".strip()
            if not cliente_nombre:
                cliente_nombre = self.cuenta.email

        total_piezas = sum(d.cantidad for d in self.detalles) if self.detalles else 0

        return {
            "pedido_id": self.pedido_id,
            "codigo_pedido": f"AG-{self.pedido_id:04d}",
            "cuenta_id": self.cuenta_id,
            "cliente_nombre": cliente_nombre,
            "cliente_email": cliente_email,
            "fecha_pedido": self.fecha_pedido.isoformat() if self.fecha_pedido else None,
            "fecha_entrega": self.fecha_entrega.isoformat() if self.fecha_entrega else None,
            "lugar_entrega": self.lugar_entrega,
            "estado": self.estado.value if hasattr(self.estado, "value") else str(self.estado),
            "pago": self.pago.value if hasattr(self.pago, "value") else str(self.pago),
            "monto_total": float(self.monto_total) if self.monto_total is not None else 0.0,
            "total_piezas": total_piezas,
            "detalles": [d.to_dict() for d in self.detalles] if self.detalles else [],
        }

    def __repr__(self):
        return f"<Pedido {self.pedido_id} — {self.estado}>"
