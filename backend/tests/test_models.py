import pytest
from app.models.enums import CategoriaProducto, RolDeUsuario, EstadoPedido, MetodoDePago
from app.models.cuenta import Cuenta
from app.models.producto import Producto
from app.models.pedido import Pedido
from app.models.detalle_pedido import DetallePedido
import datetime


def test_enums_definitions():
    """Valida que los Enums contengan los valores esperados por la base de datos."""
    assert CategoriaProducto.DULCE.value == 'DULCE'
    assert CategoriaProducto.SALADO.value == 'SALADO'

    assert RolDeUsuario.CLIENTE.value == 'CLIENTE'
    assert RolDeUsuario.ADMINISTRADOR.value == 'ADMINISTRADOR'

    assert EstadoPedido.PENDIENTE.value == 'PENDIENTE'
    assert EstadoPedido.ENTREGADO.value == 'ENTREGADO'
    assert EstadoPedido.CANCELADO.value == 'CANCELADO'

    assert MetodoDePago.EFECTIVO.value == 'EFECTIVO'
    assert MetodoDePago.TRANSFERENCIA.value == 'TRANSFERENCIA'


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


def test_pedido_and_detalle_to_dict():
    """Comprueba la serialización de Pedido y DetallePedido con opciones JSONB."""
    pedido = Pedido(
        pedido_id=1,
        cuenta_id=5,
        fecha_pedido=datetime.date(2026, 10, 22),
        fecha_entrega=datetime.date(2026, 10, 26),
        lugar_entrega="Panadería · recogida sin costo",
        estado=EstadoPedido.PENDIENTE,
        pago=MetodoDePago.EFECTIVO,
        monto_total=100.00
    )

    detalle = DetallePedido(
        detalle_pedido_id=10,
        Pedido_pedido_id=1,
        Producto_producto_id=3,
        cantidad=4,
        precio_unitario=25.00,
        sabor={"opcion": "Vainilla"},
        topping={"opcion": "Chispas"},
        relleno={"opcion": "Sin relleno"},
        notas="Demo: sin azúcar extra"
    )
    pedido.detalles = [detalle]

    dict_pedido = pedido.to_dict()
    assert dict_pedido["pedido_id"] == 1
    assert dict_pedido["cuenta_id"] == 5
    assert dict_pedido["fecha_pedido"] == "2026-10-22"
    assert dict_pedido["fecha_entrega"] == "2026-10-26"
    assert dict_pedido["pago"] == "EFECTIVO"
    assert dict_pedido["monto_total"] == 100.00
    assert len(dict_pedido["detalles"]) == 1

    dict_detalle = dict_pedido["detalles"][0]
    assert dict_detalle["detalle_pedido_id"] == 10
    assert dict_detalle["producto_id"] == 3
    assert dict_detalle["cantidad"] == 4
    assert dict_detalle["precio_unitario"] == 25.00
    assert dict_detalle["sabor"] == {"opcion": "Vainilla"}
    assert dict_detalle["topping"] == {"opcion": "Chispas"}
    assert dict_detalle["relleno"] == {"opcion": "Sin relleno"}
    assert dict_detalle["notas"] == "Demo: sin azúcar extra"


