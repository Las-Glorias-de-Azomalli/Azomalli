import os
import re
import pytest
from playwright.sync_api import Page, expect

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://frontend:3000")


def test_e2e_product_customization_modal_opens_and_adds_to_cart(page: Page):
    """E2E-ORDER-01: Al dar clic en 'Agregar al carrito' en producto personalizable abre el modal (Figma 25:154), y el botón Personalizar ya no existe."""
    page.goto(FRONTEND_URL)

    # Esperar a que el catálogo cargue
    expect(page.locator(".brand-name")).to_contain_text("Las Glorias de Azomalli")

    # Verificar que el botón .btn-customize-pan fue eliminado de la pantalla
    expect(page.locator(".btn-customize-pan")).to_have_count(0)

    # Clic en 'Agregar al carrito' de un producto personalizable (Pay id=1 o Concha id=2)
    btn_add = page.locator(".product-card-container[data-id='1'] .btn-add-cart, .product-card-container[data-id='2'] .btn-add-cart, .btn-add-cart").first
    expect(btn_add).to_be_visible(timeout=15000)
    btn_add.click()

    # Verificar apertura del modal de personalización
    modal = page.locator("#customization-modal-panel")
    expect(modal).to_be_visible()
    expect(page.locator(".custom-eyebrow")).to_have_text("PERSONALIZA TU ANTOJO")
    expect(page.locator(".custom-title")).to_contain_text("Haz tus")

    # Seleccionar sabor
    sabor_btn = page.locator(".custom-option-group[data-group='sabor'] .custom-pill-btn").first
    if sabor_btn.is_visible():
        sabor_btn.click()

    # Escribir notas adicionales
    notes_input = page.locator("#custom-notes-input")
    notes_input.fill("Sin azúcar extra por favor")

    # Guardar en carrito
    submit_btn = page.locator("#submit-customization-btn")
    expect(submit_btn).to_be_visible()
    submit_btn.click()

    # Verificar que el modal se cierre y el contador de carrito aumente
    expect(modal).not_to_be_visible()
    counter = page.locator("#cart-counter")
    expect(counter).not_to_have_text("0", timeout=10000)


def test_e2e_cart_page_renders_design_and_customization(page: Page):
    """E2E-ORDER-02: Visualización de la página Tu Carrito (15:10487) y caja de personalización."""
    page.goto(f"{FRONTEND_URL}/cart")

    # Encabezado
    expect(page.locator(".cart-eyebrow")).to_have_text("PARA COMPARTIR. PARA DISFRUTAR.")
    expect(page.locator(".cart-page-title")).to_have_text("Tu carrito")
    expect(page.locator("#continue-shopping-btn")).to_be_visible()

    # Resumen lateral
    expect(page.locator(".summary-title")).to_have_text("Resumen del pedido")
    expect(page.locator(".summary-label", has_text="Recogida en panadería")).to_be_visible()
    expect(page.locator("#continue-order-btn")).to_be_visible()


def test_e2e_checkout_schedule_calendar_and_cash_payment(page: Page):
    """E2E-ORDER-03: Calendario para agendar pedido (81:1413), pago en efectivo y confirmación."""
    # 1. Iniciar sesión con credenciales válidas
    page.goto(f"{FRONTEND_URL}/login")
    page.locator("#login-email").fill("ana@example.com")
    page.locator("#login-password").fill("Panaderia123!")
    page.locator("#login-submit-btn").click()
    page.wait_for_url(f"{FRONTEND_URL}/", timeout=15000)

    # 2. Agregar un producto al carrito
    btn_add = page.locator("#all-products-grid .btn-add-cart").first
    expect(btn_add).to_be_visible()
    btn_add.click()

    # 3. Ir a /checkout
    page.goto(f"{FRONTEND_URL}/checkout")

    # 4. Validar diseño del calendario y datos de entrega
    expect(page.locator(".checkout-eyebrow")).to_have_text("FINALIZAR PEDIDO")
    expect(page.locator(".checkout-title")).to_have_text("Un día para disfrutarlo.")
    expect(page.locator("#availability-calendar-card")).to_be_visible()
    expect(page.locator(".selected-date-eyebrow")).to_have_text("FECHA DE ENTREGA ELEGIDA")
    expect(page.locator("#selected-date-display")).to_be_visible()

    # 5. Validar método de pago en efectivo
    expect(page.locator("#payment-method-cash")).to_contain_text("Efectivo")

    # 6. Validar botón de confirmar pedido
    confirm_btn = page.locator("#btn-confirm-order")
    expect(confirm_btn).to_be_visible()
    expect(confirm_btn).to_contain_text("Confirmar pedido")

    # 7. Clic en confirmar pedido y verificar vista de confirmación
    confirm_btn.click()
    expect(page.locator(".success-title")).to_contain_text("¡Gracias por tu compra!", timeout=15000)
    expect(page.locator(".success-desc")).to_contain_text("GLO-")


def test_e2e_unauthenticated_orders_redirects_to_login(page: Page):
    """Verifica que un usuario no autenticado no acceda a /pedidos y sea redirigido a /login."""
    page.goto(f"{FRONTEND_URL}/pedidos")
    page.wait_for_url(f"{FRONTEND_URL}/login", timeout=10000)
    expect(page.locator(".login-title")).to_have_text("Iniciar sesión")


def test_e2e_orders_page_table_and_calendar_views(page: Page):
    """E2E-ORDER-04: Mis pedidos (Figma 15:10586) y vista Calendario (Figma 81:1619)."""
    # 1. Iniciar sesión para acceder a Mis pedidos
    page.goto(f"{FRONTEND_URL}/login")
    page.locator("#login-email").fill("ana@example.com")
    page.locator("#login-password").fill("Panaderia123!")
    page.locator("#login-submit-btn").click()
    page.wait_for_url(f"{FRONTEND_URL}/", timeout=15000)

    # 2. Navegar a Mis pedidos
    page.goto(f"{FRONTEND_URL}/pedidos")

    # 3. Validar encabezado de la página (Figma 15:10586)
    expect(page.locator(".orders-eyebrow")).to_have_text("DE NUESTRAS MANOS A TU MESA")
    expect(page.locator(".orders-headline")).to_have_text("Mis pedidos")
    expect(page.locator(".btn-explore-catalog")).to_be_visible()

    # 4. Validar filtros y controles de vista
    expect(page.locator("#filter-all-orders-btn")).to_be_visible()
    expect(page.locator("#filter-active-orders-btn")).to_be_visible()
    expect(page.locator("#view-table-btn")).to_be_visible()
    expect(page.locator("#view-calendar-btn")).to_be_visible()

    # 5. Validar vista Tabla activa por defecto
    expect(page.locator("#orders-table-wrapper")).to_be_visible()
    expect(page.locator(".orders-table-header-row")).to_contain_text("Pedido")
    expect(page.locator(".orders-table-header-row")).to_contain_text("Total")
    expect(page.locator(".order-code-text").first).to_be_visible()
    expect(page.locator(".btn-view-order-detail").first).to_be_visible()

    # 6. Cambiar a vista Calendario (Figma 81:1619)
    page.locator("#view-calendar-btn").click()
    expect(page.locator("#orders-calendar-wrapper")).to_be_visible()
    expect(page.locator(".calendar-criteria-text")).to_have_text("Por fecha de entrega")
    expect(page.locator(".calendar-weekdays-bar")).to_contain_text("Lun")
    expect(page.locator(".calendar-weekdays-bar")).to_contain_text("Dom")
    expect(page.locator(".orders-view-caption")).to_contain_text("Vista Calendario activa")


def test_e2e_order_detail_view(page: Page):
    """E2E-ORDER-05: Detalle del pedido (Figma 81:1829), información general y personalizaciones."""
    # 1. Iniciar sesión para acceder al detalle de pedidos
    page.goto(f"{FRONTEND_URL}/login")
    page.locator("#login-email").fill("ana@example.com")
    page.locator("#login-password").fill("Panaderia123!")
    page.locator("#login-submit-btn").click()
    page.wait_for_url(f"{FRONTEND_URL}/", timeout=15000)

    page.goto(f"{FRONTEND_URL}/pedidos")

    # 2. Clic en Ver detalle del primer pedido de la lista
    expect(page.locator(".btn-view-order-detail").first).to_be_visible(timeout=10000)
    page.locator(".btn-view-order-detail").first.click()
    page.wait_for_url(re.compile(r"/pedidos/\d+"), timeout=10000)

    # 3. Validar botón de retorno y encabezado
    expect(page.locator("#back-to-orders-btn")).to_be_visible()
    expect(page.locator(".order-detail-eyebrow")).to_have_text("CADA DETALLE, HECHO CON CARIÑO")
    expect(page.locator(".order-detail-title")).to_contain_text("Pedido")

    # 4. Validar banner de estado
    expect(page.locator(".order-status-banner-card")).to_be_visible()
    expect(page.locator(".registered-delivery-label")).to_have_text("ENTREGA REGISTRADA")

    # 5. Validar tarjeta de información general
    expect(page.locator(".order-info-title")).to_have_text("Información del pedido")
    expect(page.locator(".info-cell-label", has_text="Cuenta del comprador")).to_be_visible()
    expect(page.locator(".info-cell-label", has_text="Lugar de entrega")).to_be_visible()

    # 6. Validar sección de productos "Lo que elegiste"
    expect(page.locator(".items-section-title")).to_have_text("Lo que elegiste")

    # 7. Validar tarjeta de cierre y total general
    expect(page.locator(".closing-quote-title")).to_have_text("Un pequeño gusto. Un gran momento.")
    expect(page.locator(".closing-total-card")).to_contain_text("Total general")

    # 8. Probar botón de volver a Mis pedidos
    page.locator("#back-to-orders-btn").click()
    page.wait_for_url(f"{FRONTEND_URL}/pedidos", timeout=10000)
    expect(page.locator(".orders-headline")).to_have_text("Mis pedidos")
