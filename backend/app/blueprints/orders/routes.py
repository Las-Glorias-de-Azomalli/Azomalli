"""Rutas y controladores del módulo de Pedidos."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.services import create_order, get_orders_by_user, get_order_by_id
from app.models.enums import RolDeUsuario

orders_bp = Blueprint('orders', __name__)


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
    Listar pedidos del usuario autenticado.
    ---
    tags:
      - Pedidos
    security:
      - BearerAuth: []
    responses:
      200:
        description: Lista de pedidos del usuario.
      401:
        description: No autorizado.
    """
    current_cuenta_id = get_jwt_identity()
    orders = get_orders_by_user(current_cuenta_id)
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
    is_admin = claims.get("rol") == RolDeUsuario.ADMINISTRADOR.value

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
    is_admin = claims.get("rol") == RolDeUsuario.ADMINISTRADOR.value

    if int(current_cuenta_id) != user_id and not is_admin:
        return jsonify({"error": "No tienes permiso para consultar estos pedidos."}), 403

    orders = get_orders_by_user(user_id)
    return jsonify({"success": True, "orders": orders}), 200
