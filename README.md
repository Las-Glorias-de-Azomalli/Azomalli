# Las Glorias de Azomalli · E-commerce de Panadería Artesanal

Plataforma de comercio electrónico para la panadería artesanal **"Las Glorias de Azomalli"**. El proyecto cuenta con una arquitectura desacoplada que separa claramente la interfaz de usuario (**Frontend en React**) de la lógica de negocio y persistencia (**Backend en Flask con PostgreSQL**), facilitando el trabajo en equipo mediante contenedorización completa con **Docker y Docker Compose**.

---

## 🛠️ Tecnologías Utilizadas

### Backend
* **Python 3.12+** con **Flask 3.0** (Arquitectura REST API / Headless).
* **Flask-CORS** para habilitar la comunicación cross-origin segura.
* **PostgreSQL 16** como motor de base de datos relacional (con soporte de ENUMs nativos y tipos JSONB).
* **SQLAlchemy 2.0** como ORM para el modelado de datos.
* **Alembic** para el control de versiones y migraciones del esquema.
* **psycopg 3** como adaptador de conexión a PostgreSQL.

### Frontend
* **React 18** (Single Page Application - SPA).
* **JavaScript (ES6+)** y **CSS3** nativo modular.
* **Capa de Servicios Centralizada**: Rutas y clientes HTTP unificados en `src/config/api.js` y `src/services/`.
* Sistema de diseño basado en especificaciones de Figma con variables de tokens y tipografías Google Fonts (*DM Serif Display* e *Inter*).
* **Custom Hooks** para gestión desacoplada del estado del carrito (`useCart`), catálogo de productos (`useProducts`) y notificaciones flotantes (`useToast`).

### Contenedorización e Infraestructura
* **Docker & Docker Compose**: Orquestación de tres servicios (`db`, `backend`, `frontend`) con volúmenes persistentes y sincronización de código en caliente.
* **Cloudinary**: Distribución optimizada de imágenes del catálogo mediante URLs públicas HTTPS.

---

## 📁 Estructura del Proyecto

```text
Azomalli/
├── docker-compose.yml         # Orquestador maestro de contenedores (db, backend, frontend)
├── .dockerignore              # Exclusión global para compilaciones Docker
├── README.md                  # Documentación general del repositorio
│
├── backend/                   # Capa de Negocio, Datos y API REST
│   ├── app/
│   │   ├── blueprints/        # Endpoints (api y health check)
│   │   ├── models/            # Modelos SQLAlchemy (Producto, Pedido, Cuenta, etc.)
│   │   ├── config.py          # Configuración y variables de entorno
│   │   ├── database.py        # Instancia de SQLAlchemy (db)
│   │   └── services.py        # Consultas a PostgreSQL y lógica de negocio
│   ├── migrations/            # Historial de migraciones con Alembic
│   ├── templates/             # Plantillas para correos transaccionales
│   ├── alembic.ini            # Configuración de migraciones
│   ├── requirements.txt       # Dependencias de Python
│   ├── seed.py                # Script de poblamiento inicial de productos
│   ├── run.py                 # Punto de entrada de Flask
│   ├── Dockerfile             # Imagen Docker del Backend
│   └── .dockerignore          # Exclusiones específicas del backend (.venv, pycache)
│
└── frontend/                  # Capa de Presentación e Interacción (React)
    ├── public/                # Archivo base index.html y recursos estáticos
    ├── src/
    │   ├── assets/            # Estilos globales y tokens CSS
    │   ├── config/            # Configuración centralizada de API (api.js)
    │   ├── services/          # Servicios HTTP modulares (productService, orderService)
    │   ├── components/        # Componentes UI (Navbar, Hero, ProductCard, CartDrawer...)
    │   ├── hooks/             # Custom Hooks (useProducts, useCart, useToast)
    │   ├── pages/             # Vistas de la aplicación (HomePage)
    │   ├── App.js             # Componente raíz
    │   └── index.js           # Montaje del DOM
    ├── package.json           # Dependencias, scripts y proxy a la API de Flask
    ├── Dockerfile             # Imagen Docker del Frontend
    └── .dockerignore          # Exclusiones específicas del frontend (node_modules, build)
```

---

## 🌐 Centralización de Rutas en el Frontend

Para evitar tener que buscar y reemplazar rutas en múltiples componentes y hooks, las peticiones HTTP están centralizadas en:

1. **[`frontend/src/config/api.js`](frontend/src/config/api.js)**:
   - Define `API_BASE_URL` leyendo la variable de entorno `REACT_APP_API_BASE_URL`.
   - Expone el diccionario `API_ENDPOINTS` con todas las rutas del sistema (productos, pedidos, autenticación).
   - Provee el helper `buildApiUrl` para formatear parámetros de consulta (*query params*).

2. **Servicios Modulares ([`frontend/src/services/`](frontend/src/services/))**:
   - [`productService.js`](frontend/src/services/productService.js): Centraliza `fetchProducts()` y `fetchProductById()`.
   - [`orderService.js`](frontend/src/services/orderService.js): Centraliza `createOrder()`.

> **¿Cómo cambiar el servidor o la versión de la API?**
> Solo necesitas cambiar la variable `REACT_APP_API_BASE_URL` en tu archivo `.env` o editar la constante en [`frontend/src/config/api.js`](frontend/src/config/api.js). Ningún hook o componente requerirá modificaciones manuales.

---

## 🐳 Puesta en Marcha con Docker (Recomendado)

Docker Compose levanta de forma coordinada la base de datos PostgreSQL, la API en Flask (con migraciones y datos semilla automáticos) y el cliente React con recarga en caliente (*hot-reload*).

### 1. Iniciar todos los servicios
Desde la raíz del proyecto ejecuta:

```bash
docker compose up --build
```

O en segundo plano (*modo detach*):
```bash
docker compose up -d --build
```

### 2. ¿Qué ocurre internamente al iniciar?
1. **`azomalli_db`**: Levanta PostgreSQL 16 y realiza comprobaciones de salud (*healthcheck*). Los datos se guardan en el volumen `postgres_data`.
2. **`azomalli_backend`**: Espera a que la base de datos esté lista, ejecuta automáticamente `alembic upgrade head` para crear las tablas, ejecuta `seed.py` para poblar el catálogo de productos si está vacío, e inicia el servidor Flask en `http://localhost:5000`.
3. **`azomalli_frontend`**: Instala dependencias e inicia el servidor de desarrollo en `http://localhost:3000`.

### 3. Acceso a la aplicación
* **Frontend Web (React):** [http://localhost:3000](http://localhost:3000)
* **API Backend (Health Check):** [http://localhost:5000/](http://localhost:5000/)
* **Catálogo API (JSON):** [http://localhost:5000/api/products](http://localhost:5000/api/products)

### 4. Comandos útiles de Docker Compose
```bash
# Ver logs en tiempo real de todos los servicios
docker compose logs -f

# Ver logs únicamente del backend
docker compose logs -f backend

# Detener los contenedores conservando los datos de la BD
docker compose down

# Detener y eliminar volúmenes (reinicia la BD limpia desde cero)
docker compose down -v
```

---

## 💻 Puesta en Marcha Local (Sin Docker)

Si prefieres ejecutar el proyecto de forma manual en tu máquina local:

### Prerrequisitos
* **Python 3.10+**
* **Node.js 18+** y **npm**
* Servidor **PostgreSQL** corriendo localmente

### 1. Configurar y Levantar el Backend (Flask API)
```bash
cd backend
python -m venv .venv

# Activar venv (Windows):
.\.venv\Scripts\Activate.ps1
# Activar venv (macOS/Linux):
source .venv/bin/activate

pip install -r requirements.txt
```

Configura tu archivo `backend/.env`:
```env
DATABASE_URL=postgresql+psycopg://tu_usuario:tu_contraseña@localhost:5432/Azomalli
SECRET_KEY=clave_secreta_local
FLASK_APP=run.py
FLASK_DEBUG=1
```

Ejecuta migraciones, poblamiento de prueba e inicia el servidor:
```bash
alembic upgrade head
python seed.py
flask --app run.py run --debug
```

### 2. Configurar y Levantar el Frontend (React)
En una segunda terminal:
```bash
cd frontend
npm install
npm start
```
La aplicación abrirá automáticamente en [http://localhost:3000](http://localhost:3000).

---

## 🧪 Suite de Pruebas Automatizadas y Docker

El proyecto cuenta con una pirámide de pruebas completa (Unitarias, Integración y End-to-End con Selenium en Docker). Para consultar la documentación completa de pruebas y comandos, revisa el archivo [**`TESTS_README.md`**](TESTS_README.md).

### Comandos Rápidos de Pruebas:
```bash
# 1. Pruebas Unitarias Backend (Pytest - ~1 segundo)
pytest backend/tests/test_models.py -v

# 2. Pruebas Unitarias Frontend (React / Jest)
cd frontend && npm test

# 3. Pruebas de Integración Backend (con PostgreSQL)
pytest backend/tests/ -v

# 4. Pruebas End-to-End completas en navegador Chrome (Selenium + Docker)
docker compose -f docker-compose.e2e.yml up --build --abort-on-container-exit --exit-code-from e2e_runner
```
