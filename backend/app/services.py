"""Servicios de negocio de Azomalli — Consultas a la base de datos."""

from flask_jwt_extended import create_access_token
from app.database import db
from app.models.producto import Producto
from app.models.cuenta import Cuenta
from app.models.enums import CategoriaProducto, RolDeUsuario


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