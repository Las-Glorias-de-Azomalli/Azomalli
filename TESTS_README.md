# 🧪 Guía Rápida de Pruebas y Docker · Las Glorias de Azomalli

Esta guía resume la arquitectura, comandos y funcionamiento general de la suite de pruebas automatizadas y los entornos Docker del proyecto.

---

## ⚡ Comandos Rápidos (Cheat Sheet)

| Nivel de Prueba | Comando | Tiempo aprox. | ¿Requiere Docker? |
| :--- | :--- | :--- | :---: |
| **Unitarias Backend** | `pytest backend/tests/test_models.py -v` | ~1 segundo | ❌ No |
| **Unitarias Frontend** | `cd frontend && npm test` | ~3 segundos | ❌ No |
| **Integración Backend** | `pytest backend/tests/ -v` | ~2 segundos | ⚠️ Requiere PostgreSQL |
| **End-to-End (E2E)** | `docker compose -f docker-compose.e2e.yml up --build --abort-on-container-exit --exit-code-from e2e_runner` | ~7 segundos | ✅ Sí (Docker Compose) |
| **Limpiar entorno E2E** | `docker compose -f docker-compose.e2e.yml down -v` | ~2 segundos | ✅ Sí |

---

## 🏗️ 1. Arquitectura de la Suite de Pruebas

Las pruebas están organizadas en tres niveles independientes para garantizar velocidad y cobertura completa:

```text
Azomalli/
├── backend/tests/              # 🔹 Pruebas de Backend (Python / Pytest)
│   ├── conftest.py             # Configuración, fixtures y rollback de base de datos
│   ├── test_models.py          # Unitarias: Enums, Hashing Bcrypt, Cuenta, Producto, Pedido y DetallePedido
│   ├── test_api_products.py    # Integración: Endpoints /api/products y filtros
│   ├── test_api_auth.py        # Integración: Flujo de registro, login y tokens JWT
│   └── test_api_orders.py      # Integración: Endpoints /api/orders, flujo efectivo y JSONB
│
├── frontend/src/__tests__/     # 🔹 Pruebas de Frontend (React / Jest + RTL)
│   ├── ProductCard.test.js     # Componente: Render de tarjeta de pan y evento de agregar
│   ├── useCart.test.js         # Custom Hook: Lógica del carrito, subtotales y localStorage
│   ├── Navbar.test.js          # Componente: Navegación, botón Mi Perfil y dropdown de usuario
│   ├── LoginPage.test.js       # Pantalla: Formulario, diseño Figma, credenciales y errores
│   ├── ProductCustomizationModal.test.js # Modal: Pop-up de personalización (Figma 25:154)
│   ├── CartPage.test.js        # Pantalla: Vista completa de carrito (Figma 15:10487)
│   └── CheckoutPage.test.js    # Pantalla: Calendario y confirmación de pedido (Figma 81:1413)
│
└── tests_e2e/                  # 🔹 Pruebas End-to-End (Playwright en Chromium Headless + Docker)
    ├── Dockerfile              # Runner oficial Playwright Python de Microsoft
    ├── requirements.txt        # Dependencias (pytest, playwright, pytest-playwright)
    ├── conftest.py             # Fixtures, viewport y argumentos de navegador
    ├── test_cart_and_catalog.py# Flujos reales de catálogo, filtros y carrito
    ├── test_login.py           # Flujos de inicio de sesión, Mi Perfil en navbar y logout
    └── test_order_flow.py      # Flujo completo de personalización, carrito y agendar pedido
```

---

## 🧩 2. Funcionamiento de Cada Nivel de Prueba

### A. Pruebas Unitarias de Backend (`backend/tests/test_models.py`)
* **Objetivo:** Verificar la lógica pura de negocio, reglas de seguridad y modelos sin interactuar con la red.
* **Qué valida:**
  1. Integridad de los ENUMs de PostgreSQL (`CategoriaProducto` y `RolDeUsuario`).
  2. Encriptación segura de contraseñas con **Flask-Bcrypt** (`set_password` y `check_password`).
  3. Protección de privacidad en `to_dict()` (evita exponer el hash de la contraseña en las respuestas JSON).
* **Ejecución:**
  ```bash
  pytest backend/tests/test_models.py -v
  ```

---

### B. Pruebas Unitarias de Frontend (`frontend/src/__tests__/`)
* **Objetivo:** Verificar los componentes visuales de React y el estado de la aplicación en memoria (`jsdom`).
* **Qué valida:**
  1. Renderizado de precios formateados en pesos mexicanos (`$XX.XX MXN`) y etiquetas (`PAN DULCE`, `DE TEMPORADA`).
  2. Emisión de eventos al presionar el botón `Agregar al carrito`.
  3. Lógica del hook `useCart`: adición acumulativa de productos, cálculo reactivo del subtotal y persistencia automática en `localStorage`.
* **Ejecución:**
  ```bash
  cd frontend
  npm test
  ```

---

### C. Pruebas de Integración de Backend (`backend/tests/`)
* **Objetivo:** Validar que los controladores de Flask realicen consultas reales a la base de datos PostgreSQL y gestionen sesiones y tokens de forma adecuada.
* **Qué valida:**
  1. Catálogo `/api/products` con filtrado por categoría (`?category=DULCE`) y temporada (`?filter=seasonal`).
  2. Autenticación `/api/auth`: validación de campos obligatorios, prevención de correos duplicados, inicio de sesión y protección de rutas privadas mediante tokens JWT Bearer.
  3. Aislamiento transaccional: cada prueba aplica un rollback al finalizar para no ensuciar la base de datos.
* **Ejecución local:**
  ```bash
  # Con PostgreSQL activo localmente o mediante Docker (docker compose up -d db)
  pytest backend/tests/ -v
  ```

---

### D. Pruebas End-to-End con Playwright (`tests_e2e/`)
* **Objetivo:** Probar la aplicación web completa de extremo a extremo simulando a un usuario real en **Chromium headless** con auto-waiting nativo y mayor velocidad.
* **Ventajas frente a Selenium:**
  * Eliminación del contenedor independiente `selenium/standalone-chrome` (ahorro de ~2GB de RAM en el host).
  * Auto-espera nativa de elementos (elimina la necesidad de `time.sleep` y clics forzados por JavaScript).
  * Aislamiento hermético de contextos y mayor velocidad de ejecución.
* **Escenarios que ejecuta:**
  * **E2E-01:** Carga de la aplicación web, verificación del encabezado y renderizado del catálogo entregado por la API de Flask.
  * **E2E-02:** Interacción reactiva con las pestañas de filtro ("Dulces" / "Salados") sin recargar la página.
  * **E2E-03:** Clic en *"Agregar al carrito"*, actualización del contador dinámico (`#cart-counter`), apertura del panel lateral (*CartDrawer*), incremento de cantidad (`+`), cálculo del nuevo subtotal y persistencia del carrito tras recargar la página (`F5`).
  * **E2E-AUTH-01 a E2E-AUTH-06:** Renderizado fiel del diseño Figma de inicio de sesión (`15:10367`), autocompletado demo, validación de credenciales inválidas, login exitoso con cuenta semilla (`ana@example.com`), actualización reactiva del Navbar con **`Mi Perfil` y el nombre del usuario**, menú desplegable de usuario, persistencia tras recarga y cierre de sesión seguro.
* **Ejecución:**
  ```bash
  docker compose -f docker-compose.e2e.yml up --build --abort-on-container-exit --exit-code-from e2e_runner
  ```

---

## 🐳 3. Entornos Docker del Proyecto

El repositorio cuenta con dos orquestadores Docker Compose según la tarea a realizar:

### 1. Entorno de Desarrollo Local (`docker-compose.yml`)
Levanta el proyecto completo para programar con sincronización de código en caliente (*hot-reload*):
* **Servicios:**
  * `azomalli_db`: PostgreSQL 16 (puerto `5432`).
  * `azomalli_backend`: API Flask con recarga automática y Swagger (puerto `5000`).
  * `azomalli_frontend`: SPA React en desarrollo (puerto `3000`).
* **Comandos:**
  ```bash
  # Iniciar todos los servicios
  docker compose up --build

  # Iniciar en segundo plano
  docker compose up -d

  # Detener conservando los datos
  docker compose down

  # Ver logs en vivo del backend
  docker compose logs -f backend
  ```

---

### 2. Entorno de Pruebas E2E (`docker-compose.e2e.yml`)
Crea una red interna hermética e independiente para ejecutar las pruebas automatizadas de Playwright:
* **Servicios coordinados:**
  1. `azomalli_e2e_db`: Base de datos temporal con healthcheck `pg_isready`.
  2. `azomalli_e2e_backend`: API Flask servida por **Gunicorn** con migraciones automáticas (`alembic upgrade head`) y poblamiento semilla (`seed.py`), incluyendo cuenta demo.
  3. `azomalli_e2e_frontend`: Aplicación React configurada para aceptar peticiones internas sin bloqueo de host.
  4. `azomalli_e2e_runner`: Contenedor oficial de Playwright Python de Microsoft (`mcr.microsoft.com/playwright/python:v1.44.0-jammy`) que ejecuta Pytest y Chromium headless directamente, apagando todo el stack al finalizar (`exit-code-from e2e_runner`).
* **Comandos:**
  ```bash
  # Ejecutar suite E2E completa con Playwright
  docker compose -f docker-compose.e2e.yml up --build --abort-on-container-exit --exit-code-from e2e_runner

  # Limpiar contenedores y volúmenes de prueba al finalizar
  docker compose -f docker-compose.e2e.yml down -v
  ```

---

## 🚀 4. Integración Continua (Pipeline de GitHub Actions)

Toda la suite se encuentra conectada al archivo [`.github/workflows/pipeline.yml`](.github/workflows/pipeline.yml) para el equipo (**Leny, Beto y Enrique**):

1. **Al abrir un Pull Request a `main`:**
   * Se levanta un *Service Container* efímero de PostgreSQL 16.
   * Se ejecutan las migraciones de Alembic.
   * Se ejecutan las pruebas unitarias e integración de backend y frontend.
   * Si todo está verde, GitHub autoriza el botón de **Merge**.
2. **Al fusionar a `main`:**
   * Se compila la imagen Docker del backend y frontend y se publica en Docker Hub con la etiqueta `:latest`.
3. **Al crear un Git Tag (`v*.*.*`):**
   * Se empaqueta y publica la versión inmutable en Docker Hub (ej. `:v2.3.1`) para su despliegue a producción en **Railway**.

