import os
import pytest
from playwright.sync_api import Page, expect

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://frontend:3000")


def test_e2e_product_customization_modal_opens_and_adds_to_cart(page: Page):
    """E2E-ORDER-01: Abrir pop-up de personalización Figma (25:154), elegir opciones y agregar al carrito."""
    page.goto(FRONTEND_URL)

    # Esperar a que el catálogo cargue
    expect(page.locator(".brand-name")).to_contain_text("Las Glorias de Azomalli")

    # Localizar el botón de Personalizar del primer pan personalizable
    btn_customize = page.locator(".btn-customize-pan").first
    expect(btn_customize).to_be_visible(timeout=15000)
    btn_customize.click()

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
    # 1. Iniciar sesión con la cuenta demo
    page.goto(f"{FRONTEND_URL}/login")
    page.locator(".demo-account-hint").click()
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
