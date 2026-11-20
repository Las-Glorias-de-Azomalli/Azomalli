import os
import re
import pytest
from playwright.sync_api import Page, expect

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://frontend:3000")


def _login_as_admin(page: Page):
    """Inicia sesión con la cuenta de administrador sembrada (admin@azomalli.com)."""
    page.goto(f"{FRONTEND_URL}/login")
    page.locator("#login-email").fill("admin@azomalli.com")
    page.locator("#login-password").fill("Admin123!")
    page.locator("#login-submit-btn").click()
    page.wait_for_url(f"{FRONTEND_URL}/admin/productos", timeout=15000)


def test_e2e_admin_catalog_view_and_metrics(page: Page):
    """E2E-ADMIN-01: Inicio de sesión como administrador y visualización del catálogo (Figma 15:10955), métricas y tabla."""
    _login_as_admin(page)

    # Validar barra superior y encabezado
    expect(page.locator(".admin-page-title")).to_have_text("Catálogo de panes")
    expect(page.locator(".admin-page-subtitle")).to_contain_text("Cuida lo que se ve en la tienda")
    expect(page.locator("#btn-add-product")).to_be_visible()

    # Validar métricas de catálogo
    expect(page.locator("#metric-active-products")).to_be_visible()
    expect(page.locator("#metric-archived-products")).to_be_visible()
    expect(page.locator("#metric-categories")).to_be_visible()

    # Validar pestañas de estado
    expect(page.locator("#tab-filter-active")).to_be_visible()
    expect(page.locator("#tab-filter-archived")).to_be_visible()

    # Validar tabla de productos
    expect(page.locator("#admin-products-table")).to_be_visible()
    expect(page.locator(".col-product").first).to_contain_text("PRODUCTO")
    expect(page.locator(".col-category").first).to_contain_text("CATEGORÍA")
    expect(page.locator(".col-price").first).to_contain_text("PRECIO")
    expect(page.locator(".col-status").first).to_contain_text("ESTADO")
    expect(page.locator(".col-actions").first).to_contain_text("ACCIONES")

    # Validar tarjeta guía
    expect(page.locator(".admin-guide-title")).to_have_text("El oficio está en los detalles.")


def test_e2e_admin_catalog_filtering_and_search(page: Page):
    """E2E-ADMIN-02: Filtros reactivos por búsqueda y conmutación entre activos y archivados."""
    _login_as_admin(page)

    # Esperar carga de la tabla
    expect(page.locator(".admin-table-row").first).to_be_visible(timeout=15000)

    # Probar buscador
    search_input = page.locator("#input-search-product")
    search_input.fill("Concha")
    expect(page.locator(".admin-product-name").first).to_contain_text("Concha")

    # Conmutar a la pestaña Archivados
    tab_archived = page.locator("#tab-filter-archived")
    tab_archived.click()
    expect(tab_archived).to_have_class(re.compile(r"is-active"))


def test_e2e_admin_create_product_flow(page: Page):
    """E2E-ADMIN-03: Agregar nuevo producto (Figma 15:11113), vista previa reactiva y publicación."""
    _login_as_admin(page)
    page.locator("#btn-add-product").click()
    page.wait_for_url(f"{FRONTEND_URL}/admin/productos/nuevo", timeout=15000)

    # Validar título y botón de regreso
    expect(page.locator(".admin-page-title")).to_have_text("Agregar producto")
    expect(page.locator("#btn-back-to-catalog")).to_be_visible()

    # Llenar datos en el formulario
    page.locator("#input-product-name").fill("Panqué de Nuez Artesanal")
    page.locator("#input-product-desc").fill("Panqué esponjoso elaborado con mantequilla y trozos de nuez.")
    page.locator("#input-product-price").fill("45.00")

    # Verificar que la vista previa se actualice reactivamente
    expect(page.locator(".admin-live-card-title")).to_have_text("Panqué de Nuez Artesanal")
    expect(page.locator(".admin-live-card-price")).to_contain_text("$45.00 MXN")

    # Publicar producto
    btn_submit = page.locator("#btn-submit-product")
    expect(btn_submit).to_be_visible()
    btn_submit.click()

    # Verificar redirección al catálogo de administración y presencia en la tabla
    page.wait_for_url(f"{FRONTEND_URL}/admin/productos", timeout=15000)
    expect(page.locator(".admin-page-title")).to_have_text("Catálogo de panes")
    expect(page.locator(".admin-product-name", has_text="Panqué de Nuez Artesanal").first).to_be_visible(timeout=15000)


def test_e2e_admin_edit_and_archive_product_flow(page: Page):
    """E2E-ADMIN-04: Editar y archivar producto (Figma 15:11272) con confirmación visible."""
    _login_as_admin(page)

    # Esperar a que cargue la lista y dar clic en Editar del primer producto
    btn_edit = page.locator(".btn-edit").first
    expect(btn_edit).to_be_visible(timeout=15000)
    btn_edit.click()

    page.wait_for_url(re.compile(r"/admin/productos/editar/\d+"), timeout=15000)

    # Validar título y presencia de datos pre-cargados
    expect(page.locator(".admin-page-title")).to_have_text("Editar producto")
    expect(page.locator("#input-edit-product-name")).not_to_have_value("")

    # Validar panel visible de confirmación de archivo
    expect(page.locator("#archive-confirm-box")).to_be_visible()
    expect(page.locator(".admin-archive-title")).to_contain_text("¿Archivar")
    expect(page.locator("#btn-confirm-archive")).to_be_visible()
    expect(page.locator("#btn-cancel-archive")).to_be_visible()

    # Probar botón de volver al catálogo
    page.locator("#btn-back-to-catalog").click()
    page.wait_for_url(f"{FRONTEND_URL}/admin/productos", timeout=15000)
    expect(page.locator(".admin-page-title")).to_have_text("Catálogo de panes")
