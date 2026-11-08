import pytest
from app.models.enums import CategoriaProducto, RolDeUsuario
from app.models.cuenta import Cuenta
from app.models.producto import Producto


def test_enums_definitions():
    """Valida que los Enums contengan los valores esperados por la base de datos."""
    assert CategoriaProducto.DULCE.value == 'DULCE'
    assert CategoriaProducto.SALADO.value == 'SALADO'

    assert RolDeUsuario.CLIENTE.value == 'CLIENTE'
    assert RolDeUsuario.ADMINISTRADOR.value == 'ADMINISTRADOR'


def test_cuenta_password_hashing(app):
    """Prueba unitaria del cifrado Bcrypt en el modelo Cuenta."""
    with app.app_context():
        cuenta = Cuenta(
            email="test@azomalli.com",
            telefono="1234567890",
            rol=RolDeUsuario.CLIENTE,
            persona_id=1
        )
        raw_pass = "PanaderiaSegura2026!"
        cuenta.set_password(raw_pass)

        # El password almacenado debe ser diferente a la contraseña en texto plano
        assert cuenta.password != raw_pass
        assert len(cuenta.password) > 20

        # Verificación de credenciales
        assert cuenta.check_password(raw_pass) is True
        assert cuenta.check_password("PasswordErroneo") is False


def test_cuenta_to_dict_security(app):
    """Comprueba que to_dict no exponga la contraseña o el hash en la respuesta serializada."""
    with app.app_context():
        cuenta = Cuenta(
            cuenta_id=10,
            email="seguro@azomalli.com",
            telefono="9219876543",
            rol=RolDeUsuario.CLIENTE,
            persona_id=2
        )
        cuenta.set_password("MiClaveSecreta")

        data = cuenta.to_dict()
        assert "password" not in data
        assert "password_hash" not in data
        assert data["email"] == "seguro@azomalli.com"
        assert data["rol"] == "CLIENTE"


def test_producto_to_dict():
    """Comprueba la serialización adecuada de Producto a diccionario."""
    producto = Producto(
        producto_id=1,
        nombre="Concha Tradicional",
        descripcion="Deliciosa concha de vainilla",
        precio_unitario=18.50,
        imagen_url="/images/concha.png",
        es_personalizable=False,
        activo=True,
        categoria=CategoriaProducto.DULCE,
        es_temporada=False
    )

    data = producto.to_dict()
    assert data["producto_id"] == 1
    assert data["nombre"] == "Concha Tradicional"
    assert data["precio_unitario"] == 18.50
    assert data["categoria"] == "DULCE"
    assert data["es_temporada"] is False

