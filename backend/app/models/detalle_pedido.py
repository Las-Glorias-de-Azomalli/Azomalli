"""Modelo ORM — DetallePedido."""

from sqlalchemy.dialects.postgresql import JSONB

from app.database import db


class DetallePedido(db.Model):
    """Línea individual dentro de un pedido."""

    __tablename__ = "DetallePedido"

    detalle_pedido_id = db.Column(
        db.Integer, primary_key=True, autoincrement=True
    )
    cantidad = db.Column(db.Integer, nullable=False)
    precio_unitario = db.Column(db.Numeric(12, 2), nullable=False)
    Pedido_pedido_id = db.Column(
        db.Integer,
        db.ForeignKey("Pedido.pedido_id"),
        nullable=False,
    )
    Producto_producto_id = db.Column(
        db.Integer,
        db.ForeignKey("Producto.producto_id"),
        nullable=False,
    )
    sabor = db.Column(JSONB, nullable=True)
    topping = db.Column(JSONB, nullable=True)
    relleno = db.Column(JSONB, nullable=True)
    notas = db.Column(db.String(1000), nullable=True)

    # Relaciones
    pedido = db.relationship("Pedido", back_populates="detalles")
    producto = db.relationship("Producto", back_populates="detalles")

    def to_dict(self):
        """Serializa el detalle de pedido a un diccionario JSON."""
        cat_str = None
        if self.producto and self.producto.categoria:
            cat_str = self.producto.categoria.value if hasattr(self.producto.categoria, "value") else str(self.producto.categoria)

        return {
            "detalle_pedido_id": self.detalle_pedido_id,
            "pedido_id": self.Pedido_pedido_id,
            "producto_id": self.Producto_producto_id,
            "producto_nombre": self.producto.nombre if self.producto else None,
            "producto_imagen_url": self.producto.imagen_url if self.producto else None,
            "producto_categoria": cat_str,
            "producto_es_personalizable": self.producto.es_personalizable if self.producto else False,
            "producto_precio_base": float(self.producto.precio_unitario) if self.producto and self.producto.precio_unitario is not None else float(self.precio_unitario),
            "cantidad": self.cantidad,
            "precio_unitario": float(self.precio_unitario) if self.precio_unitario is not None else 0.0,
            "subtotal": round(self.cantidad * (float(self.precio_unitario) if self.precio_unitario is not None else 0.0), 2),
            "sabor": self.sabor,
            "topping": self.topping,
            "relleno": self.relleno,
            "notas": self.notas,
        }

    def __repr__(self):
        return (
            f"<DetallePedido {self.detalle_pedido_id} — "
            f"Pedido {self.Pedido_pedido_id}>"
        )
