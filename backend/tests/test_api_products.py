import pytest
from app.models.producto import Producto
from app.models.enums import CategoriaProducto


def test_get_docs_swagger(client):
    """Verifica que la documentación Swagger o la redirección raíz funcione."""
    res = client.get('/docs')
    assert res.status_code in [200, 302]


def test_get_products_empty_or_list(client, db_session):
    """Verifica la respuesta del catálogo /api/products con código 200 y formato lista."""
    res = client.get('/api/products')
    assert res.status_code == 200
    body = res.get_json()
    assert body["success"] is True
    assert isinstance(body["products"], list)


def test_get_products_with_filter_category(client, db_session):
    """Verifica el filtro por categoría (?category=DULCE)."""
    # Insertar producto de prueba en la sesión
    pan_dulce = Producto(
        nombre="Pan Dulce Test",
        descripcion="Test concha",
        precio_unitario=15.0,
        es_personalizable=False,
        activo=True,
        categoria=CategoriaProducto.DULCE,
        es_temporada=False
    )
    pan_salado = Producto(
        nombre="Bolillo Test",
        descripcion="Test bolillo",
        precio_unitario=6.0,
        es_personalizable=False,
        activo=True,
        categoria=CategoriaProducto.SALADO,
        es_temporada=False
    )
    db_session.add_all([pan_dulce, pan_salado])
    db_session.commit()

    # Consultar filtro DULCE
    res = client.get('/api/products?category=DULCE')
    assert res.status_code == 200
    data = res.get_json()["products"]
    assert len(data) >= 1
    assert all(p['categoria'] == 'DULCE' for p in data)

    # Consultar filtro SALADO
    res_salado = client.get('/api/products?category=SALADO')
    assert res_salado.status_code == 200
    data_salado = res_salado.get_json()["products"]
    assert len(data_salado) >= 1
    assert all(p['categoria'] == 'SALADO' for p in data_salado)


def test_get_product_by_id_found_and_not_found(client, db_session):
    """Verifica consultar un producto específico por ID."""
    pan = Producto(
        nombre="Rol de Canela Test",
        descripcion="Con glaseado",
        precio_unitario=25.0,
        es_personalizable=False,
        activo=True,
        categoria=CategoriaProducto.DULCE,
        es_temporada=True
    )
    db_session.add(pan)
    db_session.commit()

    # ID existente
    res = client.get(f'/api/products/{pan.producto_id}')
    assert res.status_code == 200
    item = res.get_json()["product"]
    assert item["nombre"] == "Rol de Canela Test"
    assert item["es_temporada"] is True

    # ID no existente
    res_404 = client.get('/api/products/9999999')
    assert res_404.status_code == 404



def test_create_product_success_and_validation(client, db_session):
    """Verifica la creación exitosa de un producto y sus validaciones."""
    # 1. Creación exitosa
    payload = {
        "nombre": "Concha de Vainilla Artesanal",
        "descripcion": "Concha esponjosa tradicional mexicana.",
        "precio_unitario": 28.50,
        "categoria": "DULCE",
        "imagen_url": "https://example.com/concha.jpg",
        "es_personalizable": True,
        "es_temporada": False,
        "activo": True,
        "sabor": {"opciones": ["Vainilla", "Chocolate"]},
        "ingredientes": "Harina de trigo, leche, mantequilla, azúcar, levadura y vainilla.",
        "peso": "90 g por pieza",
        "unidad": "Pieza"
    }
    res = client.post('/api/products', json=payload)
    assert res.status_code == 201
    body = res.get_json()
    assert body["success"] is True
    prod = body["product"]
    assert prod["nombre"] == "Concha de Vainilla Artesanal"
    assert prod["precio_unitario"] == 28.50
    assert prod["categoria"] == "DULCE"
    assert prod["activo"] is True
    assert prod["es_personalizable"] is True

    # 2. Validación de campos obligatorios faltantes
    res_no_nombre = client.post('/api/products', json={
        "descripcion": "Sin nombre",
        "precio_unitario": 20.0,
        "categoria": "DULCE"
    })
    assert res_no_nombre.status_code == 400

    res_no_price = client.post('/api/products', json={
        "nombre": "Pan Sin Precio",
        "descripcion": "Descripción válida",
        "categoria": "SALADO"
    })
    assert res_no_price.status_code == 400

    # 3. Validación de precio negativo o cero
    res_bad_price = client.post('/api/products', json={
        "nombre": "Pan Precio Negativo",
        "descripcion": "Descripción válida",
        "precio_unitario": -5.0,
        "categoria": "DULCE"
    })
    assert res_bad_price.status_code == 400

    # 4. Validación de categoría inválida
    res_bad_cat = client.post('/api/products', json={
        "nombre": "Pan Categoría Rara",
        "descripcion": "Descripción válida",
        "precio_unitario": 15.0,
        "categoria": "INVALIDA"
    })
    assert res_bad_cat.status_code == 400


def test_update_product_success_and_errors(client, db_session):
    """Verifica actualización de producto existente."""
    pan = Producto(
        nombre="Baguette Rústica",
        descripcion="Baguette crujiente",
        precio_unitario=35.0,
        es_personalizable=False,
        activo=True,
        categoria=CategoriaProducto.SALADO,
        es_temporada=False
    )
    db_session.add(pan)
    db_session.commit()

    # 1. Actualización válida
    update_data = {
        "nombre": "Baguette Rústica de Masa Madre",
        "precio_unitario": 42.0,
        "es_temporada": True
    }
    res = client.put(f'/api/products/{pan.producto_id}', json=update_data)
    assert res.status_code == 200
    updated = res.get_json()["product"]
    assert updated["nombre"] == "Baguette Rústica de Masa Madre"
    assert updated["precio_unitario"] == 42.0
    assert updated["es_temporada"] is True
    assert updated["categoria"] == "SALADO"

    # 2. Actualizar producto inexistente
    res_404 = client.put('/api/products/999999', json={"nombre": "Fantasma"})
    assert res_404.status_code == 404

    # 3. Actualizar con nombre vacío (400)
    res_bad = client.put(f'/api/products/{pan.producto_id}', json={"nombre": "   "})
    assert res_bad.status_code == 400


def test_archive_and_restore_product_lifecycle(client, db_session):
    """
    Verifica el ciclo de vida de archivado y reactivación de un producto:
    1. Producto activo visible en catálogo público.
    2. Al archivar, ya no aparece en catálogo público.
    3. Aparece al filtrar con status=archived.
    4. Al reactivar, vuelve a aparecer en catálogo público.
    """
    pan = Producto(
        nombre="Panqué de Limón Temporal",
        descripcion="Panqué glaseado con jugo de limón fresco",
        precio_unitario=65.0,
        es_personalizable=False,
        activo=True,
        categoria=CategoriaProducto.DULCE,
        es_temporada=True
    )
    db_session.add(pan)
    db_session.commit()

    # 1. Visible en catálogo público inicial
    res_init = client.get('/api/products')
    assert any(p["producto_id"] == pan.producto_id for p in res_init.get_json()["products"])

    # 2. Archivar el producto
    res_archive = client.post(f'/api/products/{pan.producto_id}/archive')
    assert res_archive.status_code == 200
    assert res_archive.get_json()["product"]["activo"] is False

    # 3. Ya no debe aparecer en el catálogo público activo
    res_after_archive = client.get('/api/products')
    assert not any(p["producto_id"] == pan.producto_id for p in res_after_archive.get_json()["products"])

    # 4. Sí debe aparecer al filtrar por status=archived
    res_archived_list = client.get('/api/products?status=archived')
    assert any(p["producto_id"] == pan.producto_id for p in res_archived_list.get_json()["products"])

    # 5. Reactivar el producto
    res_restore = client.post(f'/api/products/{pan.producto_id}/restore')
    assert res_restore.status_code == 200
    assert res_restore.get_json()["product"]["activo"] is True

    # 6. Vuelve a aparecer en catálogo público
    res_final = client.get('/api/products')
    assert any(p["producto_id"] == pan.producto_id for p in res_final.get_json()["products"])


def test_search_and_filter_products(client, db_session):
    """Verifica filtros combinados por búsqueda de texto y código."""
    p1 = Producto(
        nombre="Dona Glaseada Especial",
        descripcion="Dona esponjosa con glaseado de vainilla",
        precio_unitario=18.0,
        es_personalizable=False,
        activo=True,
        categoria=CategoriaProducto.DULCE,
        es_temporada=False
    )
    p2 = Producto(
        nombre="Empanada de Mole",
        descripcion="Empanada salada rellena de mole poblano artesanal",
        precio_unitario=32.0,
        es_personalizable=False,
        activo=True,
        categoria=CategoriaProducto.SALADO,
        es_temporada=False
    )
    db_session.add_all([p1, p2])
    db_session.commit()

    # Buscar por palabra "Glaseada"
    res_search = client.get('/api/products?search=Glaseada')
    assert res_search.status_code == 200
    items = res_search.get_json()["products"]
    assert any(p["producto_id"] == p1.producto_id for p in items)
    assert not any(p["producto_id"] == p2.producto_id for p in items)

    # Buscar por código PAN-00X
    code = f"PAN-{p2.producto_id:03d}"
    res_code = client.get(f'/api/products?search={code}')
    assert res_code.status_code == 200
    items_code = res_code.get_json()["products"]
    assert any(p["producto_id"] == p2.producto_id for p in items_code)
