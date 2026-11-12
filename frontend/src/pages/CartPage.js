import React from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export function CartPage({
  cart,
  totalCount,
  totalAmount,
  onUpdateQuantity,
  onRemoveItem,
  onEditCustomization,
  onOpenCart,
  onNavigate
}) {
  const { isAuthenticated } = useAuth();

  const handleContinueCheckout = () => {
    if (!isAuthenticated) {
      onNavigate && onNavigate('/login');
      return;
    }
    onNavigate && onNavigate('/checkout');
  };

  return (
    <div className="azomalli-app cart-page-view">
      <Navbar cartCount={totalCount} onOpenCart={onOpenCart} onNavigate={onNavigate} />

      <main className="cart-page-main">
        <div className="cart-page-container">
          {/* Encabezado de página */}
          <div className="cart-page-header">
            <div className="cart-header-text">
              <span className="cart-eyebrow">PARA COMPARTIR. PARA DISFRUTAR.</span>
              <h1 className="cart-page-title">Tu carrito</h1>
              <p className="cart-page-subtitle">
                {totalCount} {totalCount === 1 ? 'pieza elegida' : 'piezas elegidas'} con cariño. Revisa tu selección antes de continuar.
              </p>
            </div>
            <button
              type="button"
              className="cart-continue-shopping-btn"
              id="continue-shopping-btn"
              onClick={() => onNavigate && onNavigate('/')}
            >
              <span>Seguir comprando</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </button>
          </div>

          {/* Grid de productos y resumen */}
          <div className="cart-layout-grid">
            {/* Columna Izquierda: Lista de productos */}
            <section className="cart-items-section" aria-label="Lista de productos en el carrito">
              <div className="cart-table-header">
                <span className="col-product">PRODUCTO</span>
                <span className="col-quantity">CANTIDAD</span>
                <span className="col-amount">IMPORTE</span>
              </div>

              {cart.length === 0 ? (
                <div className="cart-empty-box">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#79685C" strokeWidth="1.5">
                    <circle cx="8" cy="21" r="1"></circle>
                    <circle cx="19" cy="21" r="1"></circle>
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                  </svg>
                  <p className="cart-empty-text">Tu carrito está vacío.</p>
                  <button
                    type="button"
                    className="btn-primary-azomalli"
                    onClick={() => onNavigate && onNavigate('/')}
                  >
                    Explorar catálogo
                  </button>
                </div>
              ) : (
                <div className="cart-items-list" id="cart-page-items-list">
                  {cart.map((item) => {
                    const itemId = item.cartItemId || item.producto_id;
                    const itemTotal = (Number(item.precio_unitario ?? 0) * item.quantity).toFixed(2);
                    const hasCustomization = Boolean(
                      item.sabor || item.topping || item.relleno || item.notas
                    );

                    const saborText =
                      item.sabor?.opcion || item.sabor?.sabor || (typeof item.sabor === 'string' ? item.sabor : null);
                    const toppingText =
                      item.topping?.opcion || item.topping?.topping || (typeof item.topping === 'string' ? item.topping : null);
                    const rellenoText =
                      item.relleno?.opcion || item.relleno?.relleno || (typeof item.relleno === 'string' ? item.relleno : null);

                    const categoryText = item.categoria === 'SALADO' ? 'Pan salado' : 'Pan dulce';

                    return (
                      <article key={itemId} className="cart-item-card" data-cart-item-id={itemId}>
                        <div className="cart-item-main-row">
                          <img
                            src={item.imagen_url || '/images/placeholder.svg'}
                            alt={item.nombre}
                            className="cart-pan-thumb"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/images/placeholder.svg';
                            }}
                          />

                          <div className="cart-pan-info">
                            <h3 className="cart-pan-name">{item.nombre}</h3>
                            <span className="cart-pan-meta">
                              {categoryText} · ${Number(item.precio_unitario ?? 0).toFixed(2)} / pieza
                            </span>
                            <button
                              type="button"
                              className="cart-pan-remove-btn"
                              onClick={() => onRemoveItem && onRemoveItem(itemId)}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                              <span>Quitar producto</span>
                            </button>
                          </div>

                          <div className="cart-qty-pill">
                            <button
                              type="button"
                              className="qty-arrow-btn btn-minus"
                              onClick={() => onUpdateQuantity && onUpdateQuantity(itemId, -1)}
                              aria-label="Disminuir cantidad"
                            >
                              -
                            </button>
                            <span className="qty-number">{item.quantity}</span>
                            <button
                              type="button"
                              className="qty-arrow-btn btn-plus"
                              onClick={() => onUpdateQuantity && onUpdateQuantity(itemId, 1)}
                              aria-label="Aumentar cantidad"
                            >
                              +
                            </button>
                          </div>

                          <div className="cart-pan-subtotal">${itemTotal}</div>
                        </div>

                        {/* Caja de personalización según Figma */}
                        {hasCustomization && (
                          <div className="cart-customization-box">
                            <div className="cart-customization-head">
                              <span className="custom-box-title">PERSONALIZACIÓN</span>
                              {onEditCustomization && (
                                <button
                                  type="button"
                                  className="btn-edit-customization"
                                  onClick={() => onEditCustomization(item)}
                                >
                                  Editar personalización
                                </button>
                              )}
                            </div>

                            <div className="cart-custom-details-list">
                              {saborText && (
                                <div className="custom-detail-row">
                                  <span className="custom-detail-label">Sabor</span>
                                  <span className="custom-detail-value">{saborText}</span>
                                </div>
                              )}
                              {toppingText && (
                                <div className="custom-detail-row">
                                  <span className="custom-detail-label">Topping</span>
                                  <span className="custom-detail-value">{toppingText}</span>
                                </div>
                              )}
                              {rellenoText && (
                                <div className="custom-detail-row">
                                  <span className="custom-detail-label">Relleno</span>
                                  <span className="custom-detail-value">{rellenoText}</span>
                                </div>
                              )}
                              {item.notas && (
                                <div className="custom-detail-notes">
                                  <span className="custom-detail-label">Notas adicionales</span>
                                  <p className="custom-detail-notes-text">{item.notas}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}

              <div className="cart-artisan-note">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#79685C" strokeWidth="2">
                  <path d="M2 22 12 12"></path>
                  <path d="m9 15 3-3"></path>
                  <path d="m15 9 3-3"></path>
                  <circle cx="17" cy="7" r="5"></circle>
                </svg>
                <span>Cada pieza se prepara de manera artesanal. La disponibilidad se confirma al realizar tu pedido.</span>
              </div>
            </section>

            {/* Columna Derecha: Panel de Resumen del Pedido */}
            <aside className="cart-summary-panel">
              <h2 className="summary-title">Resumen del pedido</h2>

              <div className="summary-row">
                <span className="summary-label">Subtotal · {totalCount} piezas</span>
                <span className="summary-value">${totalAmount.toFixed(2)}</span>
              </div>

              <div className="summary-row">
                <span className="summary-label">Recogida en panadería</span>
                <span className="summary-value value-free">Sin costo</span>
              </div>

              <div className="summary-divider" />

              <div className="summary-row total-row">
                <span className="total-label">Total</span>
                <span className="total-amount">${totalAmount.toFixed(2)}</span>
              </div>

              <p className="summary-disclaimer">
                Importes en pesos mexicanos (MXN). Precios de demostración; impuestos incluidos.
              </p>

              <button
                type="button"
                className="btn-continue-order"
                id="continue-order-btn"
                disabled={cart.length === 0}
                onClick={handleContinueCheckout}
              >
                <span>Continuar pedido</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </button>

              <div className="summary-footer-hint">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#79685C" strokeWidth="2">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                <span>En el siguiente paso acordarás la fecha de recogida antes de confirmar.</span>
              </div>
            </aside>
          </div>

          {/* Cierre artesanal */}
          <div className="cart-closing-banner">
            <div className="closing-text">
              <h3 className="closing-headline">Un pequeño gusto. Un gran momento.</h3>
              <p className="closing-subline">Tu selección se conserva en tu cuenta mientras decides qué compartir.</p>
            </div>
            <span className="closing-tag">Compra de demostración</span>
          </div>
        </div>
      </main>

      <footer className="cart-page-footer">
        <span className="footer-title">De nuestras manos a tu mesa.</span>
        <span className="footer-credits">Las Glorias de Azomalli · Datos de demostración · MXN</span>
      </footer>
    </div>
  );
}
