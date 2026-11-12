import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { fetchOrderById } from '../services/orderService';
import { DEMO_ORDERS, formatOrderDate, formatPrice, getStatusInfo } from './OrdersPage';

export function OrderDetailPage({
  orderId,
  cartCount = 0,
  onOpenCart,
  onNavigate
}) {
  const { user, token } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadOrder() {
      try {
        setLoading(true);
        setError(null);

        // Si existe un orderId numérico o con prefijo
        const numericId = parseInt(String(orderId || '').replace(/\D/g, ''), 10) || 1048;

        try {
          const apiOrder = await fetchOrderById(numericId, token);
          if (isMounted && apiOrder) {
            setOrder(apiOrder);
            return;
          }
        } catch {
          // Si la API falla o el pedido no existe en backend (ej. demo 1048/1044/1038)
        }

        // Buscar en DEMO_ORDERS
        const demoMatch = DEMO_ORDERS.find(
          (o) =>
            o.pedido_id === numericId ||
            o.codigo_pedido === `AG-${numericId}` ||
            String(o.pedido_id) === String(orderId)
        );

        if (isMounted) {
          if (demoMatch) {
            setOrder(demoMatch);
          } else if (DEMO_ORDERS.length > 0) {
            setOrder(DEMO_ORDERS[0]);
          } else {
            setError('Pedido no encontrado.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Error al cargar el pedido.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [orderId, token]);

  const items = useMemo(() => {
    if (!order || !order.detalles) return [];
    return order.detalles;
  }, [order]);

  const totalPiezas = useMemo(() => {
    if (!order) return 0;
    if (order.total_piezas) return order.total_piezas;
    return items.reduce((acc, d) => acc + (d.cantidad || 1), 0);
  }, [order, items]);

  const totalProductos = items.length;

  if (loading) {
    return (
      <div className="azomalli-app order-detail-view">
        <Navbar cartCount={cartCount} onOpenCart={onOpenCart} onNavigate={onNavigate} />
        <main className="order-detail-main">
          <div className="order-detail-container loading-state">
            <p>Cargando detalles del pedido...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="azomalli-app order-detail-view">
        <Navbar cartCount={cartCount} onOpenCart={onOpenCart} onNavigate={onNavigate} />
        <main className="order-detail-main">
          <div className="order-detail-container not-found-state">
            <h2>Pedido no encontrado</h2>
            <p>No se encontró la información del pedido solicitado.</p>
            <button
              type="button"
              className="btn-back-to-orders"
              onClick={() => onNavigate && onNavigate('/pedidos')}
            >
              Volver a Mis pedidos
            </button>
          </div>
        </main>
      </div>
    );
  }

  const st = getStatusInfo(order.estado);
  const formattedCode = order.codigo_pedido || `AG-${String(order.pedido_id).padStart(4, '0')}`;
  const buyerName =
    order.cliente_nombre ||
    (user ? user.nombre || user.email : 'Ana · Demo');

  return (
    <div className="azomalli-app order-detail-view">
      <Navbar cartCount={cartCount} onOpenCart={onOpenCart} onNavigate={onNavigate} />

      <main className="order-detail-main">
        <div className="order-detail-container">
          {/* Enlace Volver a Mis pedidos (Figma 81:1847) */}
          <button
            type="button"
            className="btn-back-to-orders"
            id="back-to-orders-btn"
            onClick={() => onNavigate && onNavigate('/pedidos')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Volver a Mis pedidos</span>
          </button>

          {/* Encabezado del pedido (Figma 81:1850) */}
          <div className="order-detail-header">
            <div className="order-header-texts">
              <span className="order-detail-eyebrow">CADA DETALLE, HECHO CON CARIÑO</span>
              <h1 className="order-detail-title">Pedido {formattedCode}</h1>
              <p className="order-detail-subtitle">
                Tu selección y los detalles de entrega, en un solo lugar.
              </p>
            </div>

            <div className="order-header-status-badge">
              <span className={`status-pill ${st.badgeClass}`}>{st.label}</span>
            </div>
          </div>

          {/* Estado de preparación / Banner de seguimiento (Figma 81:1857) */}
          <div className="order-status-banner-card">
            <div className="chef-icon-circle">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9C291D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 13.8a4.5 4.5 0 1 1 8.2-2.6 4.5 4.5 0 0 1 7.8 3.8A4.5 4.5 0 0 1 18 19H6a4 4 0 0 1 0-8c.3 0 .7 0 1 .1"></path>
                <line x1="6" y1="19" x2="18" y2="19"></line>
              </svg>
            </div>

            <div className="status-banner-info">
              <h2 className="status-banner-headline">{st.label}</h2>
              <p className="status-banner-caption">
                Así aparece este pedido en tu historial de demostración.
              </p>
            </div>

            <div className="status-banner-date-box">
              <span className="registered-delivery-label">ENTREGA REGISTRADA</span>
              <strong className="registered-delivery-date">
                {formatOrderDate(order.fecha_entrega)}
              </strong>
            </div>
          </div>

          {/* Información general (Figma 81:1866) */}
          <div className="order-info-card">
            <h3 className="order-info-title">Información del pedido</h3>

            <div className="order-info-grid-row">
              <div className="info-cell">
                <span className="info-cell-label">Cuenta del comprador</span>
                <strong className="info-cell-value">{buyerName}</strong>
              </div>

              <div className="info-cell">
                <span className="info-cell-label">Fecha de pedido</span>
                <strong className="info-cell-value">{formatOrderDate(order.fecha_pedido)}</strong>
              </div>

              <div className="info-cell">
                <span className="info-cell-label">Fecha de entrega</span>
                <strong className="info-cell-value">{formatOrderDate(order.fecha_entrega)}</strong>
              </div>
            </div>

            <div className="info-card-separator" />

            <div className="order-info-grid-row">
              <div className="info-cell">
                <span className="info-cell-label">Lugar de entrega</span>
                <strong className="info-cell-value">{order.lugar_entrega || 'Panadería'}</strong>
                <span className="info-cell-hint">Recogida sin costo</span>
              </div>

              <div className="info-cell">
                <span className="info-cell-label">Método de pago</span>
                <strong className="info-cell-value">{order.pago || 'Efectivo'}</strong>
                <span className="info-cell-hint">Método registrado; no indica el estado del pago.</span>
              </div>

              <div className="info-cell">
                <span className="info-cell-label">Contenido del pedido</span>
                <strong className="info-cell-value">
                  {totalProductos} {totalProductos === 1 ? 'producto' : 'productos'} · {totalPiezas} {totalPiezas === 1 ? 'pieza' : 'piezas'}
                </strong>
                <span className="info-cell-hint">Importes en pesos mexicanos (MXN).</span>
              </div>
            </div>
          </div>

          {/* Lo que elegiste / Productos del pedido (Figma 81:1892) */}
          <div className="order-items-section">
            <div className="items-section-header">
              <h2 className="items-section-title">Lo que elegiste</h2>
              <span className="items-section-subtitle">Personalización conservada por producto</span>
            </div>

            <div className="items-table-header">
              <span className="col-prod">PRODUCTO</span>
              <span className="col-qty">CANTIDAD</span>
              <span className="col-price">PRECIO UNITARIO</span>
              <span className="col-subtotal">IMPORTE</span>
            </div>

            <div className="items-table-body">
              {items.map((item, idx) => {
                const isCustomized =
                  item.sabor ||
                  item.topping ||
                  item.relleno ||
                  item.notas ||
                  item.producto_es_personalizable;

                const saborVal = item.sabor ? item.sabor.opcion || item.sabor.sabor || item.sabor : null;
                const toppingVal = item.topping ? item.topping.opcion || item.topping.topping || item.topping : null;
                const rellenoVal = item.relleno ? item.relleno.opcion || item.relleno.relleno || item.relleno : null;
                const notasVal = item.notas || null;

                const itemSubtotal = item.subtotal || (item.cantidad * item.precio_unitario);
                const tag = item.producto_categoria === 'SALADO' ? 'Pan salado' : 'Pan dulce';
                const tagFull = isCustomized && (saborVal || toppingVal || rellenoVal) ? `${tag} · Personalizado` : tag;

                // Cálculo visual de desglose base + extras si aplica
                let breakdownNote = 'Sin personalización';
                if (isCustomized && (saborVal || toppingVal || rellenoVal)) {
                  const basePrice = item.producto_precio_base || item.precio_unitario;
                  if (toppingVal && toppingVal !== 'Sin topping') {
                    breakdownNote = `Base $${basePrice.toFixed(2)} + topping ${toppingVal} $3.00`;
                  } else {
                    breakdownNote = `Base $${basePrice.toFixed(2)}`;
                  }
                }

                return (
                  <div key={item.detalle_pedido_id || idx} className="order-item-card">
                    <div className="item-main-row">
                      <div className="item-identity-cell">
                        <img
                          src={item.producto_imagen_url || '/images/placeholder.svg'}
                          alt={item.producto_nombre || 'Pan artesanal'}
                          className="item-photo"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/images/placeholder.svg';
                          }}
                        />
                        <div className="item-text-info">
                          <h4 className="item-name">{item.producto_nombre || 'Pan artesanal'}</h4>
                          <span className="item-tag-text">{tagFull}</span>
                          <span className="item-breakdown-text">{breakdownNote}</span>
                        </div>
                      </div>

                      <span className="item-qty-cell">{item.cantidad}</span>
                      <span className="item-price-cell">{formatPrice(item.precio_unitario)}</span>
                      <span className="item-subtotal-cell">{formatPrice(itemSubtotal)}</span>
                    </div>

                    {/* Caja de personalización del renglón */}
                    <div className="item-customization-box">
                      <div className="custom-options-row">
                        <div className="custom-opt-field">
                          <span className="opt-label">Sabor</span>
                          <strong className="opt-val">{saborVal || 'No aplica'}</strong>
                        </div>
                        <div className="custom-opt-field">
                          <span className="opt-label">Topping</span>
                          <strong className="opt-val">{toppingVal || 'No aplica'}</strong>
                        </div>
                        <div className="custom-opt-field">
                          <span className="opt-label">Relleno</span>
                          <strong className="opt-val">{rellenoVal || 'No aplica'}</strong>
                        </div>
                      </div>

                      <div className="custom-notes-field">
                        <span className="opt-label">Notas específicas</span>
                        <p className="notes-val-text">
                          {notasVal || 'Sin notas adicionales.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cierre del pedido (Figma 81:1976) */}
          <div className="order-closing-row">
            <div className="closing-quote-card">
              <h3 className="closing-quote-title">Un pequeño gusto. Un gran momento.</h3>
              <p className="closing-quote-desc">
                Pedido histórico de demostración. La fecha de entrega y el estado{' '}
                <strong>{st.label}</strong> se muestran tal como están registrados, sin actualizarse por la fecha actual.
              </p>
            </div>

            <aside className="closing-total-card">
              <div className="total-calc-line">
                <span className="calc-title">Subtotal · {totalPiezas} {totalPiezas === 1 ? 'pieza' : 'piezas'}</span>
                <span className="calc-val">{formatPrice(order.monto_total)}</span>
              </div>

              <div className="total-calc-line">
                <span className="calc-title">Recogida en panadería</span>
                <span className="calc-val val-free">Sin costo</span>
              </div>

              <div className="total-card-separator" />

              <div className="total-grand-line">
                <span className="grand-title">Total general</span>
                <strong className="grand-val">
                  {formatPrice(order.monto_total)} <span className="currency-pill">MXN</span>
                </strong>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <footer className="order-detail-footer">
        <span className="footer-title">De nuestras manos a tu mesa.</span>
        <span className="footer-credits">Las Glorias de Azomalli · Datos de demostración · MXN</span>
      </footer>
    </div>
  );
}

export default OrderDetailPage;