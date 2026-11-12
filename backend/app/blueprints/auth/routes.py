"""Rutas y controladores del módulo de Autenticación."""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.database import db
from app.services import register_account, authenticate_user
from app.models.cuenta import Cuenta

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Registro de una nueva Cuenta
    ---
    tags:
      - Autenticación
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - telefono
            - password
            - persona_id
          properties:
            email:
              type: string
              example: cliente@azomalli.com
            telefono:
              type: string
              example: "9211234567"
            password:
              type: string
              example: "MiPasswordSeguro123"
            persona_id:
              type: integer
              example: 1
    responses:
      201:
        description: Cuenta registrada exitosamente.
      400:
        description: Datos faltantes o correo ya registrado.
      500:
        description: Error interno del servidor.
    """
    data = request.get_json() or {}

    required_fields = ['email', 'telefono', 'password', 'persona_id']
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({"error": f"Campos faltantes: {', '.join(missing)}"}), 400

    try:
        cuenta_creada = register_account(
            email=data['email'],
            telefono=data['telefono'],
            raw_password=data['password'],
            persona_id=data['persona_id']
        )
        return jsonify({
            "message": "Cuenta creada exitosamente",
            "cuenta": cuenta_creada
        }), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": "Error interno del servidor", "details": str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Inicio de sesión de usuario
    ---
    tags:
      - Autenticación
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - email
            - password
          properties:
            email:
              type: string
              example: cliente@azomalli.com
            password:
              type: string
              example: "MiPasswordSeguro123"
    responses:
      200:
        description: Inicio de sesión correcto. Retorna el access_token JWT.
      400:
        description: Faltan credenciales.
      401:
        description: Credenciales inválidas.
    """
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Correo y contraseña son requeridos"}), 400

    token, cuenta = authenticate_user(email, password)

    if not token:
        return jsonify({"error": "Credenciales inválidas"}), 401

    return jsonify({
        "message": "Inicio de sesión exitoso",
        "access_token": token,
        "cuenta": cuenta
    }), 200


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def profile():
    """
    Obtener perfil de la cuenta autenticada
    ---
    tags:
      - Autenticación
    security:
      - BearerAuth: []
    responses:
      200:
        description: Datos del perfil obtenidos correctamente.
      401:
        description: Token JWT faltante, expirado o inválido.
      404:
        description: Usuario no encontrado.
    """
    current_cuenta_id = get_jwt_identity()
    claims = get_jwt()

    cuenta = db.session.get(Cuenta, int(current_cuenta_id))
    if not cuenta:
        return jsonify({"error": "Usuario no encontrado"}), 404

    return jsonify({
        "cuenta": cuenta.to_dict(),
        "rol_token": claims.get("rol")
    }), 200