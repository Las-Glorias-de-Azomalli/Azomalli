# Las Glorias de Azomalli · E-commerce de Panadería Artesanal

Primer esqueleto funcional del proyecto de e-commerce para la panadería artesanal **"Las Glorias de Azomalli"**..

---

## 📋 Cumplimiento de Requisitos

1. **Header y Barra de Navegación:**
   - **Nombre de la panadería:** *"Las Glorias de Azomalli"* con su logo.
   - **Catálogo:** Enlace con scroll automático hacia la sección del catálogo en la misma página.
   - **Ícono de carrito:** Al hacer clic, despliega un **drawer lateral** con cantidades editables (+ / -), opción de eliminar producto, cálculo de subtotal y botón de confirmación de encargo.

2. **Catálogo con tres secciones:**
   - **Productos más vendidos**.
   - **Productos de temporada**.
   - **Todos los productos**.

3. **Componentes:**
   - `<product-card>` ([`ProductCard`](file:///D:/Cursos/Azomalli/static/js/components/product-card.js)): Web Component que encapsula la imagen, precio en MXN, etiqueta de ocasión, descripción y botón interactivo con feedback táctil y emisión de eventos `add-to-cart`.
   - `<cart-drawer>` ([`CartDrawer`](file:///D:/Cursos/Azomalli/static/js/components/cart-drawer.js)): Web Component que gestiona el panel lateral del carrito, operaciones de cantidad y simulación de compra.

4. **Eventos de Usuario:**
   - Clic en *"Agregar al carrito"* con animación y actualización de estado.
   - Scroll automático al presionar *"Catálogo"* o *"Explorar catálogo"*.
   - Filtro por categorías de pan.
   - Control de cantidades (+ / -) y vaciado de items en el carrito.

6. **Cátalogo y Backend Flask (API REST):**
   - Tabla `Producto` en PostgreSQL gestionada con SQLAlchemy y Alembic.
   - Backend Flask modular por dominios (`products`) con endpoints REST y documentación interactiva Swagger:
     - `GET /`: Interfaz interactiva de gestión y documentación Swagger UI.
     - `GET /api/products`: Devuelve el catálogo consultado directamente de PostgreSQL (soporta filtros por `category` y `filter=seasonal`).
     - `GET /api/products/<id>`: Devuelve el detalle de un producto específico por su ID.
   - Dependencias fijadas en `requirements.txt`.

---

## 🗄️ Base de Datos (PostgreSQL)

El proyecto utiliza **PostgreSQL** como motor de base de datos, **SQLAlchemy** como ORM y **Alembic** para el control de migraciones.

### Modelo de datos

| Tabla                | Descripción                                        |
|----------------------|----------------------------------------------------|
| `Persona`            | Datos personales del usuario                       |
| `Cuenta`             | Credenciales, rol y relación 1-a-1 con `Persona`  |
| `Producto`           | Catálogo de productos de panadería                 |
| `Pedido`             | Pedido general de un cliente                       |
| `DetallePedido`      | Líneas individuales de cada pedido                 |
| `TokenRecuperacion`  | Tokens de un solo uso para recuperar contraseña    |

### ENUMs de PostgreSQL

- `categoria_producto`: `DULCE`, `SALADO`
- `estado_pedido`: `PENDIENTE`, `ENTREGADO`, `CANCELADO`
- `metodo_de_pago`: `EFECTIVO`, `TRANSFERENCIA`
- `rol_de_usuario`: `CLIENTE`, `ADMINISTRADOR`

### Estructura de archivos de base de datos

```
app/
├── config.py          # Configuración (lee variables de entorno)
├── database.py        # Instancia de SQLAlchemy (db)
└── models/
    ├── __init__.py            # Importa todos los modelos
    ├── enums.py               # Enums Python (espejo de los ENUMs de PG)
    ├── persona.py             # Modelo Persona
    ├── cuenta.py              # Modelo Cuenta
    ├── producto.py            # Modelo Producto
    ├── pedido.py              # Modelo Pedido
    ├── detalle_pedido.py      # Modelo DetallePedido
    └── token_recuperacion.py  # Modelo TokenRecuperacion
migrations/
├── env.py             # Entorno de Alembic (integrado con Flask)
├── versions/          # Archivos de migración
│   └── 2b0175fafb56_crear_tablas_iniciales.py
└── ...
alembic.ini            # Configuración de Alembic
.env.example           # Plantilla de variables de entorno
```

---

## Cómo Ejecutar el Proyecto

### 1. Clonar y crear entorno virtual

```shell
git clone <url-del-repositorio>
cd Azomalli
python -m venv .venv
.\.venv\Scripts\Activate
```

### 2. Instalar dependencias

```shell
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y ajusta los valores a tu entorno local:

```shell
copy .env.example .env
```

Edita `.env` con tus credenciales de PostgreSQL:

```dotenv
DATABASE_URL=postgresql+psycopg://usuario:password@localhost:5432/nombre_base_de_datos
SECRET_KEY=clave-secreta
```

### 4. Crear la base de datos en PostgreSQL

Asegúrate de tener PostgreSQL corriendo y crea la base de datos:

```sql
CREATE DATABASE azomalli;
```

### 5. Ejecutar migraciones con Alembic

```shell
alembic upgrade head
```

Esto crea todas las tablas y tipos ENUM definidos en el esquema.

### 6. Iniciar el servidor de Flask

```shell
flask --app run.py run --debug
```

### 7. Abrir en el navegador

Visita: [http://127.0.0.1:5000](http://127.0.0.1:5000)

---

## 🔧 Comandos útiles de Alembic

| Comando | Descripción |
|---------|-------------|
| `alembic upgrade head` | Aplicar todas las migraciones pendientes |
| `alembic downgrade -1` | Revertir la última migración |
| `alembic revision --autogenerate -m "descripción"` | Generar nueva migración automáticamente |
| `alembic history` | Ver historial de migraciones |
| `alembic current` | Ver la revisión actual de la BD |
