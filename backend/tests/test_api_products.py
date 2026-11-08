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

