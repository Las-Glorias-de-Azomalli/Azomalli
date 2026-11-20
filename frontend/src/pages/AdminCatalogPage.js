import React, { useState, useEffect, useMemo } from 'react';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminTopBar } from '../components/AdminTopBar';
import { useAuth } from '../context/AuthContext';
import { fetchProducts, archiveProduct, restoreProduct } from '../services/productService';

export function AdminCatalogPage({
  initialProducts = null,
  onNavigate,
  onShowToast
}) {
  let auth = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    auth = useAuth();
  } catch {
    auth = null;
  }

  const isAuthenticated = auth ? auth.isAuthenticated : false;
  const user = auth ? auth.user : null;
  const isAuthLoading = auth ? Boolean(auth.isLoading) : false;
  const isAdmin = !auth || Boolean(isAuthenticated && user?.rol === 'ADMINISTRADOR');

  const [products, setProducts] = useState(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);
  const [statusFilter, setStatusFilter] = useState('active'); // 'active' | 'archived'
  const [categoryFilter, setCategoryFilter] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    if (!auth || isAuthLoading) return;
    if (!isAuthenticated) {
      if (onNavigate) {
        onNavigate('/login');
      } else {
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    } else if (user?.rol !== 'ADMINISTRADOR') {
      if (onNavigate) {
        onNavigate('/');
      } else {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  }, [auth, isAuthLoading, isAuthenticated, user, onNavigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts({ status: 'all' });
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth && !isAdmin) return;
    if (initialProducts) {
      setProducts(initialProducts);
      setLoading(false);
      return;
    }
    loadData();
  }, [initialProducts, isAdmin]);

  const handleNav = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Conteos para métricas
  const activeCount = useMemo(() => {
    return products.filter((p) => p.activo !== false).length;
  }, [products]);

  const archivedCount = useMemo(() => {
    return products.filter((p) => p.activo === false).length;
  }, [products]);

  const categoriesCount = useMemo(() => {
    const cats = new Set(products.map((p) => p.categoria).filter(Boolean));
    return cats.size;
  }, [products]);

  // Filtrado reactivo de productos
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Filtro de estado
      if (statusFilter === 'active' && p.activo === false) return false;
      if (statusFilter === 'archived' && p.activo !== false) return false;

      // Filtro de categoría
      if (categoryFilter !== 'TODOS') {
        const catClean = String(p.categoria || '').toUpperCase();
        if (categoryFilter === 'DULCE' && catClean !== 'DULCE') return false;
        if (categoryFilter === 'SALADO' && catClean !== 'SALADO') return false;
      }

      // Filtro de búsqueda
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const code = `pan-${String(p.producto_id).padStart(3, '0')}`;
        const matchName = String(p.nombre || '').toLowerCase().includes(term);
        const matchDesc = String(p.descripcion || '').toLowerCase().includes(term);
        const matchCode = code.includes(term) || String(p.producto_id).includes(term);
        if (!matchName && !matchDesc && !matchCode) return false;
      }

      return true;
    });
  }, [products, statusFilter, categoryFilter, searchTerm]);

  // Manejo de archivar o reactivar
  const handleToggleArchive = async (producto) => {
    const isCurrentlyActive = producto.activo !== false;
    setActionLoadingId(producto.producto_id);
    try {
      if (isCurrentlyActive) {
        await archiveProduct(producto.producto_id);
        if (onShowToast) onShowToast(`Producto archivado: ${producto.nombre}`);
      } else {
        await restoreProduct(producto.producto_id);
        if (onShowToast) onShowToast(`Producto reactivado: ${producto.nombre}`);
      }

      setProducts((prev) =>
        prev.map((item) =>
          item.producto_id === producto.producto_id
            ? { ...item, activo: !isCurrentlyActive }
            : item
        )
      );
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Error al actualizar producto');
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatPrice = (val) => {
    const num = Number(val);
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  const formatCategory = (cat) => {
    const c = String(cat || '').toUpperCase();
    if (c === 'DULCE') return 'Pan dulce';
    if (c === 'SALADO') return 'Pan salado';
    return cat || 'Artesanal';
  };

  if (auth && !isAuthLoading && !isAdmin) {
    return null;
  }

  return (
    <div className="admin-page-container">
      <AdminSidebar currentSection="catalogo" onNavigate={handleNav} />

      <div className="admin-main-area">
        <AdminTopBar breadcrumb="Panel de gestión / Catálogo" />

        <main className="admin-content" id="admin-catalog-content">
          {/* Encabezado de página */}
          <section className="admin-page-header">
            <div className="admin-header-presentation">
              <h1 className="admin-page-title">Catálogo de panes</h1>
              <p className="admin-page-subtitle">
                Cuida lo que se ve en la tienda: productos, precios y disponibilidad.
              </p>
            </div>

            <div className="admin-header-actions">
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                id="btn-add-product"
                onClick={() => handleNav('/admin/productos/nuevo')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>Agregar producto</span>
              </button>
            </div>
          </section>

          {/* Resumen del catálogo */}
          <section className="admin-metrics-grid" aria-label="Resumen del catálogo">
            <div className="admin-metric-card" id="metric-active-products">
              <div className="admin-metric-indicator">
                <span className="admin-metric-number" id="count-active-products">{activeCount}</span>
                <span className="admin-metric-label">Productos activos</span>
              </div>
              <p className="admin-metric-hint">Visibles en el catálogo público</p>
            </div>

            <div className="admin-metric-card" id="metric-archived-products">
              <div className="admin-metric-indicator">
                <span className="admin-metric-number" id="count-archived-products">{archivedCount}</span>
                <span className="admin-metric-label">Productos archivados</span>
              </div>
              <p className="admin-metric-hint">El historial siempre se conserva</p>
            </div>

            <div className="admin-metric-card" id="metric-categories">
              <div className="admin-metric-indicator">
                <span className="admin-metric-number">{categoriesCount}</span>
                <span className="admin-metric-label">Categorías</span>
              </div>
              <p className="admin-metric-hint">Pan dulce y pan salado</p>
            </div>
          </section>

          {/* Herramientas de catálogo */}
          <section className="admin-toolbar" aria-label="Herramientas del catálogo">
            <div className="admin-status-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                id="tab-filter-active"
                aria-selected={statusFilter === 'active'}
                className={`admin-tab-btn ${statusFilter === 'active' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('active')}
              >
                Activos ({activeCount})
              </button>

              <button
                type="button"
                role="tab"
                id="tab-filter-archived"
                aria-selected={statusFilter === 'archived'}
                className={`admin-tab-btn ${statusFilter === 'archived' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('archived')}
              >
                Archivados ({archivedCount})
              </button>
            </div>

            <div className="admin-filters-controls">
              {/* Buscador */}
              <div className="admin-search-wrapper">
                <svg className="admin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="admin-search-input"
                  id="input-search-product"
                  placeholder="Buscar por nombre o código"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="admin-search-clear"
                    onClick={() => setSearchTerm('')}
                    title="Limpiar búsqueda"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Selector de categoría */}
              <div className="admin-select-wrapper">
                <select
                  className="admin-select"
                  id="select-category-filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  aria-label="Filtrar por categoría"
                >
                  <option value="TODOS">Todas las categorías</option>
                  <option value="DULCE">Pan dulce</option>
                  <option value="SALADO">Pan salado</option>
                </select>
                <svg className="admin-select-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
          </section>

          {/* Listado de productos (Tabla) */}
          <section className="admin-table-panel">
            <div className="admin-table-container">
              <table className="admin-table" id="admin-products-table">
                <thead>
                  <tr>
                    <th scope="col" className="col-product">PRODUCTO</th>
                    <th scope="col" className="col-category">CATEGORÍA</th>
                    <th scope="col" className="col-price">PRECIO</th>
                    <th scope="col" className="col-status">ESTADO</th>
                    <th scope="col" className="col-actions">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="admin-table-state">
                        <div className="admin-spinner" />
                        <p>Cargando productos...</p>
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="admin-table-state">
                        <p>
                          {searchTerm || categoryFilter !== 'TODOS'
                            ? 'No se encontraron productos con los filtros seleccionados.'
                            : statusFilter === 'archived'
                            ? 'No hay productos archivados.'
                            : 'No hay productos registrados en el catálogo.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const isActive = p.activo !== false;
                      const code = `PAN-${String(p.producto_id).padStart(3, '0')}`;
                      const isActing = actionLoadingId === p.producto_id;

                      return (
                        <tr key={p.producto_id} className={`admin-table-row ${!isActive ? 'is-archived' : ''}`} id={`product-row-${p.producto_id}`}>
                          {/* Identificación de producto */}
                          <td className="col-product">
                            <div className="admin-product-cell">
                              <img
                                src={p.imagen_url || '/images/placeholder.svg'}
                                alt={p.nombre}
                                className="admin-product-thumb"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = '/images/placeholder.svg';
                                }}
                              />
                              <div className="admin-product-meta">
                                <strong className="admin-product-name">{p.nombre}</strong>
                                <span className="admin-product-code">{code} · Venta por pieza</span>
                                {p.es_temporada && (
                                  <span className="admin-seasonal-badge">De temporada</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Categoría */}
                          <td className="col-category">
                            <span className="admin-category-tag">{formatCategory(p.categoria)}</span>
                          </td>

                          {/* Precio */}
                          <td className="col-price">
                            <span className="admin-price-text">{formatPrice(p.precio_unitario)}</span>
                          </td>

                          {/* Estado */}
                          <td className="col-status">
                            <div className="admin-availability-cell">
                              <span className={`admin-status-pill ${isActive ? 'status-active' : 'status-archived'}`}>
                                {isActive ? 'Activo' : 'Archivado'}
                              </span>
                              <span className="admin-availability-text">
                                {isActive ? 'Disponible' : 'No disponible'}
                              </span>
                            </div>
                          </td>

                          {/* Acciones */}
                          <td className="col-actions">
                            <div className="admin-actions-cell">
                              <button
                                type="button"
                                className="admin-btn-action btn-edit"
                                id={`btn-edit-${p.producto_id}`}
                                title={`Editar ${p.nombre}`}
                                onClick={() => handleNav(`/admin/productos/editar/${p.producto_id}`)}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                  <path d="m15 5 4 4" />
                                </svg>
                                <span>Editar</span>
                              </button>

                              <button
                                type="button"
                                className={`admin-btn-action ${isActive ? 'btn-archive' : 'btn-restore'}`}
                                id={`btn-archive-${p.producto_id}`}
                                title={isActive ? `Archivar ${p.nombre}` : `Reactivar ${p.nombre}`}
                                disabled={isActing}
                                onClick={() => handleToggleArchive(p)}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect width="20" height="5" x="2" y="3" rx="1" />
                                  <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                                  <path d="M10 12h4" />
                                </svg>
                                <span>{isActive ? 'Archivar' : 'Reactivar'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer de resultados */}
            <div className="admin-table-footer">
              <span className="admin-results-count">
                Mostrando {filteredProducts.length} de {statusFilter === 'active' ? activeCount : archivedCount} productos {statusFilter === 'active' ? 'activos' : 'archivados'}
              </span>
              <span className="admin-results-pagination">Página 1 de 1</span>
            </div>
          </section>

          {/* Criterios de publicación */}
          <section className="admin-guide-card">
            <div className="admin-guide-icon-wrap">
              <svg className="admin-guide-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 22 10-10" />
                <path d="M16 8a4.4 4.4 0 0 0-6.2 0" />
                <path d="M18.8 5.2a8.8 8.8 0 0 0-12.4 0" />
                <path d="M11 13a4.4 4.4 0 0 0 0-6.2" />
                <path d="M8.2 15.8a8.8 8.8 0 0 0 0-12.4" />
                <path d="M22 2a11.2 11.2 0 0 0-15.8 0" />
                <path d="M22 2a11.2 11.2 0 0 1 0 15.8" />
              </svg>
            </div>
            <div className="admin-guide-content">
              <h3 className="admin-guide-title">El oficio está en los detalles.</h3>
              <p className="admin-guide-text">
                Editar actualiza la ficha pública. Archivar retira el producto de la tienda, sin borrar los pedidos que ya lo incluyen.
              </p>
            </div>
          </section>
        </main>

        <footer className="admin-footer">
          <span className="admin-footer-craft">Las Glorias de Azomalli · Gestión artesanal</span>
          <span className="admin-footer-currency">MXN</span>
        </footer>
      </div>
    </div>
  );
}
