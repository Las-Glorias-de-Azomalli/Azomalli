import os
import re
import pytest
from playwright.sync_api import Page, expect

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://frontend:3000")


def test_e2e_catalog_loads(page: Page):
    """E2E-01: Carga del catálogo desde la API y verificación del encabezado."""
    page.goto(FRONTEND_URL)

    # 1. Esperar a que la aplicación React cargue y el Navbar esté disponible
    brand = page.locator(".brand-name")
    expect(brand).to_contain_text("Las Glorias de Azomalli")

    # 2. Esperar a que las tarjetas de productos se rendericen desde la API
    cards = page.locator("#all-products-grid .product-card-container")
    expect(cards.first).to_be_visible(timeout=25000)
    assert cards.count() > 0, "No se encontraron tarjetas de productos cargadas en el catálogo"


def test_e2e_category_filter(page: Page):
    """E2E-02: Filtro reactivo por categorías de productos."""
    page.goto(FRONTEND_URL)

    # Esperar a que carguen los botones de filtro y hacer clic en Dulces
    btn_dulces = page.locator("#category-filter-buttons button", has_text="Dulces")
    expect(btn_dulces).to_be_visible(timeout=15000)
    btn_dulces.click()

    # Comprobar que el botón obtenga la clase 'active' tras la actualización del estado de React
    expect(btn_dulces).to_have_class(re.compile(r"\bactive\b"))


def test_e2e_add_to_cart_and_persistence(page: Page):
    """E2E-03: Añadir pan al carrito, abrir drawer, incrementar cantidad y persistencia tras recarga."""
    page.goto(FRONTEND_URL)

    # 1. Comprobar que el contador inicial es 0
    counter = page.locator("#cart-counter")
    expect(counter).to_have_text("0", timeout=15000)

    # 2. Agregar primer producto disponible
    btn_add = page.locator("#all-products-grid .btn-add-cart").first
    expect(btn_add).to_be_visible()
    btn_add.click()

    # 3. Verificar que el contador cambie a 1
    expect(counter).to_have_text("1")

    # 4. Abrir Drawer de compras
    btn_open_cart = page.locator("#open-cart-btn")
    btn_open_cart.click()

    # 5. Esperar apertura del Drawer
    drawer = page.locator(".drawer-panel.is-open")
    expect(drawer).to_be_visible()

    # 6. Incrementar cantidad (+)
    btn_increase = page.locator(".qty-btn.btn-increase").first
    btn_increase.click()

    # 7. Verificar que la cantidad en el span sea 2
    qty_span = page.locator(".cart-item-qty").first
    expect(qty_span).to_have_text("2")

    # 8. Recargar la página y verificar persistencia en localStorage
    page.reload()
    counter_after_refresh = page.locator("#cart-counter")
    expect(counter_after_refresh).to_have_text("2", timeout=15000)
