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
│   ├── test_models.py          # Unitarias: Enums, Hashing Bcrypt, Cuenta y Producto
│   ├── test_api_products.py    # Integración: Endpoints /api/products y filtros
│   └── test_api_auth.py        # Integración: Flujo de registro, login y tokens JWT
│
├── frontend/src/__tests__/     # 🔹 Pruebas de Frontend (React / Jest + RTL)
│   ├── ProductCard.test.js     # Componente: Render de tarjeta de pan y evento de agregar
│   └── useCart.test.js         # Custom Hook: Lógica del carrito, subtotales y localStorage
│
└── tests_e2e/                  # 🔹 Pruebas End-to-End (Selenium en Chrome + Docker)
    ├── Dockerfile              # Contenedor runner con Python y Selenium
    ├── requirements.txt        # Dependencias (pytest, selenium)
    └── test_cart_and_catalog.py# Flujos reales de usuario en navegador
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

### D. Pruebas End-to-End con Selenium (`tests_e2e/`)
* **Objetivo:** Probar la aplicación completa de extremo a extremo simulando a un usuario real navegando en **Google Chrome**.
* **Escenarios que ejecuta:**
  * **E2E-01:** Carga de la aplicación web, verificación de la barra de navegación y renderizado del catálogo entregado por la API de Flask.
  * **E2E-02:** Interacción reactiva con las pestañas de filtro ("Dulces" / "Salados") sin recargar la página.
  * **E2E-03:** Clic en *"Agregar al carrito"*, actualización del contador dinámico (`#cart-counter`), apertura del panel lateral (*CartDrawer*), incremento de cantidad (`+`), cálculo del nuevo subtotal y persistencia del carrito tras recargar la página (`F5`).
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
Crea una red interna hermética e independiente para ejecutar las pruebas automatizadas de Selenium:
* **Servicios coordinados:**
  1. `azomalli_e2e_db`: Base de datos temporal con healthcheck `pg_isready`.
  2. `azomalli_e2e_backend`: API Flask servida por **Gunicorn** con migraciones automáticas (`alembic upgrade head`) y poblamiento semilla (`seed.py`).
  3. `azomalli_e2e_frontend`: Aplicación React configurada para aceptar peticiones internas sin bloqueo de host.
  4. `azomalli_e2e_selenium`: Contenedor oficial `selenium/standalone-chrome` con servidor Xvfb.
  5. `azomalli_e2e_runner`: Contenedor Python que ejecuta Pytest y WebDriver, apagando todo el stack al finalizar (`exit-code-from e2e_runner`).
* **Comandos:**
  ```bash
  # Ejecutar suite E2E completa
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

