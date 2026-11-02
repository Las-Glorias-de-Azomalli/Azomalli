import React, { useState } from 'react';

export function CartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  totalAmount,
  onCheckout
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formattedTotal = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(totalAmount || 0);

  const handleCheckoutClick = async () => {
    setIsSubmitting(true);
    try {
      await onCheckout();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cart-drawer-wrapper">
      <div
        className={`drawer-backdrop ${isOpen ? 'is-open' : ''}`}
        id="cart-backdrop"
        onClick={onClose}
      />

      <aside
        className={`drawer-panel ${isOpen ? 'is-open' : ''}`}
        aria-label="Carrito de compras"
        role="dialog"
        aria-modal="true"
      >
        <div className="drawer-header">
          <h3 className="drawer-title">Tu Cesta de Pan</h3>
          <button
            type="button"
            className="drawer-close-btn"
            id="close-cart-btn"
            onClick={onClose}
            aria-label="Cerrar carrito"
          >
            &times;
          </button>
        </div>

        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="empty-state">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#79685C"
                strokeWidth="1.5"
              >
                <circle cx="8" cy="21" r="1"></circle>
                <circle cx="19" cy="21" r="1"></circle>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
              </svg>
              <p>Tu carrito está vacío.</p>
              <small>Elige un pan recién salido del horno en nuestro catálogo.</small>
            </div>
          ) : (
            items.map((item) => {
              const itemId = item.producto_id;
              const itemName = item.nombre;
              const itemPrice = Number(item.precio_unitario ?? 0);
              const itemImage = item.imagen_url || '/images/placeholder.svg';

              return (
                <div key={itemId} className="cart-item" data-id={itemId}>
                  <img
                    src={itemImage}
                    alt={itemName}
                    className="cart-item-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/images/placeholder.svg';
                    }}
                  />
                  <div className="cart-item-info">
                    <h4 className="cart-item-name">{itemName}</h4>
                    <span className="cart-item-price">
                      ${(itemPrice * item.quantity).toFixed(2)} MXN
                    </span>
                    <div className="cart-item-controls">
                      <button
                        type="button"
                        className="qty-btn btn-decrease"
                        onClick={() => onUpdateQuantity(itemId, -1)}
                        aria-label="Disminuir cantidad"
                      >
                        -
                      </button>
                      <span className="cart-item-qty">{item.quantity}</span>
                      <button
                        type="button"
                        className="qty-btn btn-increase"
                        onClick={() => onUpdateQuantity(itemId, 1)}
                        aria-label="Aumentar cantidad"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="cart-item-remove"
                        onClick={() => onRemoveItem(itemId)}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="drawer-footer">
            <div className="drawer-subtotal">
              <span>Subtotal estimado:</span>
              <span className="drawer-subtotal-val">{formattedTotal}</span>
            </div>
            <button
              type="button"
              className="drawer-checkout-btn"
              id="cart-checkout-btn"
              disabled={isSubmitting}
              onClick={handleCheckoutClick}
            >
              {isSubmitting ? 'Procesando encargo...' : 'Proceder al pago de tu encargo'}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
