import React from 'react';

export function ProductCard({ product, onAddToCart }) {
  const id = product.producto_id;
  const name = product.nombre;
  const description = product.descripcion;
  const price = product.precio_unitario ?? 0;
  const image = product.imagen_url || '/images/placeholder.svg';

  // Etiqueta visual de temporada o categoría
  const tag = product.tag || (
    product.es_temporada
      ? 'DE TEMPORADA'
      : product.categoria === 'DULCE'
      ? 'PAN DULCE'
      : product.categoria === 'SALADO'
      ? 'PAN SALADO'
      : null
  );

  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(price);

  return (
    <div className="product-card-wrapper">
      <article className="product-card-container" data-id={id}>
        <div className="product-image-box">
          <img
            src={image}
            alt={name}
            loading="lazy"
            onError={(e) => {
              // Fallback por si la imagen externa o URL de Cloudinary fallara
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/images/placeholder.svg';
            }}
          />
          <span className="product-price-badge">{formattedPrice}</span>
        </div>

        <div className="product-details">
          <div className="product-title-row">
            <h4 className="product-name">{name}</h4>
            <svg
              className="icon-svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9C291D"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </div>

          <p className="product-desc">{description}</p>
          {tag && <span className="product-tag">{tag}</span>}

          <button
            className="btn-add-cart"
            type="button"
            aria-label={`Agregar ${name} al carrito`}
            onClick={() => onAddToCart && onAddToCart(product)}
          >
            <span className="btn-text">Agregar al carrito</span>
            <svg
              className="icon-svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </button>
        </div>
      </article>
    </div>
  );
}
