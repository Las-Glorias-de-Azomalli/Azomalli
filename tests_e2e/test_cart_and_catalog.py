import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

SELENIUM_HUB_URL = os.getenv("SELENIUM_HUB_URL", "http://selenium:4444/wd/hub")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://frontend:3000")


def safe_click(driver, element):
    """
    Hace scroll hacia el centro de la pantalla y hace clic de forma segura,
    evitando que barras de navegación 'sticky' o superpuestas intercepten el clic.
    """
    driver.execute_script("arguments[0].scrollIntoView({ block: 'center', inline: 'center' });", element)
    time.sleep(0.4)
    try:
        element.click()
    except Exception:
        # Si el clic estándar es interceptado por un elemento flotante, ejecutar mediante JS nativo
        driver.execute_script("arguments[0].click();", element)


@pytest.fixture(scope="module")
def driver():
    """Inicializa la sesión de RemoteWebDriver conectada al contenedor de Selenium Chrome."""
    options = webdriver.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")

    driver = None
    # Reintentar conexión con Selenium Grid/Standalone por si aún inicializa
    for attempt in range(15):
        try:
            driver = webdriver.Remote(
                command_executor=SELENIUM_HUB_URL,
                options=options
            )
            break
        except Exception:
            time.sleep(2)

    if not driver:
        driver = webdriver.Remote(
            command_executor=SELENIUM_HUB_URL,
            options=options
        )

    driver.implicitly_wait(10)
    yield driver
    driver.quit()


def test_e2e_catalog_loads(driver):
    """E2E-01: Carga del catálogo desde la API y verificación del encabezado."""
    driver.get(FRONTEND_URL)
    wait = WebDriverWait(driver, 25)

    # Diagnóstico de seguridad contra bloqueos de host en Webpack Dev Server
    if "Invalid Host header" in driver.page_source:
        pytest.fail("Error de Webpack Dev Server: 'Invalid Host header' detectado.")

    # 1. Esperar a que la aplicación React cargue y el Navbar esté disponible
    brand = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "brand-name")))
    assert "Las Glorias de Azomalli" in brand.text

    # 2. Esperar a que las tarjetas de productos se rendericen desde la API
    cards = wait.until(
        EC.presence_of_all_elements_located((By.CSS_SELECTOR, "#all-products-grid .product-card-container"))
    )
    assert len(cards) > 0, "No se encontraron tarjetas de productos cargadas en el catálogo"


def test_e2e_category_filter(driver):
    """E2E-02: Filtro reactivo por categorías de productos."""
    driver.get(FRONTEND_URL)
    wait = WebDriverWait(driver, 15)

    # Esperar a que carguen los botones de filtro
    btn_dulces = wait.until(
        EC.element_to_be_clickable((By.XPATH, "//div[@id='category-filter-buttons']//button[contains(text(), 'Dulces')]"))
    )
    safe_click(driver, btn_dulces)

    # Comprobar que el botón obtenga la clase 'active' tras la actualización del estado de React
    wait.until(lambda d: "active" in btn_dulces.get_attribute("class"))
    assert "active" in btn_dulces.get_attribute("class")


def test_e2e_add_to_cart_and_persistence(driver):
    """E2E-03: Añadir pan al carrito, abrir drawer, incrementar cantidad y persistencia tras recarga."""
    driver.get(FRONTEND_URL)
    wait = WebDriverWait(driver, 15)

    # 1. Comprobar que el contador inicial es 0
    counter = wait.until(EC.presence_of_element_located((By.ID, "cart-counter")))
    assert counter.text == "0"

    # 2. Agregar primer producto disponible
    btn_add = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, "#all-products-grid .btn-add-cart"))
    )
    safe_click(driver, btn_add)

    # 3. Verificar que el contador cambie a 1
    wait.until(EC.text_to_be_present_in_element((By.ID, "cart-counter"), "1"))

    # 4. Abrir Drawer de compras
    btn_open_cart = wait.until(EC.element_to_be_clickable((By.ID, "open-cart-btn")))
    safe_click(driver, btn_open_cart)

    # 5. Esperar apertura del Drawer
    drawer = wait.until(
        EC.presence_of_element_located((By.CSS_SELECTOR, ".drawer-panel.is-open"))
    )
    assert drawer.is_displayed()

    # 6. Incrementar cantidad (+)
    btn_increase = wait.until(
        EC.element_to_be_clickable((By.CSS_SELECTOR, ".qty-btn.btn-increase"))
    )
    safe_click(driver, btn_increase)

    # 7. Verificar que la cantidad en el span sea 2
    wait.until(EC.text_to_be_present_in_element((By.CSS_SELECTOR, ".cart-item-qty"), "2"))
    qty_span = driver.find_element(By.CSS_SELECTOR, ".cart-item-qty")
    assert qty_span.text == "2"

    # 8. Recargar la página y verificar persistencia en localStorage
    driver.refresh()
    wait.until(EC.presence_of_element_located((By.ID, "cart-counter")))
    wait.until(EC.text_to_be_present_in_element((By.ID, "cart-counter"), "2"))
    counter_after_refresh = driver.find_element(By.ID, "cart-counter")
    assert counter_after_refresh.text == "2", "El carrito no persistió en localStorage tras refrescar la página"
