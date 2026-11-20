import React, { useState, useEffect } from 'react';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminTopBar } from '../components/AdminTopBar';
import { useAuth } from '../context/AuthContext';
import { fetchProductById, updateProduct, archiveProduct, restoreProduct } from '../services/productService';

export function AdminProductEditPage({
  productId,
  initialProduct = null,
  onNavigate,
  onShowToast,
  onUpdateSuccess
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

  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [submitting, setSubmitting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState(null);

  // Campos del formulario
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('DULCE');
  const [precio, setPrecio] = useState('');
  const [disponible, setDisponible] = useState('Disponible');
  const [unidad, setUnidad] = useState('Pieza');
  const [peso, setPeso] = useState('');
  const [sabores, setSabores] = useState('');
  const [isCasero, setIsCasero] = useState(true);
  const [isHechoAMano, setIsHechoAMano] = useState(true);
  const [isTemporada, setIsTemporada] = useState(false);
  const [isPersonalizable, setIsPersonalizable] = useState(false);
  const [ingredientes, setIngredientes] = useState('');
  const [alergenos, setAlergenos] = useState({
    gluten: true,
    leche: true,
    huevo: true,
    frutosSecos: false
  });
  const [imagenUrl, setImagenUrl] = useState('');
  const [activo, setActivo] = useState(true);

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

  // Inicializar campos a partir del producto
  const populateFields = (prod) => {
    if (!prod) return;
    setNombre(prod.nombre || '');
    setDescripcion(prod.descripcion || '');
    setCategoria(String(prod.categoria || 'DULCE').toUpperCase());
    setPrecio(prod.precio_unitario != null ? String(prod.precio_unitario) : '');
    setActivo(prod.activo !== false);
    setDisponible(prod.activo !== false ? 'Disponible' : 'No disponible');
    setImagenUrl(prod.imagen_url || '');
    setIsTemporada(Boolean(prod.es_temporada));
    setIsPersonalizable(Boolean(prod.es_personalizable));

    // Si viene sabor con opciones o metadatos
    if (prod.sabor) {
      if (typeof prod.sabor === 'object') {
        if (Array.isArray(prod.sabor.opciones)) {
          setSabores(prod.sabor.opciones.join(', '));
        }
        if (prod.sabor.peso) setPeso(prod.sabor.peso);
        if (prod.sabor.unidad) setUnidad(prod.sabor.unidad);
        if (prod.sabor.ingredientes) setIngredientes(prod.sabor.ingredientes);
        if (Array.isArray(prod.sabor.alergenos)) {
          setAlergenos({
            gluten: prod.sabor.alergenos.includes('Gluten (trigo)'),
            leche: prod.sabor.alergenos.includes('Leche'),
            huevo: prod.sabor.alergenos.includes('Huevo'),
            frutosSecos: prod.sabor.alergenos.includes('Frutos secos')
          });
        }
        if (Array.isArray(prod.sabor.distintivos)) {
          setIsCasero(prod.sabor.distintivos.includes('100% casero'));
          setIsHechoAMano(prod.sabor.distintivos.includes('Hecho a mano'));
        }
      } else if (typeof prod.sabor === 'string') {
        setSabores(prod.sabor);
      }
    }
  };

  useEffect(() => {
    if (auth && !isAdmin) return;
    if (initialProduct) {
      setProduct(initialProduct);
      populateFields(initialProduct);
      setLoading(false);
      return;
    }

    if (!productId) return;

    let isMounted = true;
    async function loadProduct() {
      try {
        setLoading(true);
        const data = await fetchProductById(productId, { includeArchived: true });
        if (isMounted && data) {
          setProduct(data);
          populateFields(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'No se pudo cargar la información del producto.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [productId, initialProduct, isAdmin]);

  const handleNav = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleToggleAlergeno = (key) => {
    setAlergenos((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('El nombre del producto no puede estar vacío.');
      return;
    }

    if (!descripcion.trim()) {
      setError('La descripción del producto no puede estar vacía.');
      return;
    }

    const numPrecio = parseFloat(precio);
    if (isNaN(numPrecio) || numPrecio <= 0) {
      setError('El precio unitario debe ser un número válido mayor a 0.');
      return;
    }

    const selectedAlergenos = [];
    if (alergenos.gluten) selectedAlergenos.push('Gluten (trigo)');
    if (alergenos.leche) selectedAlergenos.push('Leche');
    if (alergenos.huevo) selectedAlergenos.push('Huevo');
    if (alergenos.frutosSecos) selectedAlergenos.push('Frutos secos');

    const distintivos = [];
    if (isCasero) distintivos.push('100% casero');
    if (isHechoAMano) distintivos.push('Hecho a mano');

    const opcionesSabores = sabores.trim()
      ? sabores.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const saborObj = {
      opciones: opcionesSabores.length > 0 ? opcionesSabores : undefined,
      unidad,
      peso: peso.trim() || undefined,
      ingredientes: ingredientes.trim() || undefined,
      alergenos: selectedAlergenos,
      distintivos
    };

    const isAvailable = disponible === 'Disponible';

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio_unitario: numPrecio,
      categoria,
      imagen_url: imagenUrl.trim() || undefined,
      activo: isAvailable,
      es_temporada: isTemporada,
      es_personalizable: isPersonalizable,
      sabor: saborObj
    };

    try {
      setSubmitting(true);
      const targetId = product?.producto_id || productId;
      const updated = await updateProduct(targetId, payload);
      setProduct(updated);
      setActivo(updated.activo !== false);
      if (onShowToast) {
        onShowToast(`Producto actualizado: ${updated.nombre}`);
      }
      if (onUpdateSuccess) {
        onUpdateSuccess(updated);
      }
      handleNav('/admin/productos');
    } catch (err) {
      setError(err.message || 'Error al actualizar el producto.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchiveToggle = async () => {
    const targetId = product?.producto_id || productId;
    if (!targetId) return;

    try {
      setArchiving(true);
      if (activo) {
        const archived = await archiveProduct(targetId);
        setProduct(archived);
        setActivo(false);
        setDisponible('No disponible');
        if (onShowToast) onShowToast(`Producto archivado: ${archived.nombre}`);
      } else {
        const restored = await restoreProduct(targetId);
        setProduct(restored);
        setActivo(true);
        setDisponible('Disponible');
        if (onShowToast) onShowToast(`Producto reactivado: ${restored.nombre}`);
      }
      handleNav('/admin/productos');
    } catch (err) {
      setError(err.message || 'Error al cambiar estado de archivado.');
    } finally {
      setArchiving(false);
    }
  };

  if (auth && !isAuthLoading && !isAdmin) {
    return null;
  }

  const parsedId = product?.producto_id || productId || 1;
  const productCode = `PAN-${String(parsedId).padStart(3, '0')}`;
  const displayPrice = parseFloat(precio) || product?.precio_unitario || 0;
  const formattedPrice = `$${Number(displayPrice).toFixed(2)}`;

  if (loading) {
    return (
      <div className="admin-page-container">
        <AdminSidebar currentSection="catalogo" onNavigate={handleNav} />
        <div className="admin-main-area">
          <AdminTopBar breadcrumb="Panel de gestión / Catálogo" />
          <main className="admin-content admin-loading-state">
            <div className="admin-spinner" />
            <p>Cargando información del producto...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <AdminSidebar currentSection="catalogo" onNavigate={handleNav} />

      <div className="admin-main-area">
        <AdminTopBar breadcrumb="Panel de gestión / Catálogo" />

        <main className="admin-content" id="admin-edit-product-content">
          {/* Encabezado */}
          <section className="admin-page-header">
            <div className="admin-header-presentation">
              <h1 className="admin-page-title">Editar producto</h1>
              <p className="admin-page-subtitle">
                {nombre || 'Producto'} · {productCode} · Actualiza su ficha, disponibilidad y características.
              </p>
            </div>

            <div className="admin-header-actions">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                id="btn-back-to-catalog"
                onClick={() => handleNav('/admin/productos')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Volver al catálogo</span>
              </button>
            </div>
          </section>

          {error && (
            <div className="admin-alert-error" role="alert">
              <span>{error}</span>
            </div>
          )}

          {/* Formulario y Confirmación de archivo (2 columnas) */}
          <form className="admin-form-preview-grid" onSubmit={handleSave}>
            {/* Columna Izquierda: Datos editables */}
            <div className="admin-form-column">
              {/* Información del producto */}
              <div className="admin-form-panel">
                <h2 className="admin-panel-title">Información del producto</h2>

                <div className="admin-form-group">
                  <label htmlFor="input-edit-product-name" className="admin-label">
                    Nombre del producto *
                  </label>
                  <input
                    type="text"
                    id="input-edit-product-name"
                    className="admin-input"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="input-edit-product-desc" className="admin-label">
                    Descripción *
                  </label>
                  <textarea
                    id="input-edit-product-desc"
                    className="admin-textarea"
                    rows="3"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group flex-1">
                    <label htmlFor="select-edit-product-category" className="admin-label">
                      Categoría *
                    </label>
                    <select
                      id="select-edit-product-category"
                      className="admin-select-input"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                    >
                      <option value="DULCE">Pan dulce</option>
                      <option value="SALADO">Pan salado</option>
                    </select>
                  </div>

                  <div className="admin-form-group flex-1">
                    <label htmlFor="input-edit-product-price" className="admin-label">
                      Precio por pieza (MXN) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.01"
                      id="input-edit-product-price"
                      className="admin-input"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                      required
                    />
                    <span className="admin-input-hint">Impuestos incluidos</span>
                  </div>
                </div>
              </div>

              {/* Disponibilidad y características */}
              <div className="admin-form-panel">
                <h2 className="admin-panel-title">Disponibilidad y características</h2>

                <div className="admin-form-row">
                  <div className="admin-form-group flex-1">
                    <label htmlFor="select-edit-product-availability" className="admin-label">
                      Disponibilidad *
                    </label>
                    <select
                      id="select-edit-product-availability"
                      className="admin-select-input"
                      value={disponible}
                      onChange={(e) => setDisponible(e.target.value)}
                    >
                      <option value="Disponible">Disponible</option>
                      <option value="No disponible">No disponible</option>
                    </select>
                  </div>

                  <div className="admin-form-group flex-1">
                    <label htmlFor="select-edit-product-unit" className="admin-label">
                      Unidad de venta
                    </label>
                    <select
                      id="select-edit-product-unit"
                      className="admin-select-input"
                      value={unidad}
                      onChange={(e) => setUnidad(e.target.value)}
                    >
                      <option value="Pieza">Pieza</option>
                      <option value="Docena">Docena</option>
                      <option value="Paquete">Paquete</option>
                    </select>
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group flex-1">
                    <label htmlFor="input-edit-product-weight" className="admin-label">
                      Tamaño o peso aproximado
                    </label>
                    <input
                      type="text"
                      id="input-edit-product-weight"
                      className="admin-input"
                      placeholder="90 g por pieza"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group flex-1">
                    <label htmlFor="input-edit-product-flavors" className="admin-label">
                      Sabores
                    </label>
                    <input
                      type="text"
                      id="input-edit-product-flavors"
                      className="admin-input"
                      value={sabores}
                      onChange={(e) => setSabores(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-checkboxes-block">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      id="checkbox-edit-handmade"
                      checked={isHechoAMano}
                      onChange={(e) => setIsHechoAMano(e.target.checked)}
                    />
                    <span>Hecho a mano</span>
                  </label>

                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      id="checkbox-edit-homemade"
                      checked={isCasero}
                      onChange={(e) => setIsCasero(e.target.checked)}
                    />
                    <span>100% casero</span>
                  </label>

                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      id="checkbox-edit-seasonal"
                      checked={isTemporada}
                      onChange={(e) => setIsTemporada(e.target.checked)}
                    />
                    <span>De temporada</span>
                  </label>

                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      id="checkbox-edit-customizable"
                      checked={isPersonalizable}
                      onChange={(e) => setIsPersonalizable(e.target.checked)}
                    />
                    <span>Personalizable (admite opciones al ordenar)</span>
                  </label>
                </div>

                <p className="admin-panel-footer-note">
                  Estas características se muestran en la ficha del catálogo público.
                </p>
              </div>

              {/* Ingredientes y alérgenos */}
              <div className="admin-form-panel">
                <h2 className="admin-panel-title">Ingredientes y alérgenos</h2>

                <div className="admin-form-group">
                  <label htmlFor="input-edit-product-ingredients" className="admin-label">
                    Ingredientes *
                  </label>
                  <textarea
                    id="input-edit-product-ingredients"
                    className="admin-textarea"
                    rows="2"
                    value={ingredientes}
                    onChange={(e) => setIngredientes(e.target.value)}
                  />
                </div>

                <div className="admin-form-group">
                  <span className="admin-label">Alérgenos declarados</span>
                  <div className="admin-checkboxes-inline">
                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={alergenos.gluten}
                        onChange={() => handleToggleAlergeno('gluten')}
                      />
                      <span>Gluten (trigo)</span>
                    </label>

                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={alergenos.leche}
                        onChange={() => handleToggleAlergeno('leche')}
                      />
                      <span>Leche</span>
                    </label>

                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={alergenos.huevo}
                        onChange={() => handleToggleAlergeno('huevo')}
                      />
                      <span>Huevo</span>
                    </label>

                    <label className="admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={alergenos.frutosSecos}
                        onChange={() => handleToggleAlergeno('frutosSecos')}
                      />
                      <span>Frutos secos</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Acciones de edición */}
              <div className="admin-form-actions-panel">
                <span className="admin-actions-note">
                  La ficha pública se actualizará al guardar los cambios.
                </span>
                <div className="admin-actions-buttons">
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    id="btn-cancel-edit"
                    onClick={() => handleNav('/admin/productos')}
                    disabled={submitting}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary"
                    id="btn-save-product"
                    disabled={submitting}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{submitting ? 'Guardando...' : 'Guardar cambios'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Fotografía y Archivo */}
            <div className="admin-preview-column">
              {/* Fotografía actual */}
              <div className="admin-preview-panel">
                <h2 className="admin-panel-title">Fotografía actual</h2>

                <div className="admin-photo-container">
                  <img
                    src={imagenUrl.trim() || '/images/placeholder.svg'}
                    alt={nombre}
                    className="admin-preview-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholder.svg';
                    }}
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="input-edit-product-image" className="admin-label">
                    Cambiar fotografía (URL)
                  </label>
                  <input
                    type="url"
                    id="input-edit-product-image"
                    className="admin-input"
                    value={imagenUrl}
                    onChange={(e) => setImagenUrl(e.target.value)}
                  />
                  <span className="admin-input-hint">
                    JPG o PNG, máximo 5 MB. Mantén una imagen clara y cálida de tu pan.
                  </span>
                </div>
              </div>

              {/* Publicación actual */}
              <div className="admin-preview-panel">
                <h2 className="admin-panel-title">Publicación actual</h2>
                <div className="admin-current-status-row">
                  <span className={`admin-status-pill ${activo ? 'status-active' : 'status-archived'}`}>
                    {activo ? 'Activo' : 'Archivado'}
                  </span>
                  <span className="admin-current-price">{formattedPrice} MXN</span>
                </div>
                <p className="admin-current-status-desc">
                  {activo
                    ? 'Visible en el catálogo público.'
                    : 'Retirado del catálogo público.'}
                </p>
              </div>

              {/* Confirmación visible de archivo */}
              <div className="admin-archive-confirm-panel" id="archive-confirm-box">
                <div className="admin-archive-header">
                  <div className="admin-archive-icon-wrap">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="5" x="2" y="3" rx="1" />
                      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                      <path d="M10 12h4" />
                    </svg>
                  </div>
                  <h3 className="admin-archive-title">
                    {activo ? `¿Archivar ${nombre || 'este producto'}?` : `¿Reactivar ${nombre || 'este producto'}?`}
                  </h3>
                </div>

                <p className="admin-archive-text">
                  {activo
                    ? 'El producto se retirará del catálogo público y ya no podrá agregarse a nuevos carritos.'
                    : 'El producto volverá a estar disponible en el catálogo público para todos los clientes.'}
                </p>

                <hr className="admin-archive-divider" />

                <p className="admin-archive-detail">
                  No se elimina el producto ni el historial de pedidos que lo incluyen.
                </p>
                <p className="admin-archive-detail">
                  {activo
                    ? 'Podrás consultarlo en «Archivados». Esta acción no cancela los pedidos en curso.'
                    : 'Conservará sus opciones y características al reactivarse.'}
                </p>

                <div className="admin-archive-actions">
                  <button
                    type="button"
                    className={`admin-btn ${activo ? 'admin-btn-archive' : 'admin-btn-restore'}`}
                    id="btn-confirm-archive"
                    disabled={archiving}
                    onClick={handleArchiveToggle}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="5" x="2" y="3" rx="1" />
                      <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                      <path d="M10 12h4" />
                    </svg>
                    <span>
                      {archiving
                        ? 'Procesando...'
                        : activo
                        ? 'Confirmar archivo'
                        : 'Confirmar reactivación'}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    id="btn-cancel-archive"
                    onClick={() => handleNav('/admin/productos')}
                  >
                    {activo ? 'No, conservar activo' : 'Cancelar'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </main>

        <footer className="admin-footer">
          <span className="admin-footer-craft">Las Glorias de Azomalli · Gestión artesanal</span>
          <span className="admin-footer-currency">MXN</span>
        </footer>
      </div>
    </div>
  );
}
