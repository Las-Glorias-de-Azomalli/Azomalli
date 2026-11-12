# Mensaje de Commit Propuesto — Task 8

```git
feat: modulo de mis pedidos (tabla y calendario), detalle de pedido y comprobacion de personalizacion

## Resumen
Implementa el flujo completo del módulo de pedidos según las pantallas oficiales
de Figma (nodos 15:10586, 81:1619, 81:1829), incorpora la conmutación entre
vistas de Tabla y Calendario interactivo, detalle de pedido con personalizaciones
conservadas, y resuelve la corrección de errores en la pantalla de home mediante
una comprobación interna que elimina el botón redundante de 'Personalizar'.

## Backend
- Modelos (Pedido y DetallePedido):
  * Pedido.to_dict(): Añadido código legible 'AG-XXXX', nombre/correo del
    comprador y total acumulado de piezas.
  * DetallePedido.to_dict(): Añadida URL de imagen del producto, categoría,
    indicador es_personalizable, precio base unitario y subtotal por renglón.
- Blueprints y Servicios:
  * services.py: get_orders_by_user() con soporte de filtrado opcional por
    estado (PENDIENTE, ENTREGADO, CANCELADO, EN CURSO) ordenado cronológicamente.
  * routes.py: Endpoint GET /api/orders con parámetro de consulta '?estado=' y
    GET /api/orders/<id> con validación de pertenencia o rol administrador.
- Tests Backend:
  * test_api_orders.py: Pruebas añadidas para filtrado de pedidos por estado
    y control de acceso entre usuarios (403 Forbidden). 19/19 PASS.

## Frontend
- Corrección de Producto Personalizable:
  * ProductCard.js: Eliminado el botón '.btn-customize-pan'. Implementada
    comprobación interna en el evento de 'Agregar al carrito': abre el modal
    de personalización si es_personalizable=true o agrega directo al carrito.
  * HomePage.js: Respaldo de la comprobación interna en handleAddToCart.
- Pantalla Mis Pedidos (OrdersPage.js):
  * Vista Tabla (Figma 15:10586): Columnas con Pedido, fechas, lugar, estado,
    pago, total y botón 'Ver detalle'.
  * Vista Calendario (Figma 81:1619): Cuadrícula mensual con navegación de
    meses (< y >), días de la semana, tarjetas de entrega en días asignados y
    sección 'También en tu historial' para entregas fuera del mes.
  * Filtros de estado reactivos: 'Todos (X)' y 'En curso (Y)'.
- Pantalla Detalle del Pedido (OrderDetailPage.js):
  * Figma 81:1829: Botón de retorno, banner de estado con icono de panadero,
    tarjeta de información general del comprador y método de pago.
  * Sección 'Lo que elegiste' con desglose de opciones guardadas (sabor,
    topping, relleno, notas) e importes unitarios/subtotales.
  * Tarjeta de cierre con total general en MXN.
- Rutas y Enlaces:
  * App.js: Integración de rutas /pedidos, /pedidos/calendario y /pedidos/:id.
  * Navbar.js: Enlaces 'Mis pedidos' en barra y menú de perfil hacia /pedidos.
  * CheckoutPage.js: Botón 'Ver mis pedidos' al confirmar la compra.
  * api.js y orderService.js: Rutas centralizadas y helpers de consulta.
- Estilos (styles.css):
  * Maquetación fiel a Figma con tokens de diseño, DM Serif Display e Inter.

## Pruebas y Cobertura
- Frontend: 9 suites y 35 pruebas unitarias/integración (Jest + RTL) al 100%.
  * ProductCard.test.js: Verificación de eliminación de botón y comprobación.
  * OrdersPage.test.js: Renderizado de tabla, filtros y calendario.
  * OrderDetailPage.test.js: Detalle completo de orden y personalizaciones.
- E2E Playwright:
  * test_order_flow.py actualizado con E2E-ORDER-01 (comprobación interna),
    E2E-ORDER-04 (tabla y calendario) y E2E-ORDER-05 (detalle del pedido).
- TESTS_README.md:
  * Documentación sincronizada con la nueva pirámide de pruebas.

Closes task8
```

---

## Comandos Git para Aplicar el Commit

```bash
# 1. Agregar todos los archivos modificados y nuevos componentes
git add TESTS_README.md \
        backend/app/blueprints/orders/routes.py \
        backend/app/models/detalle_pedido.py \
        backend/app/models/pedido.py \
        backend/app/services.py \
        backend/tests/test_api_orders.py \
        frontend/package-lock.json \
        frontend/src/App.js \
        frontend/src/__tests__/ProductCard.test.js \
        frontend/src/__tests__/OrdersPage.test.js \
        frontend/src/__tests__/OrderDetailPage.test.js \
        frontend/src/assets/styles/styles.css \
        frontend/src/components/Navbar.js \
        frontend/src/components/ProductCard.js \
        frontend/src/config/api.js \
        frontend/src/pages/CheckoutPage.js \
        frontend/src/pages/HomePage.js \
        frontend/src/pages/OrdersPage.js \
        frontend/src/pages/OrderDetailPage.js \
        frontend/src/services/orderService.js \
        tests_e2e/test_order_flow.py \
        commit_task8.md

# 2. Confirmar los cambios con el mensaje
git commit -F commit_task8.md
```
