import React, { useState, useEffect, useMemo } from 'react';

/**
 * Normaliza las opciones provenientes de la columna JSONB de la BD
 * o provee opciones por defecto acordes al diseño de Figma.
 */
function extractOptions(rawField, defaultOptions = []) {
  if (!rawField) return defaultOptions;
  if (Array.isArray(rawField)) {
    return rawField.map((opt) =>
      typeof opt === 'string' ? { label: opt, extra: 0 } : opt
    );
  }
  if (typeof rawField === 'object') {
    if (Array.isArray(rawField.opciones)) {
      return rawField.opciones.map((opt) =>
        typeof opt === 'string' ? { label: opt, extra: 0 } : opt
      );
    }
    if (Array.isArray(rawField.options)) {
      return rawField.options.map((opt) =>
        typeof opt === 'string' ? { label: opt, extra: 0 } : opt
      );
    }
    // Caso clave-valor simple como {"sabor": "piña"}
    const values = Object.values(rawField);
    if (values.length > 0 && typeof values[0] === 'string') {
      return values.map((val) => ({ label: val, extra: 0 }));
    }
  }
  return defaultOptions;
}

export function ProductCustomizationModal({
  isOpen,
  onClose,
  product,
  initialCustomization = null,
  onSave
}) {
  const defaultSaborOptions = useMemo(
    () => [
      { label: 'Vainilla', extra: 0 },
      { label: 'Chocolate', extra: 0 },
      { label: 'Fresa', extra: 0 }
    ],
    []
  );

  const defaultToppingOptions = useMemo(
    () => [
      { label: 'Sin topping', extra: 0 },
      { label: 'Chispas', extra: 3 },
      { label: 'Nuez', extra: 6 },
      { label: 'Coco', extra: 4 }
    ],
    []
  );

  const defaultRellenoOptions = useMemo(
    () => [
      { label: 'Sin relleno', extra: 0 },
      { label: 'Crema pastelera', extra: 7 },
      { label: 'Chocolate', extra: 7 }
    ],
    []
  );

  const saborOptions = useMemo(
    () => extractOptions(product?.sabor, defaultSaborOptions),
    [product?.sabor, defaultSaborOptions]
  );

  const toppingOptions = useMemo(
    () => extractOptions(product?.topping, defaultToppingOptions),
    [product?.topping, defaultToppingOptions]
  );

  const rellenoOptions = useMemo(
    () => extractOptions(product?.relleno, defaultRellenoOptions),
    [product?.relleno, defaultRellenoOptions]
  );

  const [selectedSabor, setSelectedSabor] = useState('');
  const [selectedTopping, setSelectedTopping] = useState('');
  const [selectedRelleno, setSelectedRelleno] = useState('');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Inicializar estado cuando se abre el modal o cambia el producto/personalización
  useEffect(() => {
    if (isOpen && product) {
      if (initialCustomization) {
        setSelectedSabor(
          initialCustomization.sabor?.opcion ||
            initialCustomization.sabor?.sabor ||
            (typeof initialCustomization.sabor === 'string' ? initialCustomization.sabor : '') ||
            saborOptions[0]?.label ||
            ''
        );
        setSelectedTopping(
          initialCustomization.topping?.opcion ||
            initialCustomization.topping?.topping ||
            (typeof initialCustomization.topping === 'string' ? initialCustomization.topping : '') ||
            toppingOptions[0]?.label ||
            ''
        );
        setSelectedRelleno(
          initialCustomization.relleno?.opcion ||
            initialCustomization.relleno?.relleno ||
            (typeof initialCustomization.relleno === 'string' ? initialCustomization.relleno : '') ||
            rellenoOptions[0]?.label ||
            ''
        );
        setNotes(initialCustomization.notas || '');
        setQuantity(initialCustomization.quantity || 1);
      } else {
        setSelectedSabor(saborOptions[0]?.label || '');
        setSelectedTopping(toppingOptions[0]?.label || '');
        setSelectedRelleno(rellenoOptions[0]?.label || '');
        setNotes('');
        setQuantity(1);
      }
    }
  }, [isOpen, product, initialCustomization, saborOptions, toppingOptions, rellenoOptions]);

  if (!isOpen || !product) return null;

  // Cálculos de precios (base + extras de personalización)
  const basePrice = Number(product.precio_unitario ?? 0);
  const toppingExtra = toppingOptions.find((t) => t.label === selectedTopping)?.extra || 0;
  const rellenoExtra = rellenoOptions.find((r) => r.label === selectedRelleno)?.extra || 0;
  const unitPrice = basePrice + toppingExtra + rellenoExtra;
  const subtotal = unitPrice * quantity;

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(product, {
        cartItemId: initialCustomization?.cartItemId,
        quantity,
        precio_unitario: unitPrice,
        sabor: selectedSabor ? { opcion: selectedSabor, sabor: selectedSabor } : null,
        topping: selectedTopping ? { opcion: selectedTopping, topping: selectedTopping, extra: toppingExtra } : null,
        relleno: selectedRelleno ? { opcion: selectedRelleno, relleno: selectedRelleno, extra: rellenoExtra } : null,
        notas: notes.trim() || null
      });
    }
    onClose();
  };

  const isEditing = Boolean(initialCustomization?.cartItemId);
  const badgeLabel = product.es_temporada
    ? 'DE TEMPORADA'
    : product.categoria === 'DULCE'
    ? 'FAVORITO DE LA CASA'
    : 'PAN SALADO';

  return (
    <div className="custom-modal-backdrop" id="custom-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="custom-modal-panel"
        id="customization-modal-panel"
        onClick={(e) => e.stopPropagation()}
        aria-labelledby="custom-modal-title"
      >
        {/* Cabecera del modal */}
        <div className="custom-modal-header">
          <div className="custom-header-titles">
            <span className="custom-eyebrow">PERSONALIZA TU ANTOJO</span>
            <h2 className="custom-title" id="custom-modal-title">
              Haz tus {product.nombre.toLowerCase()} a tu gusto.
            </h2>
          </div>
          <button
            type="button"
            className="custom-close-btn"
            id="close-custom-modal-btn"
            onClick={onClose}
            aria-label="Cerrar personalización"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Contenido dividido en 2 columnas */}
        <form onSubmit={handleSubmit} className="custom-modal-form">
          <div className="custom-modal-body">
            {/* Columna Izquierda: Resumen del producto */}
            <div className="custom-product-summary">
              <div className="custom-image-wrapper">
                <img
                  src={product.imagen_url || '/images/placeholder.svg'}
                  alt={product.nombre}
                  className="custom-product-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/placeholder.svg';
                  }}
                />
                <span className="custom-product-badge">{badgeLabel}</span>
              </div>

              <div className="custom-product-meta">
                <div className="custom-name-price-row">
                  <h3 className="custom-product-name">{product.nombre}</h3>
                  <span className="custom-product-unit-price">${basePrice.toFixed(2)} c/u</span>
                </div>
                <p className="custom-product-desc">{product.descripcion}</p>
              </div>
            </div>

            {/* Divisor vertical */}
            <div className="custom-modal-divider" />

            {/* Columna Derecha: Opciones de personalización */}
            <div className="custom-product-options">
              {/* Opción: Sabor */}
              {saborOptions.length > 0 && (
                <div className="custom-option-group" data-group="sabor">
                  <span className="custom-group-label">Sabor</span>
                  <div className="custom-pill-list">
                    {saborOptions.map((opt) => {
                      const isSelected = selectedSabor === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          className={`custom-pill-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedSabor(opt.label)}
                          aria-pressed={isSelected}
                        >
                          <span className={`custom-radio-circle ${isSelected ? 'active' : ''}`} />
                          <span className="custom-pill-text">{opt.label}</span>
                          {opt.extra > 0 && <span className="custom-pill-extra">+${opt.extra}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Opción: Topping */}
              {toppingOptions.length > 0 && (
                <div className="custom-option-group" data-group="topping">
                  <span className="custom-group-label">Topping</span>
                  <div className="custom-pill-list">
                    {toppingOptions.map((opt) => {
                      const isSelected = selectedTopping === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          className={`custom-pill-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedTopping(opt.label)}
                          aria-pressed={isSelected}
                        >
                          <span className={`custom-radio-circle ${isSelected ? 'active' : ''}`} />
                          <span className="custom-pill-text">{opt.label}</span>
                          {opt.extra > 0 && <span className="custom-pill-extra">+${opt.extra}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Opción: Relleno */}
              {rellenoOptions.length > 0 && (
                <div className="custom-option-group" data-group="relleno">
                  <span className="custom-group-label">Relleno</span>
                  <div className="custom-pill-list">
                    {rellenoOptions.map((opt) => {
                      const isSelected = selectedRelleno === opt.label;
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          className={`custom-pill-btn ${isSelected ? 'active' : ''}`}
                          onClick={() => setSelectedRelleno(opt.label)}
                          aria-pressed={isSelected}
                        >
                          <span className={`custom-radio-circle ${isSelected ? 'active' : ''}`} />
                          <span className="custom-pill-text">{opt.label}</span>
                          {opt.extra > 0 && <span className="custom-pill-extra">+${opt.extra}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notas adicionales */}
              <div className="custom-notes-group">
                <label htmlFor="custom-notes-input" className="custom-group-label">
                  Notas adicionales
                </label>
                <textarea
                  id="custom-notes-input"
                  className="custom-notes-textarea"
                  placeholder="Agrega instrucciones para este producto (opcional)."
                  maxLength={1000}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
                <div className="custom-notes-meta">
                  <span className="custom-notes-hint">Opcional por producto</span>
                  <span className="custom-notes-count">{notes.length} / 1000</span>
                </div>
              </div>

              {/* Cantidad y subtotal */}
              <div className="custom-quantity-subtotal-row">
                <div className="custom-qty-selector">
                  <span className="custom-qty-label">Cantidad</span>
                  <div className="custom-qty-controls">
                    <button
                      type="button"
                      className="custom-qty-btn btn-minus"
                      onClick={handleDecrease}
                      aria-label="Restar cantidad"
                      disabled={quantity <= 1}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                    <span className="custom-qty-value" id="custom-qty-value">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      className="custom-qty-btn btn-plus"
                      onClick={handleIncrease}
                      aria-label="Aumentar cantidad"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="custom-subtotal-block">
                  <span className="custom-subtotal-label">Subtotal</span>
                  <span className="custom-subtotal-amount" id="custom-subtotal-amount">
                    ${subtotal.toFixed(2)} MXN
                  </span>
                  <span className="custom-subtotal-breakdown">
                    {quantity} {quantity === 1 ? 'pieza' : 'piezas'} · ${unitPrice.toFixed(2)} c/u
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Pie de acciones del modal */}
          <div className="custom-modal-footer">
            <div className="custom-security-notice">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#79685C" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Podrás revisar tu pedido antes de pagar.</span>
            </div>

            <div className="custom-footer-actions">
              <button
                type="button"
                className="custom-btn-cancel"
                id="cancel-customization-btn"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="custom-btn-submit"
                id="submit-customization-btn"
              >
                <span>
                  {isEditing ? 'Guardar cambios' : `Agregar ${quantity} al carrito`}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
