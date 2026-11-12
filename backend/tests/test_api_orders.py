import datetime
import pytest
from app.models.persona import Persona
from app.models.cuenta import Cuenta
from app.models.producto import Producto
from app.models.pedido import Pedido
from app.models.enums import CategoriaProducto, RolDeUsuario, EstadoPedido, MetodoDePago
from app.services import authenticate_user


def test_create_order_unauthorized(client):
    """Verifica que crear un pedido sin token JWT retorne 401."""
    res = client.post('/api/orders', json={
        "items": [{"producto_id": 1, "cantidad": 2}],
        "fecha_entrega": "2026-10-26"
    })
    assert res.status_code == 401


def test_create_order_missing_fields(client, db_session):
    """Verifica validación de campos obligatorios (items y fecha_entrega)."""
    # 1. Crear usuario de prueba
    persona = Persona(nombre="Test", primer_apellido="Orders", fecha_registro=datetime.date.today())
    db_session.add(persona)
    db_session.flush()

    cuenta = Cuenta(
        email="test_orders@azomalli.com",
        telefono="9211112233",
        rol=RolDeUsuario.CLIENTE,
        persona_id=persona.persona_id
    )
    cuenta.set_password("Pass123!")
    db_session.add(cuenta)
    db_session.commit()

    token, _ = authenticate_user("test_orders@azomalli.com", "Pass123!")
    headers = {"Authorization": f"Bearer {token}"}

    # Falta items
    res_no_items = client.post('/api/orders', json={"fecha_entrega": "2026-10-26"}, headers=headers)
    assert res_no_items.status_code == 400

    # Falta fecha_entrega
    res_no_date = client.post('/api/orders', json={"items": [{"producto_id": 1, "cantidad": 1}]}, headers=headers)
    assert res_no_date.status_code == 400


def test_create_order_only_allows_cash(client, db_session):
    """Verifica que el flujo únicamente admita pago en efectivo."""
    persona = Persona(nombre="Pago", primer_apellido="Test", fecha_registro=datetime.date.today())
    db_session.add(persona)
    db_session.flush()

    cuenta = Cuenta(
        email="test_pago@azomalli.com",
        telefono="9211112234",
        rol=RolDeUsuario.CLIENTE,
        persona_id=persona.persona_id
    )
    cuenta.set_password("Pass123!")
    db_session.add(cuenta)
    db_session.commit()

    token, _ = authenticate_user("test_pago@azomalli.com", "Pass123!")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post('/api/orders', json={
        "items": [{"producto_id": 1, "cantidad": 1}],
        "fecha_entrega": "2026-10-26",
        "pago": "TRANSFERENCIA"
    }, headers=headers)

    assert res.status_code == 400
    assert "efectivo" in res.get_json()["error"].lower()


def test_complete_order_flow_with_customization_and_jsonb(client, db_session):
    """
    Flujo completo:
    1. Usuario logeado realiza pedido.
    2. Producto personalizable con opciones seleccionadas (JSONB en DetallePedido).
    3. Producto estándar sin personalización.
    4. Almacenamiento en relación con el usuario logeado y pago en efectivo.
    5. Consulta del pedido generado.
    """
    # 1. Crear usuario
    persona = Persona(nombre="Mariana", primer_apellido="García", fecha_registro=datetime.date.today())
    db_session.add(persona)
    db_session.flush()

    cuenta = Cuenta(
        email="mariana@azomalli.com",
        telefono="9213334455",
        rol=RolDeUsuario.CLIENTE,
        persona_id=persona.persona_id
    )
    cuenta.set_password("Panaderia123!")
    db_session.add(cuenta)
    db_session.flush()

    # 2. Crear productos: uno personalizable y otro estándar
    prod_concha = Producto(
        nombre="Conchas",
        descripcion="Miga suave, cubierta delicada",
        precio_unitario=25.00,
        es_personalizable=True,
        sabor={"opciones": ["Vainilla", "Chocolate", "Fresa"]},
        topping={"opciones": ["Sin topping", "Chispas", "Nuez", "Coco"]},
        relleno={"opciones": ["Sin relleno", "Crema pastelera", "Chocolate"]},
        activo=True,
        categoria=CategoriaProducto.DULCE,
        es_temporada=False
    )
    prod_roles = Producto(
        nombre="Roles de canela",
        descripcion="Deliciosos roles",
        precio_unitario=38.00,
        es_personalizable=False,
        activo=True,
        categoria=CategoriaProducto.DULCE,
        es_temporada=False
    )
    db_session.add_all([prod_concha, prod_roles])
    db_session.commit()

    # 3. Autenticación
    token, _ = authenticate_user("mariana@azomalli.com", "Panaderia123!")
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Enviar pedido con personalizaciones JSONB y notas
    order_payload = {
        "fecha_entrega": "2026-10-26",
        "lugar_entrega": "Panadería · recogida sin costo",
        "pago": "EFECTIVO",
        "items": [
            {
                "producto_id": prod_concha.producto_id,
                "cantidad": 4,
                "precio_unitario": 25.00,
                "sabor": "Vainilla",
                "topping": "Chispas",
                "relleno": "Sin relleno",
                "notas": "Demo: sin azúcar extra en la superficie."
            },
            {
                "producto_id": prod_roles.producto_id,
                "cantidad": 2,
                "precio_unitario": 38.00
            }
        ]
    }

    res = client.post('/api/orders', json=order_payload, headers=headers)
    assert res.status_code == 201
    body = res.get_json()
    assert body["success"] is True
    pedido = body["pedido"]

    # Validar campos del pedido
    assert pedido["cuenta_id"] == cuenta.cuenta_id
    assert pedido["estado"] == "PENDIENTE"
    assert pedido["pago"] == "EFECTIVO"
    assert pedido["fecha_entrega"] == "2026-10-26"
    assert pedido["lugar_entrega"] == "Panadería · recogida sin costo"
    # Monto total: 4 * 25.00 + 2 * 38.00 = 100 + 76 = 176.00
    assert pedido["monto_total"] == 176.00

    # Validar líneas de detalle y atributos JSONB
    detalles = pedido["detalles"]
    assert len(detalles) == 2

    # Línea 1 (Conchas personalizadas)
    conchas_line = next(d for d in detalles if d["producto_id"] == prod_concha.producto_id)
    assert conchas_line["cantidad"] == 4
    assert conchas_line["precio_unitario"] == 25.00
    assert conchas_line["sabor"]["opcion"] == "Vainilla"
    assert conchas_line["topping"]["opcion"] == "Chispas"
    assert conchas_line["relleno"]["opcion"] == "Sin relleno"
    assert conchas_line["notas"] == "Demo: sin azúcar extra en la superficie."

    # Línea 2 (Roles estándar)
    roles_line = next(d for d in detalles if d["producto_id"] == prod_roles.producto_id)
    assert roles_line["cantidad"] == 2
    assert roles_line["precio_unitario"] == 38.00
    assert roles_line["sabor"] is None

    # 5. Consultar lista de pedidos del usuario
    res_list = client.get('/api/orders', headers=headers)
    assert res_list.status_code == 200
    orders_list = res_list.get_json()["orders"]
    assert len(orders_list) >= 1
    assert any(o["pedido_id"] == pedido["pedido_id"] for o in orders_list)

    # 6. Consultar pedido por ID
    res_single = client.get(f'/api/orders/{pedido["pedido_id"]}', headers=headers)
    assert res_single.status_code == 200
    assert res_single.get_json()["pedido"]["pedido_id"] == pedido["pedido_id"]


def test_list_orders_filtering_and_security(client, db_session):
    """Verifica el filtrado de pedidos por estado y el control de acceso entre usuarios."""
    # 1. Crear dos usuarios
    p1 = Persona(nombre="Usuario1", primer_apellido="Azomalli", fecha_registro=datetime.date.today())
    p2 = Persona(nombre="Usuario2", primer_apellido="Azomalli", fecha_registro=datetime.date.today())
    db_session.add_all([p1, p2])
    db_session.flush()

    c1 = Cuenta(email="u1@azomalli.com", telefono="9210000001", rol=RolDeUsuario.CLIENTE, persona_id=p1.persona_id)
    c1.set_password("Pass123!")
    c2 = Cuenta(email="u2@azomalli.com", telefono="9210000002", rol=RolDeUsuario.CLIENTE, persona_id=p2.persona_id)
    c2.set_password("Pass123!")
    db_session.add_all([c1, c2])
    db_session.flush()

    # 2. Crear pedidos con diferentes estados
    ped1 = Pedido(
        cuenta_id=c1.cuenta_id,
        fecha_pedido=datetime.date(2026, 10, 4),
        fecha_entrega=datetime.date(2026, 10, 4),
        lugar_entrega="Panadería",
        estado=EstadoPedido.PENDIENTE,
        pago=MetodoDePago.EFECTIVO,
        monto_total=100.00
    )
    ped2 = Pedido(
        cuenta_id=c1.cuenta_id,
        fecha_pedido=datetime.date(2026, 9, 28),
        fecha_entrega=datetime.date(2026, 9, 28),
        lugar_entrega="Panadería",
        estado=EstadoPedido.ENTREGADO,
        pago=MetodoDePago.EFECTIVO,
        monto_total=240.00
    )
    ped3_user2 = Pedido(
        cuenta_id=c2.cuenta_id,
        fecha_pedido=datetime.date(2026, 9, 20),
        fecha_entrega=datetime.date(2026, 9, 20),
        lugar_entrega="Panadería",
        estado=EstadoPedido.ENTREGADO,
        pago=MetodoDePago.EFECTIVO,
        monto_total=50.00
    )
    db_session.add_all([ped1, ped2, ped3_user2])
    db_session.commit()

    token1, _ = authenticate_user("u1@azomalli.com", "Pass123!")
    token2, _ = authenticate_user("u2@azomalli.com", "Pass123!")
    h1 = {"Authorization": f"Bearer {token1}"}
    h2 = {"Authorization": f"Bearer {token2}"}

    # Usuario 1 ve todos sus pedidos (2 pedidos)
    res_all = client.get('/api/orders', headers=h1)
    assert res_all.status_code == 200
    orders_all = res_all.get_json()["orders"]
    assert len(orders_all) == 2

    # Filtrar por en curso (PENDIENTE)
    res_pending = client.get('/api/orders?estado=PENDIENTE', headers=h1)
    assert res_pending.status_code == 200
    orders_pending = res_pending.get_json()["orders"]
    assert len(orders_pending) == 1
    assert orders_pending[0]["pedido_id"] == ped1.pedido_id

    # Filtrar por entregado
    res_delivered = client.get('/api/orders?estado=ENTREGADO', headers=h1)
    assert res_delivered.status_code == 200
    orders_delivered = res_delivered.get_json()["orders"]
    assert len(orders_delivered) == 1
    assert orders_delivered[0]["pedido_id"] == ped2.pedido_id

    # Control de acceso: Usuario 2 NO puede ver el pedido de Usuario 1
    res_forbidden = client.get(f'/api/orders/{ped1.pedido_id}', headers=h2)
    assert res_forbidden.status_code == 403
