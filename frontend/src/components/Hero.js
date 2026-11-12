import React from 'react';

export function Hero({ onExploreClick, onViewCart }) {
  const handleScrollToCatalog = (e) => {
    e.preventDefault();
    if (onExploreClick) {
      onExploreClick();
      return;
    }
    const el = document.getElementById('catalogo');
    if (el) {
      const navbarOffset = 112;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-container">
        {/* Columna Izquierda: Mensaje y Acción */}
        <div className="hero-content">
          <h1 className="hero-title">
            Pan...<br />
            ¡Que sabe a Gloria!
          </h1>
          <p className="hero-description">
            Explora el catálogo, selecciona tus panes artesanales favoritos y realiza tu encargo para disfrutar del mejor sabor recién horneado.
          </p>

          <div className="hero-actions">
            <a
              href="#catalogo"
              className="btn-primary"
              id="hero-explore-btn"
              onClick={handleScrollToCatalog}
            >
              <span>Explorar catálogo</span>
            </a>
            {onViewCart && (
              <button
                type="button"
                className="btn-hero-cart-link"
                id="hero-view-cart-btn"
                onClick={onViewCart}
              >
                Ver carrito
              </button>
            )}
          </div>
        </div>

        {/* Columna Derecha: Imagen Protagonista */}
        <div className="hero-visual">
          <div className="hero-image-wrapper">
            <img
              src="/images/hero_conchas.png"
              alt="Conchas artesanales Las Glorias de Azomalli"
              className="hero-main-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
