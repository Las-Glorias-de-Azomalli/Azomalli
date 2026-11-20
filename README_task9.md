# feat(admin): módulos de Catálogo de productos, Agregar producto y Editar/Archivar producto

**Rama:** `feat/order-detail-screen`  
**Fecha:** 2026-11-20  
**Referencia:** `task9.md`

---

## 📋 Resumen

Implementa las pantallas y la lógica completa de administración del catálogo de productos para la panadería artesanal **Las Glorias de Azomalli**: visualización del catálogo con métricas en tiempo real, filtros y buscador, creación de nuevos productos con vista previa reactiva, edición de productos existentes y ciclo de vida de archivado/reactivación conectado directamente con la base de datos PostgreSQL (Neon Database) y sincronizado con el catálogo público y el módulo de pedidos.

### Pantallas de Figma Implementadas

| Módulo / Pantalla | Ruta Frontend | Nodo Figma |
| :--- | :--- | :--- |
| **Catálogo de productos (Admin)** | `/admin/productos` (`/admin`, `/admin/catalogo`) | `15:10955` |
| **Agregar producto** | `/admin/productos/nuevo` (`/admin/catalogo/nuevo`) | `15:11113` |
| **Editar y archivar producto** | `/admin/productos/editar/:id` (`/admin/catalogo/editar/:id`) | `15:11272` |

---

## 👤 Usuario Administrador y Control de Acceso

Para acceder a las vistas administrativas se generó y sembró una cuenta con rol `ADMINISTRADOR` en la base de datos:

| Campo | Valor |
| :--- | :--- |
| **Correo electrónico** | `admin@azomalli.com` |
| **Contraseña** | `Admin123!` |
| **Nombre** | `Administradora Azomalli` |
| **Rol** | `ADMINISTRADOR` |

### Comportamiento de Autenticación y Autorización
1. **Redirección automática al iniciar sesión (`LoginPage.js`)**: Si el usuario autenticado tiene rol `ADMINISTRADOR`, es redirigido directamente a `/admin/productos`. Si es `CLIENTE`, es redirigido a la tienda pública (`/`).
2. **Protección de rutas administrativas (`AdminCatalogPage.js`, `AdminProductCreatePage.js`, `AdminProductEditPage.js`)**:
   - Usuarios no autenticados son redirigidos a `/login`.
   - Usuarios autenticados con rol distinto a `ADMINISTRADOR` son redirigidos a `/`.
3. **Acceso desde la barra de navegación (`Navbar.js`)**: Cuando hay una sesión activa con rol `ADMINISTRADOR`, se muestra el enlace **Administración** en el Navbar principal y la opción **Panel de administración** en el menú desplegable de perfil.
4. **Protección en Backend (`products/routes.py`)**: Las operaciones de escritura (`POST`, `PUT`, `PATCH`, `DELETE`) validan que, cuando se envía un token JWT, el rol corresponda a `ADMINISTRADOR` (retornando `403 Forbidden` a cuentas `CLIENTE`).

---

## ⚙️ Cambios en el Backend (`backend/`)

### 1. Endpoints CRUD de Productos (`backend/app/blueprints/products/routes.py`)
- **`GET /api/products`**:
  - Soporta filtrado por estado: `?status=active`, `?status=archived`, `?status=all` (o `?include_archived=true`). Por defecto retorna únicamente productos activos para la tienda pública.
  - Soporta filtrado por categoría (`?category=DULCE|SALADO`), temporada (`?filter=seasonal`) y búsqueda por texto o código (`?search=PAN-001` o nombre/descripción).
- **`GET /api/products/<int:producto_id>`**:
  - Obtiene el detalle completo de un producto por ID (permitiendo `include_archived=true` para cargar productos archivados en la pantalla de edición).
- **`POST /api/products`**:
  - Crea un nuevo producto validando campos obligatorios (`nombre`, `descripcion`, `precio_unitario > 0`, `categoria` en `DULCE`/`SALADO`) y almacenando metadatos adicionales en formato JSONB (`sabor`, `unidad`, `peso`, `ingredientes`, `alergenos`, `distintivos`).
- **`PUT / PATCH /api/products/<int:producto_id>`**:
  - Actualiza los atributos principales y metadatos JSONB de un producto existente.
- **`POST / PATCH /api/products/<int:producto_id>/archive`** y **`DELETE /api/products/<int:producto_id>`**:
  - Archiva lógicamente un producto (`activo = False`), retirándolo del catálogo público sin eliminar los registros ni afectar el historial de pedidos que lo incluyen.
- **`POST / PATCH /api/products/<int:producto_id>/restore`**:
  - Reactiva un producto previamente archivado (`activo = True`), volviéndolo visible inmediatamente en la tienda pública.

### 2. Visualización Global de Pedidos para Administrador (`backend/app/blueprints/orders/routes.py`)
- **`GET /api/orders`**:
  - Se añadió `_is_admin_user()` y el parámetro `include_all=True` en `get_orders_by_user()` (`backend/app/services.py`).
  - Cuando consulta un cliente (`CLIENTE`), retorna únicamente sus propios pedidos.
  - Cuando consulta el administrador (`ADMINISTRADOR`), retorna todos los pedidos realizados por los usuarios en el sistema.

### 3. Modelo y Semilla de Datos
- **`backend/app/models/producto.py`**: `to_dict()` expone de forma transparente las propiedades adicionales almacenadas en el campo JSONB (`unidad`, `peso`, `ingredientes`, `alergenos`, `distintivos`).
- **`backend/seed.py`**: Registra de manera idempotente la cuenta administradora `admin@azomalli.com` (`Admin123!`) junto con su entidad `Persona`.

---

## 🎨 Cambios en el Frontend (`frontend/`)

### Nuevos Componentes y Páginas
- **`frontend/src/components/AdminSidebar.js`**: Barra lateral de navegación administrativa con identidad de marca, etiqueta `ADMINISTRACIÓN`, enlaces a *Dashboard*, *Catálogo*, *Pedidos e historial*, *Clientes* y acceso directo a *Ver tienda pública* (`/`).
- **`frontend/src/components/AdminTopBar.js`**: Barra superior del panel con ruta de navegación (*breadcrumb*) e indicador de sesión activa de la administradora.
- **`frontend/src/pages/AdminCatalogPage.js`** *(Figma `15:10955`)*:
  - Tarjetas de métricas conectadas a la BD: **Productos activos**, **Productos archivados** y **Categorías**.
  - Pestañas reactivas `Activos (N)` y `Archivados (N)`.
  - Buscador en tiempo real por nombre, descripción o código (`PAN-XXX`) y selector de categoría (`Todas las categorías`, `Pan dulce`, `Pan salado`).
  - Tabla de productos con miniatura, código `PAN-XXX`, insignia `De temporada`, categoría, precio formateado, estado de disponibilidad y botones de **Editar** y **Archivar / Reactivar**.
- **`frontend/src/pages/AdminProductCreatePage.js`** *(Figma `15:11113`)*:
  - Formulario estructurado en paneles: *Información del producto*, *Disponibilidad y características*, *Ingredientes y alérgenos*, y *Fotografía del producto*.
  - Tarjeta de **Vista previa de la ficha** que se actualiza en tiempo real conforme se escribe el nombre, descripción, categoría, unidad, disponibilidad y precio.
- **`frontend/src/pages/AdminProductEditPage.js`** *(Figma `15:11272`)*:
  - Carga desde la base de datos y pre-llenado de todos los campos y metadatos del producto (`PAN-XXX`).
  - Panel de **Publicación actual** con estado (`Activo` / `Archivado`) y precio.
  - Panel visible de confirmación **`¿Archivar <Producto>?`** (o reactivación si ya está archivado) explicando que el historial de pedidos se conserva intacto.

### Archivos de Configuración, Servicios y Estilos Modificados
- **`frontend/src/config/api.js`**: Rutas centralizadas `CREATE`, `UPDATE`, `ARCHIVE`, `RESTORE` y `DELETE` en `API_ENDPOINTS.PRODUCTS`.
- **`frontend/src/services/productService.js`**: Funciones `createProduct`, `updateProduct`, `archiveProduct`, `restoreProduct`, `deleteProduct` con envío automático del encabezado `Authorization: Bearer <token>`, además de soporte de parámetros `status`, `search` e `includeArchived` en `fetchProducts` y `fetchProductById`.
- **`frontend/src/components/ProductCustomizationModal.js`**: Filtrado de claves de metadatos administrativos (`unidad`, `peso`, `ingredientes`, `alergenos`, `distintivos`) al extraer opciones de sabor en el modal de personalización.
- **`frontend/src/App.js`**: Registro de rutas `/admin`, `/admin/productos`, `/admin/catalogo`, `/admin/productos/nuevo` y `/admin/productos/editar/:id`.
- **`frontend/src/assets/styles/styles.css`**: Estilos modulares y responsivos para el layout administrativo, tablas, métricas, formularios, vista previa y panel de confirmación de archivo.

---

## 🧪 Pruebas Automatizadas Agregadas

De acuerdo con `TESTS_README.md`, se agregaron pruebas en los tres niveles de la pirámide:

### 1. Integración Backend (`backend/tests/`)
- **`backend/tests/test_api_products.py`**:
  - `test_create_product_success_and_validation`: creación exitosa con JSONB y validación de errores `400` (nombre faltante, precio faltante/negativo, categoría inválida).
  - `test_update_product_success_and_errors`: edición de producto, manejo de `404` y validación de nombre vacío (`400`).
  - `test_archive_and_restore_product_lifecycle`: ciclo completo de producto activo → archivado (oculto del catálogo público, visible en `?status=archived`) → reactivado (visible nuevamente en el catálogo público).
  - `test_search_and_filter_products`: búsqueda por término de texto y por código `PAN-XXX`.
  - `test_admin_role_authorization_for_product_crud`: verificación de permisos `403 Forbidden` para rol `CLIENTE` y `201/200` para rol `ADMINISTRADOR`.
- **`backend/tests/test_api_orders.py`**:
  - Verificación de que el rol `ADMINISTRADOR` visualiza todos los pedidos de los clientes en `GET /api/orders` y puede consultar sus detalles en `GET /api/orders/<id>`.

### 2. Unitarias Frontend (`frontend/src/__tests__/`)
- **`AdminCatalogPage.test.js`**: renderizado de métricas, alternancia entre pestañas Activos/Archivados, filtrado por búsqueda y categoría, archivado de productos, navegación a edición y restricción de acceso a usuarios no administradores.
- **`AdminProductCreatePage.test.js`**: renderizado del formulario, actualización reactiva de la tarjeta de vista previa, validación de campos obligatorios y publicación exitosa con redirección.
- **`AdminProductEditPage.test.js`**: precarga de datos del producto, guardado de cambios y confirmación de archivado desde el panel lateral.

### 3. End-to-End con Playwright (`tests_e2e/`)
- **`tests_e2e/test_admin_products.py`**:
  - `E2E-ADMIN-01`: Inicio de sesión como administrador (`admin@azomalli.com`) y visualización del catálogo (`15:10955`), métricas y tabla.
  - `E2E-ADMIN-02`: Filtros reactivos por buscador y cambio entre pestañas Activos y Archivados.
  - `E2E-ADMIN-03`: Flujo de creación de producto (`15:11113`), actualización de vista previa y publicación en el catálogo.
  - `E2E-ADMIN-04`: Flujo de edición y panel de confirmación de archivado (`15:11272`).

### Resultados de Ejecución
| Suite | Resultado | Estado |
| :--- | :---: | :---: |
| **Backend (`pytest backend/tests/ -v`)** | **24 / 24** | ✅ PASS |
| **Frontend (`npm test -- --watchAll=false`)** | **52 / 52 (12 suites)** | ✅ PASS |
| **E2E (`tests_e2e/test_admin_products.py`)** | **4 nuevos escenarios E2E** | ✅ LISTO |
