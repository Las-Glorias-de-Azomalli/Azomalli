"""Script para poblar la base de datos con los productos iniciales si está vacía."""
import datetime
from app import create_app
from app.database import db
from app.models.producto import Producto
from app.models.persona import Persona
from app.models.cuenta import Cuenta
from app.models.enums import CategoriaProducto, RolDeUsuario

INITIAL_PRODUCTS = [
    {
        "nombre": "Pay",
        "descripcion": "Delicioso pay artesanal de piña.",
        "precio_unitario": 30.00,
        "imagen_url": "https://res.cloudinary.com/du7fghgi8/image/upload/v1792981331/pay_pina.jpg",
        "es_personalizable": True,
        "sabor": {"opciones": ["Piña", "Manzana", "Zarzamora"]},
        "topping": None,
        "relleno": None,
        "activo": True,
        "categoria": CategoriaProducto.DULCE,
        "es_temporada": False,
    },
    {
        "nombre": "Concha de mantequilla",
        "descripcion": "Concha suave tradicional con costra dulce.",
        "precio_unitario": 22.00,
        "imagen_url": "https://res.cloudinary.com/du7fghgi8/image/upload/v1792981331/concha_mantequilla.jpg",
        "es_personalizable": True,
        "sabor": {"opciones": ["Vainilla", "Chocolate", "Fresa"]},
        "topping": {"opciones": ["Sin topping", "Chispas", "Nuez", "Coco"]},
        "relleno": {"opciones": ["Sin relleno", "Crema pastelera", "Chocolate"]},
        "activo": True,
        "categoria": CategoriaProducto.DULCE,
        "es_temporada": False,
    },
    {
        "nombre": "Pan Integral",
        "descripcion": "Pan de caja de masa integral y corteza rústica.",
        "precio_unitario": 60.00,
        "imagen_url": "https://res.cloudinary.com/du7fghgi8/image/upload/v1792981332/pan_integral.jpg",
        "es_personalizable": False,
        "sabor": None,
        "topping": None,
        "relleno": None,
        "activo": True,
        "categoria": CategoriaProducto.SALADO,
        "es_temporada": False,
    },
    {
        "nombre": "Roles de Canela",
        "descripcion": "Deliciosos roles de canela con glaseado artesanal.",
        "precio_unitario": 20.00,
        "imagen_url": "https://res.cloudinary.com/du7fghgi8/image/upload/v1792981332/roles_canela.jpg",
        "es_personalizable": False,
        "sabor": None,
        "topping": None,
        "relleno": None,
        "activo": True,
        "categoria": CategoriaProducto.DULCE,
        "es_temporada": True,
    },
    {
        "nombre": "Bollitos Integrales",
        "descripcion": "Bollitos hechos de masa integral tierna y esponjosa.",
        "precio_unitario": 15.00,
        "imagen_url": "https://res.cloudinary.com/du7fghgi8/image/upload/v1792981331/bollito_relleno.jpg",
        "es_personalizable": False,
        "sabor": None,
        "topping": None,
        "relleno": None,
        "activo": True,
        "categoria": CategoriaProducto.DULCE,
        "es_temporada": False,
    },
    {
        "nombre": "Garras de Oso",
        "descripcion": "Garras de oso rellenas de queso crema dulce.",
        "precio_unitario": 20.00,
        "imagen_url": "https://res.cloudinary.com/du7fghgi8/image/upload/v1792981331/garras_oso.jpg",
        "es_personalizable": False,
        "sabor": None,
        "topping": None,
        "relleno": None,
        "activo": True,
        "categoria": CategoriaProducto.DULCE,
        "es_temporada": False,
    },
    {
        "nombre": "Pan de Mantequilla",
        "descripcion": "Pan suave hecho con mantequilla pura de rancho.",
        "precio_unitario": 50.00,
        "imagen_url": "https://res.cloudinary.com/du7fghgi8/image/upload/v1792981332/pan_mantequilla.jpg",
        "es_personalizable": True,
        "sabor": {"opciones": ["Mantequilla", "Naranja"]},
        "topping": {"opciones": ["Fresas", "Nuez", "Glaseado"]},
        "relleno": None,
        "activo": True,
        "categoria": CategoriaProducto.DULCE,
        "es_temporada": True,
    },
]

def seed_database():
    app = create_app()
    with app.app_context():
        total = Producto.query.count()
        if total == 0:
            print("Poblando tabla Producto con datos iniciales...")
            for item in INITIAL_PRODUCTS:
                prod = Producto(**item)
                db.session.add(prod)
            db.session.commit()
            print(f"Se crearon {len(INITIAL_PRODUCTS)} productos exitosamente.")
        else:
            print(f"La base de datos ya contiene {total} productos. Omitiendo seed de productos.")

        # Poblar cuenta demo para inicio de sesión si no existe
        cuenta_demo = Cuenta.query.filter_by(email="ana@example.com").first()
        if not cuenta_demo:
            print("Poblando cuenta de demostración (ana@example.com)...")
            persona_ana = Persona(
                nombre="Ana",
                primer_apellido="García",
                fecha_registro=datetime.date.today()
            )
            db.session.add(persona_ana)
            db.session.flush()

            cuenta_ana = Cuenta(
                email="ana@example.com",
                telefono="9211234567",
                rol=RolDeUsuario.CLIENTE,
                persona_id=persona_ana.persona_id
            )
            cuenta_ana.set_password("Panaderia123!")
            db.session.add(cuenta_ana)
            db.session.commit()
            print("Cuenta de demostración creada exitosamente.")
        else:
            print("La cuenta demo ya existe. Omitiendo seed de cuenta.")

if __name__ == "__main__":
    seed_database()
