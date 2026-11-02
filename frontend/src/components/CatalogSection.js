import React from 'react';
import { ProductCard } from './ProductCard';

export function CatalogSection({
  bestsellers,
  seasonal,
  filteredProducts,
  activeCategory,
  onSelectCategory,
  onAddToCart
}) {
  // Categorías que reflejan el ENUM (DULCE / SALADO) más la opción de Todos
  const categories = ['Todos', 'Dulces', 'Salados'];

  return (
    <section className="catalog-section" id="catalogo">
      <div className="catalog-container">
        {/* Encabezado General */}
        <div className="catalog-header">
          <span className="eyebrow-accent">EXPLORA EL CATÁLOGO</span>
          <h2 className="section-headline">Encuentra el pan perfecto para cada momento.</h2>
          <p className="section-lead">
            Descubre las opciones más buscadas, los productos de temporada y toda la variedad artesanal disponible para encargar.
          </p>
        </div>

        {/* SECCIÓN 1: PRODUCTOS MÁS VENDIDOS / FAVORITOS */}
        {bestsellers && bestsellers.length > 0 && (
          <div className="catalog-block" id="seccion-mas-vendidos">
            <div className="block-header">
              <span className="block-eyebrow">MÁS VENDIDOS</span>
              <h3 className="block-title">Los favoritos de la casa.</h3>
              <p className="block-desc">
                Los productos que más se repiten en las mesas y que mejor acompañan el café, el té o una tarde tranquila.
              </p>
            </div>
            <div className="products-grid" id="bestsellers-grid">
              {bestsellers.map((product) => (
                <ProductCard
                  key={`bestseller-${product.producto_id}`}
                  product={product}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN 2: PRODUCTOS DE TEMPORADA */}
        {seasonal && seasonal.length > 0 && (
          <div className="catalog-block" id="seccion-temporada">
            <div className="block-header">
              <span className="block-eyebrow">PRODUCTOS DE TEMPORADA</span>
              <h3 className="block-title">Nuevos sabores para compartir.</h3>
              <p className="block-desc">
                Opciones especiales pensadas para acompañar el momento, la estación y el gusto de la casa.
              </p>
            </div>
            <div className="products-grid" id="seasonal-grid">
              {seasonal.map((product) => (
                <ProductCard
                  key={`seasonal-${product.producto_id}`}
                  product={product}
                  onAddToCart={onAddToCart}
                />
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN 3: TODOS LOS PRODUCTOS */}
        <div className="catalog-block" id="seccion-todos">
          <div className="block-header">
            <span className="block-eyebrow">TODOS LOS PRODUCTOS</span>
            <h3 className="block-title">La variedad completa para elegir.</h3>
            <p className="block-desc">
              Explora todos los productos disponibles en nuestro obrador y crea tu pedido con las opciones que mejor se adapten a tu antojo.
            </p>

            {/* Filtros de Categoría alineados al ENUM de BD */}
            <div
              className="category-filters"
              id="category-filter-buttons"
              role="tablist"
              aria-label="Filtro de productos por categoría"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`filter-pill ${activeCategory.toLowerCase() === cat.toLowerCase() ? 'active' : ''}`}
                  role="tab"
                  aria-selected={activeCategory.toLowerCase() === cat.toLowerCase()}
                  onClick={() => onSelectCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="products-grid" id="all-products-grid">
            {filteredProducts.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <p>No se encontraron panes en esta categoría por el momento.</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <ProductCard
                  key={`all-${product.producto_id}`}
                  product={product}
                  onAddToCart={onAddToCart}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
