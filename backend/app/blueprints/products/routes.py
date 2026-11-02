from flask import request, jsonify, Blueprint
from app.services import (
    get_products as fetch_products_service,
    get_product_by_id as get_product_by_id_service
)

products_bp = Blueprint('products', __name__)


@products_bp.route('', methods=['GET'], strict_slashes=False)
def get_products():
    """
    Consultar catálogo de productos
    Retorna la lista de panes y productos artesanales disponibles, permitiendo filtrar por categoría (DULCE/SALADO) o por productos de temporada.
    ---
    tags:
      - Catálogo de Productos
    parameters:
      - name: filter
        in: query
        type: string
        required: false
        description: Filtro especial. Usar 'seasonal' para obtener únicamente productos de temporada.
        enum:
          - seasonal
      - name: category
        in: query
        type: string
        required: false
        description: Categoría gastronómica para clasificar el pan ('DULCE', 'SALADO' o 'TODOS').
        enum:
          - DULCE
          - SALADO
          - TODOS
    responses:
      200:
        description: Catálogo de productos obtenido exitosamente
        schema:
          $ref: '#/definitions/ProductosListResponse'
      500:
        description: Error interno al consultar la base de datos
        schema:
          $ref: '#/definitions/ErrorResponse'
    """
    filter_type = request.args.get('filter')
    category = request.args.get('category')
    
    try:
        products = fetch_products_service(filter_type=filter_type, category=category)
        
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
    Consulta la información completa de un producto artesanal activo a partir de su ID único.
    ---
    tags:
      - Catálogo de Productos
    parameters:
      - name: producto_id
        in: path
        type: integer
        required: true
        description: Identificador único del producto en la base de datos.
    responses:
      200:
        description: Información detallada del producto encontrado
        schema:
          $ref: '#/definitions/ProductoDetailResponse'
      404:
        description: Producto no encontrado o inactivo
        schema:
          $ref: '#/definitions/ErrorResponse'
      500:
        description: Error interno del servidor al consultar el producto
        schema:
          $ref: '#/definitions/ErrorResponse'
    """
    try:
        product = get_product_by_id_service(producto_id)
        if not product:
            return jsonify({
                "success": False,
                "error": f"No se encontró ningún producto activo con el ID {producto_id}"
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
