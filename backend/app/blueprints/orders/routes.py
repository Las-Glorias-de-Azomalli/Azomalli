"""Rutas y controladores del módulo de Pedidos."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.database import db
from app.services import create_order, get_orders_by_user, get_order_by_id
from app.models.cuenta import Cuenta
from app.models.enums import RolDeUsuario

orders_bp = Blueprint('orders', __name__)


def _is_admin_user(current_cuenta_id, claims):
    """Verifica si el usuario autenticado tiene rol ADMINISTRADOR en el token o en la base de datos."""
    if claims and claims.get("rol") == RolDeUsuario.ADMINISTRADOR.value:
        return True
    try:
        cuenta = db.session.get(Cuenta, int(current_cuenta_id))
        if cuenta:
            rol_str = cuenta.rol.value if hasattr(cuenta.rol, "value") else str(cuenta.rol)
            return rol_str == RolDeUsuario.ADMINISTRADOR.value
    except Exception:
        pass
    return False


@orders_bp.route('', methods=['POST'])
@orders_bp.route('/', methods=['POST'])
@jwt_required()
def create():
    """
    Crear un nuevo pedido para el usuario autenticado.
    El flujo solo admite pago en EFECTIVO.
    ---
    tags:
      - Pedidos
    security:
      - BearerAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - items
            - fecha_entrega
          properties:
            items:
              type: array
              items:
                type: object
                required:
                  - producto_id
                  - cantidad
                properties:
                  producto_id:
                    type: integer
                  cantidad:
                    type: integer
                  precio_unitario:
                    type: number
                  sabor:
                    type: object
                  topping:
                    type: object
                  relleno:
                    type: object
                  notas:
                    type: string
            fecha_entrega:
              type: string
              example: "2026-10-26"
            lugar_entrega:
              type: string
              example: "Panadería · recogida sin costo"
            pago:
              type: string
              example: "EFECTIVO"
    responses:
      201:
        description: Pedido registrado exitosamente.
      400:
        description: Datos faltantes, método de pago no permitido o validación fallida.
      401:
        description: No autorizado.
    """
    current_cuenta_id = get_jwt_identity()
    data = request.get_json() or {}

    items = data.get('items')
    fecha_entrega = data.get('fecha_entrega')
    lugar_entrega = data.get('lugar_entrega', "Panadería · recogida sin costo")
    pago = data.get('pago', "EFECTIVO")

    if not items or not isinstance(items, list):
        return jsonify({"error": "El pedido debe contener una lista de items válidos."}), 400

    if not fecha_entrega:
        return jsonify({"error": "La fecha de entrega es obligatoria."}), 400

    try:
        nuevo_pedido = create_order(
            cuenta_id=current_cuenta_id,
            items=items,
            fecha_entrega=fecha_entrega,
            lugar_entrega=lugar_entrega,
            pago=pago
        )
        return jsonify({
            "success": True,
            "message": "¡Pedido realizado con éxito!",
            "pedido": nuevo_pedido,
            "order_id": f"GLO-{nuevo_pedido['pedido_id']:04d}"
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e), "success": False}), 400
    except Exception as e:
        return jsonify({"error": "Error interno al procesar el pedido.", "details": str(e), "success": False}), 500


@orders_bp.route('', methods=['GET'])
@orders_bp.route('/', methods=['GET'])
@jwt_required()
def list_orders():
    """
    Listar pedidos del usuario autenticado (o todos los pedidos del sistema si es administrador).
    ---
    tags:
      - Pedidos
    security:
      - BearerAuth: []
    parameters:
      - in: query
        name: estado
        type: string
        description: Filtro opcional por estado (PENDIENTE, ENTREGADO, CANCELADO, EN_CURSO)
    responses:
      200:
        description: Lista de pedidos.
      401:
        description: No autorizado.
    """
    current_cuenta_id = get_jwt_identity()
    claims = get_jwt()
    is_admin = _is_admin_user(current_cuenta_id, claims)
    estado = request.args.get('estado')
    orders = get_orders_by_user(current_cuenta_id, estado=estado, include_all=is_admin)
    return jsonify({"success": True, "orders": orders}), 200


@orders_bp.route('/<int:pedido_id>', methods=['GET'])
@jwt_required()
def get_order(pedido_id):
    """
    Consultar detalles de un pedido específico.
    ---
    tags:
      - Pedidos
    security:
      - BearerAuth: []
    responses:
      200:
        description: Detalles del pedido.
      403:
        description: No autorizado para ver este pedido.
      404:
        description: Pedido no encontrado.
    """
    current_cuenta_id = get_jwt_identity()
    claims = get_jwt()
    is_admin = _is_admin_user(current_cuenta_id, claims)

    order = get_order_by_id(pedido_id)
    if not order:
        return jsonify({"error": "Pedido no encontrado"}), 404

    # Verificar que pertenezca al usuario logeado a menos que sea administrador
    if order["cuenta_id"] != int(current_cuenta_id) and not is_admin:
        return jsonify({"error": "No tienes permiso para consultar este pedido."}), 403

    return jsonify({"success": True, "pedido": order}), 200


@orders_bp.route('/user/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_orders(user_id):
    """
    Consultar pedidos de un usuario dado.
    ---
    tags:
      - Pedidos
    security:
      - BearerAuth: []
    responses:
      200:
        description: Lista de pedidos.
      403:
        description: No autorizado.
    """
    current_cuenta_id = get_jwt_identity()
    claims = get_jwt()
    is_admin = _is_admin_user(current_cuenta_id, claims)

    if int(current_cuenta_id) != user_id and not is_admin:
        return jsonify({"error": "No tienes permiso para consultar estos pedidos."}), 403

    orders = get_orders_by_user(user_id)
    return jsonify({"success": True, "orders": orders}), 200
