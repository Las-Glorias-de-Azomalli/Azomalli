"""Rutas y controladores del módulo de Productos."""

from flask import request, jsonify, Blueprint
from app.services import (
    get_products as fetch_products_service,
    get_product_by_id as get_product_by_id_service,
    create_product as create_product_service,
    update_product as update_product_service,
    archive_product as archive_product_service
)

products_bp = Blueprint('products', __name__)


@products_bp.route('', methods=['GET'], strict_slashes=False)
def get_products():
    """
    Consultar catálogo de productos
    Retorna la lista de panes y productos artesanales disponibles, permitiendo filtrar por categoría (DULCE/SALADO),
    productos de temporada, estado (activo/archivado/todos) y búsqueda por texto o código.
    ---
    tags:
      - Catálogo de Productos
    parameters:
      - name: filter
        in: query
        type: string
        required: false
        description: Filtro especial ('seasonal' para temporada).
      - name: category
        in: query
        type: string
        required: false
        description: Categoría ('DULCE', 'SALADO' o 'TODOS').
      - name: status
        in: query
        type: string
        required: false
        description: Filtro de estado ('active', 'archived', 'all').
      - name: search
        in: query
        type: string
        required: false
        description: Texto para buscar en nombre, descripción o código.
    responses:
      200:
        description: Catálogo de productos obtenido exitosamente
      500:
        description: Error interno al consultar la base de datos
    """
    filter_type = request.args.get('filter')
    category = request.args.get('category')
    status = request.args.get('status')
    include_archived = request.args.get('include_archived')
    search = request.args.get('search')

    # Si se pasa include_archived=true y no hay status definido, mostrar todos
    if not status and include_archived and str(include_archived).lower() in ('true', '1', 'yes'):
        status = 'all'

    only_active = status is None

    try:
        products = fetch_products_service(
            filter_type=filter_type,
            category=category,
            only_active=only_active,
            status=status,
            search=search
        )

        return jsonify({
            "success": True,
            "count": len(products),
            "products": products
        }), 200
    except Exception as err:
        return jsonify({
            "success": False,
            "error": "Error al consultar los productos de la base de datos",
            "details": str(err)
        }), 500


@products_bp.route('/<int:producto_id>', methods=['GET'])
def get_product(producto_id):
    """
    Obtener detalle de un producto por ID
    Consulta la información completa de un producto artesanal a partir de su ID único.
    """
    include_archived = request.args.get('include_archived', 'true').lower() in ('true', '1', 'yes')
    try:
        product = get_product_by_id_service(producto_id, only_active=not include_archived)
        if not product:
            return jsonify({
                "success": False,
                "error": f"No se encontró ningún producto con el ID {producto_id}"
            }), 404

        return jsonify({
            "success": True,
            "product": product
        }), 200
    except Exception as err:
        return jsonify({
            "success": False,
            "error": "Error al consultar el producto en la base de datos",
            "details": str(err)
        }), 500


@products_bp.route('', methods=['POST'], strict_slashes=False)
def create_product():
    """
    Crear un nuevo producto en el catálogo.
    Requiere nombre, descripción, precio_unitario y categoría.
    """
    data = request.get_json() or {}
    try:
        nuevo = create_product_service(data)
        return jsonify({
            "success": True,
            "message": "Producto creado exitosamente",
            "product": nuevo
        }), 201
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
    except Exception as err:
        return jsonify({
            "success": False,
            "error": "Error interno al crear el producto",
            "details": str(err)
        }), 500


@products_bp.route('/<int:producto_id>', methods=['PUT', 'PATCH'])
def update_product(producto_id):
    """
    Actualizar datos de un producto existente.
    """
    data = request.get_json() or {}
    try:
        actualizado = update_product_service(producto_id, data)
        if not actualizado:
            return jsonify({
                "success": False,
                "error": f"No se encontró ningún producto con el ID {producto_id}"
            }), 404

        return jsonify({
            "success": True,
            "message": "Producto actualizado exitosamente",
            "product": actualizado
        }), 200
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
    except Exception as err:
        return jsonify({
            "success": False,
            "error": "Error interno al actualizar el producto",
            "details": str(err)
        }), 500


@products_bp.route('/<int:producto_id>/archive', methods=['POST', 'PATCH'])
def archive_product_route(producto_id):
    """
    Archivar un producto (activo = False).
    """
    try:
        archivado = archive_product_service(producto_id, archive=True)
        if not archivado:
            return jsonify({
                "success": False,
                "error": f"No se encontró ningún producto con el ID {producto_id}"
            }), 404

        return jsonify({
            "success": True,
            "message": "Producto archivado exitosamente",
            "product": archivado
        }), 200
    except Exception as err:
        return jsonify({
            "success": False,
            "error": "Error interno al archivar el producto",
            "details": str(err)
        }), 500


@products_bp.route('/<int:producto_id>/restore', methods=['POST', 'PATCH'])
def restore_product_route(producto_id):
    """
    Reactivar/desarchivar un producto (activo = True).
    """
    try:
        reactivado = archive_product_service(producto_id, archive=False)
        if not reactivado:
            return jsonify({
                "success": False,
                "error": f"No se encontró ningún producto con el ID {producto_id}"
            }), 404

        return jsonify({
            "success": True,
            "message": "Producto reactivado exitosamente",
            "product": reactivado
        }), 200
    except Exception as err:
        return jsonify({
            "success": False,
            "error": "Error interno al reactivar el producto",
            "details": str(err)
        }), 500


@products_bp.route('/<int:producto_id>', methods=['DELETE'])
def delete_product(producto_id):
    """
    Eliminar / archivar producto vía DELETE para compatibilidad REST.
    """
    try:
        archivado = archive_product_service(producto_id, archive=True)
        if not archivado:
            return jsonify({
                "success": False,
                "error": f"No se encontró ningún producto con el ID {producto_id}"
            }), 404

        return jsonify({
            "success": True,
            "message": "Producto archivado exitosamente",
            "product": archivado
        }), 200
    except Exception as err:
        return jsonify({
            "success": False,
            "error": "Error interno al archivar el producto",
            "details": str(err)
        }), 500
