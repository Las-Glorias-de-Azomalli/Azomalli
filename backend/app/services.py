"""Servicios de negocio de Azomalli — Consultas a la base de datos."""

import datetime
from flask_jwt_extended import create_access_token
from app.database import db
from app.models.producto import Producto
from app.models.cuenta import Cuenta
from app.models.pedido import Pedido
from app.models.detalle_pedido import DetallePedido
from app.models.enums import CategoriaProducto, RolDeUsuario, EstadoPedido, MetodoDePago


def get_products(filter_type=None, category=None, only_active=True):
    """
    Aplica filtros por estado activo, productos de temporada y categoría ENUM (DULCE/SALADO).
    """
    query = Producto.query

    if only_active:
        query = query.filter_by(activo=True)

    if filter_type == 'seasonal':
        query = query.filter_by(es_temporada=True)

    if category and category.lower() != 'todos':
        cat_clean = category.strip().upper()
        if cat_clean in ('DULCE', 'DULCES'):
            query = query.filter_by(categoria=CategoriaProducto.DULCE)
        elif cat_clean in ('SALADO', 'SALADOS'):
            query = query.filter_by(categoria=CategoriaProducto.SALADO)

    products = query.order_by(Producto.producto_id.asc()).all()
    return [p.to_dict() for p in products]


def get_product_by_id(producto_id):
    """Obtiene un producto por ID"""
    product = Producto.query.filter_by(producto_id=producto_id, activo=True).first()
    return product.to_dict() if product else None

def register_account(email, telefono, raw_password, persona_id, rol=RolDeUsuario.CLIENTE):
    """Crea una nueva cuenta con contraseña cifrada en bcrypt."""
    if Cuenta.query.filter_by(email=email).first():
        raise ValueError("El correo electrónico ya se encuentra registrado.")

    nueva_cuenta = Cuenta(
        email=email,
        telefono=telefono,
        persona_id=persona_id,
        rol=rol
    )
    nueva_cuenta.set_password(raw_password)

    db.session.add(nueva_cuenta)
    db.session.commit()
    return nueva_cuenta.to_dict()


def authenticate_user(email, raw_password):
    """Valida credenciales y retorna el JWT token junto con los datos de la cuenta."""
    cuenta = Cuenta.query.filter_by(email=email).first()

    if not cuenta or not cuenta.check_password(raw_password):
        return None, None

    # Claim adicional para incluir el rol del usuario en el token JWT
    rol_str = cuenta.rol.value if hasattr(cuenta.rol, "value") else str(cuenta.rol)
    additional_claims = {"rol": rol_str}

    access_token = create_access_token(
        identity=str(cuenta.cuenta_id),
        additional_claims=additional_claims
    )

    return access_token, cuenta.to_dict()


def _normalize_jsonb_option(opt, field_name=None):
    """Normaliza un valor seleccionado a formato JSONB adecuado."""
    if opt is None or opt == "":
        return None
    if isinstance(opt, dict):
        return opt
    if isinstance(opt, str):
        key = field_name or "opcion"
        return {key: opt, "opcion": opt}
    return {"opcion": str(opt)}


def create_order(cuenta_id, items, fecha_entrega, lugar_entrega="Panadería · recogida sin costo", pago="EFECTIVO"):
    """
    Crea un nuevo pedido asociado a la cuenta del usuario logeado.
    El flujo solo admite pago en EFECTIVO.
    Valida y almacena las opciones de personalización seleccionadas (JSONB) en DetallePedido.
    """
    cuenta = db.session.get(Cuenta, int(cuenta_id))
    if not cuenta:
        raise ValueError("La cuenta de usuario no existe.")

    # Validar que el pago sea únicamente en EFECTIVO
    pago_str = str(pago).upper() if pago else ""
    if hasattr(pago, "value"):
        pago_str = pago.value.upper()

    if pago_str not in ("EFECTIVO", MetodoDePago.EFECTIVO.value):
        raise ValueError("El flujo de compra solo admite pago en efectivo.")

    if not items or not isinstance(items, list) or len(items) == 0:
        raise ValueError("El pedido debe contener al menos un producto.")

    # Validar fecha de entrega
    if not fecha_entrega:
        raise ValueError("La fecha de entrega es obligatoria.")

    if isinstance(fecha_entrega, str):
        try:
            parsed_fecha_entrega = datetime.date.fromisoformat(fecha_entrega.split("T")[0])
        except (ValueError, TypeError):
            raise ValueError("Formato de fecha de entrega inválido (se esperaba YYYY-MM-DD).")
    elif isinstance(fecha_entrega, datetime.date):
        parsed_fecha_entrega = fecha_entrega
    else:
        raise ValueError("Formato de fecha de entrega no válido.")

    lugar = (lugar_entrega or "Panadería · recogida sin costo").strip()
    if not lugar:
        raise ValueError("El lugar de entrega es obligatorio.")

    # Crear la cabecera del Pedido
    nuevo_pedido = Pedido(
        cuenta_id=cuenta.cuenta_id,
        fecha_pedido=datetime.date.today(),
        fecha_entrega=parsed_fecha_entrega,
        lugar_entrega=lugar,
        estado=EstadoPedido.PENDIENTE,
        pago=MetodoDePago.EFECTIVO,
        monto_total=0.0
    )
    db.session.add(nuevo_pedido)
    db.session.flush()

    total_calculado = 0.0

    for item in items:
        prod_id = item.get("producto_id")
        if not prod_id:
            raise ValueError("Cada elemento del pedido debe incluir un producto_id.")

        producto = Producto.query.filter_by(producto_id=prod_id, activo=True).first()
        if not producto:
            raise ValueError(f"El producto con ID {prod_id} no existe o no está activo.")

        cantidad = int(item.get("cantidad", item.get("quantity", 1)))
        if cantidad < 1:
            raise ValueError("La cantidad de cada producto debe ser mayor a 0.")

        # Tomar precio unitario base o el especificado con adiciones
        precio_unitario = float(item.get("precio_unitario", producto.precio_unitario))

        # Personalizaciones en formato JSONB
        sabor_opt = _normalize_jsonb_option(item.get("sabor"), "sabor")
        topping_opt = _normalize_jsonb_option(item.get("topping"), "topping")
        relleno_opt = _normalize_jsonb_option(item.get("relleno"), "relleno")

        notas_val = item.get("notas")
        if notas_val:
            notas_val = str(notas_val)[:1000]

        detalle = DetallePedido(
            Pedido_pedido_id=nuevo_pedido.pedido_id,
            Producto_producto_id=producto.producto_id,
            cantidad=cantidad,
            precio_unitario=precio_unitario,
            sabor=sabor_opt,
            topping=topping_opt,
            relleno=relleno_opt,
            notas=notas_val
        )
        db.session.add(detalle)
        total_calculado += cantidad * precio_unitario

    nuevo_pedido.monto_total = round(total_calculado, 2)
    db.session.commit()

    return nuevo_pedido.to_dict()


def get_orders_by_user(cuenta_id):
    """Retorna el listado de pedidos realizados por una cuenta."""
    pedidos = (
        Pedido.query.filter_by(cuenta_id=int(cuenta_id))
        .order_by(Pedido.pedido_id.desc())
        .all()
    )
    return [p.to_dict() for p in pedidos]


def get_order_by_id(pedido_id, cuenta_id=None):
    """Obtiene un pedido por su identificador primario."""
    query = Pedido.query.filter_by(pedido_id=int(pedido_id))
    if cuenta_id is not None:
        query = query.filter_by(cuenta_id=int(cuenta_id))
    pedido = query.first()
    return pedido.to_dict() if pedido else None
