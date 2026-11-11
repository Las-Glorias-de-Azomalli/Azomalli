import os
import re
import pytest
from playwright.sync_api import Page, expect

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://frontend:3000")


def test_login_page_renders_design_elements(page: Page):
    """E2E-AUTH-01: Verificación de renderizado de elementos del diseño Figma (15:10367)."""
    page.goto(f"{FRONTEND_URL}/login")

    # 1. Tarjeta visual izquierda: Invitación artesanal
    expect(page.locator(".stamp-percent")).to_have_text("100%")
    expect(page.locator(".stamp-label")).to_have_text("CASERO")
    expect(page.locator(".welcome-headline")).to_contain_text("Qué gusto tenerte")
    expect(page.locator(".welcome-subline")).to_contain_text("Hecho a mano. Para compartir. Para disfrutar.")

    # 2. Tarjeta derecha: Formulario de acceso
    expect(page.locator(".eyebrow-accent")).to_have_text("TU CUENTA, TU PAN FAVORITO")
    expect(page.locator(".login-title")).to_have_text("Iniciar sesión")

    # 3. Campos de entrada
    expect(page.locator("#login-email")).to_be_visible()
    expect(page.locator("#login-password")).to_be_visible()
    expect(page.locator("#login-remember")).to_be_attached()
    expect(page.locator("#login-submit-btn")).to_be_visible()
    expect(page.locator(".demo-account-hint")).to_contain_text("Cuenta de demostración")

    # 4. Pie de página
    expect(page.locator(".footer-bar-headline")).to_have_text("De nuestras manos a tu mesa.")


def test_login_demo_hint_autofills_credentials(page: Page):
    """E2E-AUTH-02: El botón de cuenta de demostración autocompleta credenciales válidas."""
    page.goto(f"{FRONTEND_URL}/login")

    # Clic en "Cuenta de demostración"
    page.locator(".demo-account-hint").click()

    expect(page.locator("#login-email")).to_have_value("ana@example.com")
    expect(page.locator("#login-password")).to_have_value("Panaderia123!")


def test_login_invalid_credentials_shows_error(page: Page):
    """E2E-AUTH-03: Ingreso de credenciales erróneas muestra alerta de error."""
    page.goto(f"{FRONTEND_URL}/login")

    page.locator("#login-email").fill("invalido@azomalli.com")
    page.locator("#login-password").fill("ContraseñaFalsa999")
    page.locator("#login-submit-btn").click()

    error_banner = page.locator("#login-error-message")
    expect(error_banner).to_be_visible(timeout=10000)
    expect(error_banner).to_contain_text("Credenciales inválidas")


def test_login_successful_and_navbar_updates_profile(page: Page):
    """E2E-AUTH-04: Inicio de sesión exitoso actualiza el Navbar con Mi Perfil y el nombre del usuario."""
    page.goto(f"{FRONTEND_URL}/login")

    # 1. Ingresar credenciales sembradas en la base de datos
    page.locator("#login-email").fill("ana@example.com")
    page.locator("#login-password").fill("Panaderia123!")
    page.locator("#login-submit-btn").click()

    # 2. Redirección automática al catálogo principal
    page.wait_for_url(f"{FRONTEND_URL}/", timeout=15000)

    # 3. Verificar que el Navbar muestre "Mi Perfil" y el nombre registrado "Ana"
    profile_label = page.locator("#nav-profile-label")
    expect(profile_label).to_have_text("Mi Perfil")

    profile_name = page.locator("#nav-profile-name")
    expect(profile_name).to_be_visible()
    expect(profile_name).to_have_text("Ana")

    # 4. Abrir dropdown de usuario y validar detalles
    page.locator("#nav-profile-btn").click()
    dropdown = page.locator("#nav-profile-dropdown")
    expect(dropdown).to_be_visible()
    expect(page.locator("#dropdown-user-display")).to_have_text("Ana")
    expect(page.locator("#btn-logout")).to_be_visible()


def test_session_persistence_and_logout(page: Page):
    """E2E-AUTH-05: Persistencia de sesión tras recarga (F5) y cierre de sesión correcto."""
    page.goto(f"{FRONTEND_URL}/login")

    # Iniciar sesión
    page.locator("#login-email").fill("ana@example.com")
    page.locator("#login-password").fill("Panaderia123!")
    page.locator("#login-submit-btn").click()
    page.wait_for_url(f"{FRONTEND_URL}/", timeout=15000)

    # Recargar la página
    page.reload()

    # Comprobar que sigue mostrando "Mi Perfil" y "Ana"
    expect(page.locator("#nav-profile-name")).to_have_text("Ana", timeout=10000)

    # Cerrar sesión
    page.locator("#nav-profile-btn").click()
    page.locator("#btn-logout").click()

    # Comprobar que el nombre del usuario ya no se muestra (vuelve a estado invitado)
    expect(page.locator("#nav-profile-name")).not_to_be_visible()
    expect(page.locator("#nav-profile-label")).to_have_text("Mi Perfil")


def test_navbar_navigation_to_login(page: Page):
    """E2E-AUTH-06: Clic en Mi Perfil desde el home navega a la pantalla de inicio de sesión."""
    page.goto(FRONTEND_URL)

    # Asegurar que estamos en estado invitado
    page.evaluate("() => { localStorage.clear(); }")
    page.reload()

    profile_btn = page.locator("#nav-profile-btn")
    expect(profile_btn).to_be_visible()
    profile_btn.click()

    page.wait_for_url(f"{FRONTEND_URL}/login", timeout=10000)
    expect(page.locator(".login-title")).to_have_text("Iniciar sesión")
