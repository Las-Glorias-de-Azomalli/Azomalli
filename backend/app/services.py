"""Servicios de negocio de Azomalli — Consultas a la base de datos."""

import datetime
from flask_jwt_extended import create_access_token
from app.database import db
from app.models.producto import Producto
from app.models.cuenta import Cuenta
from app.models.pedido import Pedido
from app.models.detalle_pedido import DetallePedido
from app.models.enums import CategoriaProducto, RolDeUsuario, EstadoPedido, MetodoDePago


def get_products(filter_type=None, category=None, only_active=True, status=None, search=None):
    """
    Aplica filtros por estado activo, productos de temporada, categoría ENUM (DULCE/SALADO),
    estado ('active', 'archived', 'all') y término de búsqueda.
    """
    query = Producto.query

    if status:
        status_clean = str(status).strip().lower()
        if status_clean in ('active', 'activo', 'activos'):
            query = query.filter(Producto.activo == True)
        elif status_clean in ('archived', 'archivado', 'archivados', 'inactive', 'inactivo'):
            query = query.filter(Producto.activo == False)
        # si es 'all' o 'todos', no filtramos por activo
    elif only_active:
        query = query.filter_by(activo=True)

    if filter_type == 'seasonal':
        query = query.filter_by(es_temporada=True)

    if category and category.lower() != 'todos':
        cat_clean = category.strip().upper()
        if cat_clean in ('DULCE', 'DULCES', 'PAN DULCE'):
            query = query.filter_by(categoria=CategoriaProducto.DULCE)
        elif cat_clean in ('SALADO', 'SALADOS', 'PAN SALADO'):
            query = query.filter_by(categoria=CategoriaProducto.SALADO)

    if search and str(search).strip():
        term = str(search).strip()
        numeric_id = None
        if term.upper().startswith("PAN-"):
            clean_num = term[4:].strip()
            if clean_num.isdigit():
                numeric_id = int(clean_num)
        elif term.isdigit():
            numeric_id = int(term)

        if numeric_id is not None:
            query = query.filter((Producto.producto_id == numeric_id) | Producto.nombre.ilike(f"%{term}%"))
        else:
            query = query.filter(Producto.nombre.ilike(f"%{term}%") | Producto.descripcion.ilike(f"%{term}%"))

    products = query.order_by(Producto.producto_id.asc()).all()
    return [p.to_dict() for p in products]


def get_product_by_id(producto_id, only_active=False):
    """Obtiene un producto por ID. Si only_active es True, solo retorna si activo=True."""
    query = Producto.query.filter_by(producto_id=int(producto_id))
    if only_active:
        query = query.filter_by(activo=True)
    product = query.first()
    return product.to_dict() if product else None


def create_product(data):
    """Crea un nuevo producto en el catálogo."""
    if not data or not isinstance(data, dict):
        raise ValueError("Los datos del producto son requeridos.")

    nombre = str(data.get("nombre") or "").strip()
    if not nombre:
        raise ValueError("El nombre del producto es obligatorio.")

    descripcion = str(data.get("descripcion") or "").strip()
    if not descripcion:
        raise ValueError("La descripción del producto es obligatoria.")

    precio_raw = data.get("precio_unitario")
    if precio_raw is None:
        raise ValueError("El precio unitario es obligatorio.")
    try:
        precio_val = float(precio_raw)
        if precio_val <= 0:
            raise ValueError("El precio unitario debe ser mayor a 0.")
    except (TypeError, ValueError):
        raise ValueError("El precio unitario debe ser un número válido mayor a 0.")

    cat_raw = str(data.get("categoria") or "").strip().upper()
    if cat_raw in ("DULCE", "PAN DULCE", "DULCES"):
        categoria_enum = CategoriaProducto.DULCE
    elif cat_raw in ("SALADO", "PAN SALADO", "SALADOS"):
        categoria_enum = CategoriaProducto.SALADO
    else:
        raise ValueError(f"Categoría inválida: '{cat_raw}'. Debe ser DULCE o SALADO.")

    imagen_url = data.get("imagen_url")
    if imagen_url:
        imagen_url = str(imagen_url).strip()
    else:
        imagen_url = "/images/placeholder.svg"

    es_personalizable = bool(data.get("es_personalizable", False))
    es_temporada = bool(data.get("es_temporada", False))
    activo = bool(data.get("activo", True))

    sabor = data.get("sabor")
    extra_fields = {}
    for key in ("unidad", "peso", "ingredientes", "alergenos", "distintivos"):
        if key in data and data[key] is not None:
            extra_fields[key] = data[key]

    if extra_fields:
        if isinstance(sabor, dict):
            sabor = {**sabor, **extra_fields}
        elif isinstance(sabor, str):
            sabor = {"opciones": [sabor], **extra_fields}
        else:
            sabor = extra_fields

    nuevo_producto = Producto(
        nombre=nombre,
        descripcion=descripcion,
        precio_unitario=precio_val,
        imagen_url=imagen_url,
        es_personalizable=es_personalizable,
        sabor=sabor,
        topping=data.get("topping"),
        relleno=data.get("relleno"),
        activo=activo,
        categoria=categoria_enum,
        es_temporada=es_temporada
    )

    db.session.add(nuevo_producto)
    db.session.commit()
    return nuevo_producto.to_dict()


def update_product(producto_id, data):
    """Actualiza la información de un producto existente."""
    producto = Producto.query.filter_by(producto_id=int(producto_id)).first()
    if not producto:
        return None

    if "nombre" in data:
        nombre = str(data["nombre"]).strip()
        if not nombre:
            raise ValueError("El nombre del producto no puede estar vacío.")
        producto.nombre = nombre

    if "descripcion" in data:
        desc = str(data["descripcion"]).strip()
        if not desc:
            raise ValueError("La descripción del producto no puede estar vacía.")
        producto.descripcion = desc

    if "precio_unitario" in data:
        try:
            precio = float(data["precio_unitario"])
            if precio <= 0:
                raise ValueError("El precio unitario debe ser mayor a 0.")
            producto.precio_unitario = precio
        except (TypeError, ValueError):
            raise ValueError("El precio unitario debe ser un número válido mayor a 0.")

    if "categoria" in data:
        cat_raw = str(data["categoria"]).strip().upper()
        if cat_raw in ("DULCE", "PAN DULCE", "DULCES"):
            producto.categoria = CategoriaProducto.DULCE
        elif cat_raw in ("SALADO", "PAN SALADO", "SALADOS"):
            producto.categoria = CategoriaProducto.SALADO
        else:
            raise ValueError(f"Categoría inválida: '{cat_raw}'. Debe ser DULCE o SALADO.")

    if "imagen_url" in data:
        producto.imagen_url = str(data["imagen_url"]).strip() if data["imagen_url"] else None

    if "es_personalizable" in data:
        producto.es_personalizable = bool(data["es_personalizable"])

    if "es_temporada" in data:
        producto.es_temporada = bool(data["es_temporada"])

    if "activo" in data:
        producto.activo = bool(data["activo"])

    sabor = data.get("sabor", producto.sabor)
    extra_fields = {}
    for key in ("unidad", "peso", "ingredientes", "alergenos", "distintivos"):
        if key in data and data[key] is not None:
            extra_fields[key] = data[key]

    if extra_fields:
        if isinstance(sabor, dict):
            sabor = {**sabor, **extra_fields}
        elif isinstance(sabor, str):
            sabor = {"opciones": [sabor], **extra_fields}
        else:
            sabor = extra_fields

    if sabor is not None or "sabor" in data or extra_fields:
        producto.sabor = sabor

    if "topping" in data:
        producto.topping = data["topping"]

    if "relleno" in data:
        producto.relleno = data["relleno"]

    db.session.commit()
    return producto.to_dict()


def archive_product(producto_id, archive=True):
    """Archiva (activo=False) o reactiva (activo=True) un producto del catálogo."""
    producto = Producto.query.filter_by(producto_id=int(producto_id)).first()
    if not producto:
        return None

    producto.activo = not bool(archive)
    db.session.commit()
    return producto.to_dict()

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


def get_orders_by_user(cuenta_id, estado=None):
    """Retorna el listado de pedidos realizados por una cuenta."""
    query = Pedido.query.filter_by(cuenta_id=int(cuenta_id))
    if estado:
        estado_clean = str(estado).strip().upper()
        if estado_clean in ("CURSO", "EN CURSO", "PENDIENTE", "EN_CURSO"):
            query = query.filter(Pedido.estado == EstadoPedido.PENDIENTE)
        elif hasattr(EstadoPedido, estado_clean):
            query = query.filter(Pedido.estado == EstadoPedido[estado_clean])
    pedidos = (
        query
        .order_by(Pedido.fecha_entrega.desc(), Pedido.pedido_id.desc())
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
