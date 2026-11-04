"""Configuración e inicialización de Swagger (Flasgger) para la documentación de la API."""

from flasgger import Swagger

SWAGGER_TEMPLATE = {
    "swagger": "2.0",
    "info": {
        "title": "Las Glorias de Azomalli — API REST",
        "description": (
            "Documentación interactiva de la API REST del e-commerce de panadería artesanal "
            "**Las Glorias de Azomalli**. Permite explorar, probar y gestionar todos los endpoints "
            "disponibles para productos y futuras integraciones."
        ),
        "version": "1.0.0",
        "contact": {
            "name": "Equipo Las Glorias de Azomalli",
        },
    },
    "schemes": [
        "http",
        "https"
    ],
    "securityDefinitions": {
        "BearerAuth": {
            "type": "apiKey",
            "name": "Authorization",
            "in": "header",
            "description": (
                "Autenticación basada en JWT. "
                "Ingresa el token con el formato: **Bearer &lt;tu_jwt_token&gt;**"
            )
        }
    },
    "tags": [
        {
            "name": "Catálogo de Productos",
            "description": "Endpoints para consulta, detalle y filtrado del catálogo de panes artesanales."
        },
        {
            "name": "Autenticación",
            "description": "Endpoints para registro de cuentas, inicio de sesión y gestión de sesión JWT."
        }
    ],
    "definitions": {
        "Cuenta": {
            "type": "object",
            "description": "Entidad que representa la cuenta de usuario en el sistema.",
            "properties": {
                "cuenta_id": {
                    "type": "integer",
                    "example": 1,
                    "description": "Identificador único de la cuenta"
                },
                "email": {
                    "type": "string",
                    "example": "cliente@azomalli.com",
                    "description": "Correo electrónico registrado"
                },
                "telefono": {
                    "type": "string",
                    "example": "9211234567",
                    "description": "Número de teléfono de contacto"
                },
                "rol": {
                    "type": "string",
                    "example": "CLIENTE",
                    "description": "Rol asignado a la cuenta (CLIENTE, ADMINISTRADOR, etc.)"
                },
                "persona_id": {
                    "type": "integer",
                    "example": 1,
                    "description": "ID de la persona asociada a la cuenta"
                }
            }
        },
        "AuthLoginResponse": {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "example": "Inicio de sesión exitoso"
                },
                "access_token": {
                    "type": "string",
                    "example": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                },
                "cuenta": {
                    "$ref": "#/definitions/Cuenta"
                }
            }
        },
        "AuthRegisterResponse": {
            "type": "object",
            "properties": {
                "message": {
                    "type": "string",
                    "example": "Cuenta creada exitosamente"
                },
                "cuenta": {
                    "$ref": "#/definitions/Cuenta"
                }
            }
        },
        "Producto": {
            "type": "object",
            "description": "Entidad que representa un producto de panadería artesanal.",
            "properties": {
                "producto_id": {
                    "type": "integer",
                    "example": 1,
                    "description": "Identificador único del producto"
                },
                "nombre": {
                    "type": "string",
                    "example": "Concha Tradicional de Vainilla",
                    "description": "Nombre del producto"
                },
                "descripcion": {
                    "type": "string",
                    "example": "Pan dulce tradicional mexicano con corteza crujiente azucarada de vainilla.",
                    "description": "Descripción detallada del pan o producto"
                },
                "precio_unitario": {
                    "type": "number",
                    "format": "float",
                    "example": 18.50,
                    "description": "Precio unitario en pesos mexicanos (MXN)"
                },
                "categoria": {
                    "type": "string",
                    "enum": ["DULCE", "SALADO"],
                    "example": "DULCE",
                    "description": "Categoría gastronómica del producto"
                },
                "imagen_url": {
                    "type": "string",
                    "example": "https://res.cloudinary.com/azomalli/image/upload/v1/concha.png",
                    "description": "URL de la imagen del producto (alojada en Cloudinary o estático)"
                },
                "es_personalizable": {
                    "type": "boolean",
                    "example": False,
                    "description": "Indica si el producto permite personalización de sabor, relleno o topping"
                },
                "sabor": {
                    "type": "object",
                    "example": None,
                    "description": "Configuración JSON de sabor para productos personalizables"
                },
                "topping": {
                    "type": "object",
                    "example": None,
                    "description": "Configuración JSON de topping para productos personalizables"
                },
                "relleno": {
                    "type": "object",
                    "example": None,
                    "description": "Configuración JSON de relleno para productos personalizables"
                },
                "activo": {
                    "type": "boolean",
                    "example": True,
                    "description": "Indica si el producto está disponible para venta"
                },
                "es_temporada": {
                    "type": "boolean",
                    "example": False,
                    "description": "Indica si es un producto exclusivo de temporada"
                }
            }
        },
        "ProductosListResponse": {
            "type": "object",
            "properties": {
                "success": {
                    "type": "boolean",
                    "example": True
                },
                "count": {
                    "type": "integer",
                    "example": 7,
                    "description": "Total de productos que coinciden con los criterios de búsqueda"
                },
                "products": {
                    "type": "array",
                    "items": {
                        "$ref": "#/definitions/Producto"
                    }
                }
            }
        },
        "ProductoDetailResponse": {
            "type": "object",
            "properties": {
                "success": {
                    "type": "boolean",
                    "example": True
                },
                "product": {
                    "$ref": "#/definitions/Producto"
                }
            }
        },
        "ErrorResponse": {
            "type": "object",
            "properties": {
                "success": {
                    "type": "boolean",
                    "example": False
                },
                "error": {
                    "type": "string",
                    "example": "Mensaje descriptivo del error ocurrido"
                },
                "details": {
                    "type": "string",
                    "example": "Detalle técnico opcional del error"
                }
            }
        }
    }
}

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec",
            "route": "/apispec.json",
            "rule_filter": lambda rule: True,
            "model_filter": lambda tag: True,
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/",  # Interfaz de gestión Swagger en el root '/'
    "title": "Las Glorias de Azomalli — Documentación Swagger",
    "uiversion": 3
}


def init_swagger(app):
    """Inicializa la extensión Flasgger en la aplicación Flask."""
    return Swagger(app, config=SWAGGER_CONFIG, template=SWAGGER_TEMPLATE)