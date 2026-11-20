# feat: flujo completo de personalización, carrito y checkout

**Commit:** `00cbaefcbdb582c393ceb862e9e512c3bc0bd34c`  
**Rama:** `feat/login-screen`  
**Fecha:** 2026-11-11 23:39:36 -0600  
**Autor:** Erick · castellanosyamil@gmail.com

---

## Resumen

Implementa el flujo completo para **completar un pedido** en la panadería Las Glorias de Azomalli: desde la selección y personalización del producto en el catálogo, pasando por el carrito, hasta la confirmación del pedido en el checkout con calendario de entrega.

Los diseños implementados corresponden a los nodos Figma:

| Pantalla | Nodo Figma |
|---|---|
| Pop-up de personalización | `25:154` |
| Carrito (Tu carrito) | `15:10487` |
| Checkout con calendario | `81:1413` |

> [!IMPORTANT]
> El flujo **solo admite pago en efectivo** y registra el pedido vinculado al usuario autenticado mediante JWT. Las opciones de personalización seleccionadas (sabor, topping, relleno, notas) se almacenan en formato JSONB en la tabla `DetallePedido`.

---

## Backend

### Nuevos archivos
- **`backend/app/blueprints/orders/routes.py`** — Blueprint `orders` con:
  - `POST /api/orders` — Crear pedido (requiere JWT). Valida cuenta, items, `fecha_entrega` y `pago=EFECTIVO`. Devuelve folio `GLO-XXXX`.
  - `GET /api/orders` — Listar pedidos del usuario autenticado.
  - `GET /api/orders/<id>` — Detalle de un pedido (propio o admin).
  - `GET /api/orders/user/<user_id>` — Pedidos de un usuario (propio o admin).
- **`backend/tests/test_api_orders.py`** — 4 tests de integración nuevos.

### Archivos modificados
- **`backend/app/services.py`**
  - `create_order()`: crea `Pedido` + `DetallePedido` con personalizaciones JSONB; calcula `monto_total` automáticamente.
  - `_normalize_jsonb_option()`: normaliza opciones (string/dict) a formato JSONB `{opcion, campo}`.
  - `get_orders_by_user()` / `get_order_by_id()`: consultas por cuenta y por ID.
  - Migrado a `db.session.get(Modelo, id)` (SQLAlchemy 2.0).
- **`backend/app/models/detalle_pedido.py`** — Columnas JSONB: `sabor`, `topping`, `relleno`, `notas (String 1000)`.
- **`backend/app/models/pedido.py`** — Relación bidireccional `detalles`; `to_dict()` incluye detalles serializados.
- **`backend/app/blueprints/auth/routes.py`** — `db.session.get` en lugar de `query.get` (deprecado).
- **`backend/app/__init__.py`** — Registro del blueprint `orders` en `/api/orders`.
- **`backend/app/swagger.py`** — Especificación Swagger actualizada con endpoints de pedidos.
- **`backend/seed.py`** — Productos con opciones de personalización (`sabor`, `topping`, `relleno`); cuenta demo `ana@example.com / Panaderia123!`.
- **`backend/tests/conftest.py`**
  - SQLite en memoria compatible con `JSONB` y `ENUM` de PostgreSQL via `@compiles`.
  - `server_default` de `fecha_expiracion` adaptado para SQLite.
  - JWT `SECRET_KEY` y `JWT_SECRET_KEY` ≥ 32 bytes.

---

## Frontend

### Nuevos archivos
- **`frontend/src/components/ProductCustomizationModal.js`** — Modal de personalización:
  - Grupos de opciones como píldoras (sabor, topping, relleno).
  - Campo de notas adicionales.
  - Costo adicional calculado dinámicamente.
  - Flujo guardar / cancelar.
- **`frontend/src/pages/CartPage.js`** — Página `/cart`:
  - Lista de items con miniaturas, cantidades y subtotales.
  - Resumen del pedido con costo de recogida y total.
  - Botón "Editar personalización" por producto personalizable.
  - Navegación a `/checkout`.
- **`frontend/src/pages/CheckoutPage.js`** — Página `/checkout`:
  - Calendario interactivo navegable por mes/día.
  - Tarjeta de fecha de entrega elegida.
  - Lugar de entrega (recogida en panadería, sin costo).
  - Método de pago en efectivo (único disponible).
  - Panel de resumen con personalizaciones conservadas.
  - Botón "Confirmar pedido" → llamada al backend → pantalla de éxito con folio `GLO-XXXX`.

### Imágenes
- `frontend/public/images/conchas.png`
- `frontend/public/images/panque_casero.png`
- `frontend/public/images/roles_canela.png`

### Archivos modificados
| Archivo | Cambio |
|---|---|
| `App.js` | Rutas `/cart` y `/checkout`; modal de edición desde `CartPage`; `handleCompleteOrder`. |
| `useCart.js` | `checkout()` serializa items con campos de personalización y llama a `orderService.placeOrder`. |
| `orderService.js` | `placeOrder(orderData)` → `POST /api/orders` con JWT Bearer. |
| `ProductCard.js` | Botón "Personalizar" condicional (`es_personalizable=true`). |
| `CatalogSection.js` | Prop `onCustomize` forwarded a `ProductCard`. |
| `Hero.js` | Prop `onViewCart` y botón "Ver carrito". |
| `HomePage.js` | Estado del modal de personalización; `handleOpenCustomize` y `handleAddToCart`. |
| `styles.css` | +1623 líneas: modal, botón personalizar, cart page, checkout, calendario, pantalla de éxito, animaciones y responsive. |

---

## Pruebas

### Resultados finales

| Suite | Tests | Estado |
|---|---|---|
| Backend `pytest` | **18 / 18** | ✅ PASS |
| Frontend Jest / RTL | **26 / 26** | ✅ PASS |
| E2E Playwright | **12 / 12** | ✅ PASS |
| **Total** | **56 / 56** | 🟢 100 % |

### Nuevos tests backend — `test_api_orders.py`
| ID | Descripción |
|---|---|
| `test_create_order_unauthorized` | `POST /api/orders` sin JWT → 401. |
| `test_create_order_missing_fields` | Payload vacío → 400 con mensaje. |
| `test_create_order_only_allows_cash` | Pago distinto a EFECTIVO → 400. |
| `test_complete_order_flow_with_customization_and_jsonb` | Flujo completo: register → login → create_order con sabor/topping/notas → verifica folio GLO y campos JSONB en respuesta. |

### Nuevos tests frontend
| Archivo | Descripción |
|---|---|
| `CartPage.test.js` | Render vacío, items con personalización, actualizar cantidad, eliminar, navegar a checkout. |
| `CheckoutPage.test.js` | Render del calendario, fecha seleccionada, método de pago en efectivo, confirmar pedido (mock). |
| `ProductCustomizationModal.test.js` | Apertura/cierre, selección de opciones, notas, guardar al carrito con datos correctos. |

### Tests E2E Playwright — `test_order_flow.py`
| ID | Descripción |
|---|---|
| `E2E-ORDER-01` | Abrir pop-up de personalización, elegir sabor, escribir notas, guardar → modal cierra, contador carrito aumenta. |
| `E2E-ORDER-02` | Navegar a `/cart` → encabezado, resumen del pedido y botón continuar visibles. |
| `E2E-ORDER-03` | Login demo → agregar producto → ir a `/checkout` → verificar calendario, fecha elegida, método en efectivo, confirmar → pantalla de éxito con folio `GLO-`. |

---

## Archivos modificados — estadísticas

```
 32 files changed, 4395 insertions(+), 138 deletions(-)
```

| Archivo | +líneas | −líneas |
|---|---|---|
| `frontend/src/assets/styles/styles.css` | +1623 | — |
| `frontend/src/pages/CheckoutPage.js` | +530 | — |
| `frontend/src/components/ProductCustomizationModal.js` | +408 | — |
| `frontend/src/pages/CartPage.js` | +280 | — |
| `backend/tests/test_api_orders.py` | +197 | — |
| `backend/app/blueprints/orders/routes.py` | +185 | — |
| `frontend/src/__tests__/CartPage.test.js` | +139 | — |
| `frontend/src/__tests__/CheckoutPage.test.js` | +135 | — |
| `frontend/src/__tests__/ProductCustomizationModal.test.js` | +122 | — |
| `frontend/src/services/orderService.js` | +113 | — |
| `frontend/src/hooks/useCart.js` | +96 | — |
| `tests_e2e/test_order_flow.py` | +95 | — |
| `frontend/src/pages/HomePage.js` | +85 | — |
| `backend/app/services.py` | +136 | −68 |
| `frontend/src/App.js` | +145 | −35 |
| `frontend/src/components/ProductCard.js` | +57 | −5 |
| `backend/tests/conftest.py` | +31 | −4 |
| `backend/tests/test_models.py` | +59 | −3 |
| `backend/app/models/pedido.py` | +16 | −5 |
| `backend/app/models/detalle_pedido.py` | +15 | — |
| *(resto de archivos)* | +145 | −18 |

---

*Generado automáticamente el 2026-11-12 · Azomalli · `Closes task7`*
