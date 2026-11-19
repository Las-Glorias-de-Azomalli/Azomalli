import React, { useState } from 'react';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminTopBar } from '../components/AdminTopBar';
import { createProduct } from '../services/productService';

export function AdminProductCreatePage({
  onNavigate,
  onShowToast,
  onCreateSuccess
}) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('DULCE');
  const [precio, setPrecio] = useState('');
  const [disponible, setDisponible] = useState('Disponible'); // 'Disponible' | 'No disponible'
  const [unidad, setUnidad] = useState('Pieza');
  const [peso, setPeso] = useState('90 g por pieza');
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim()) {
      setError('El nombre del producto es obligatorio.');
      return;
    }

    if (!descripcion.trim()) {
      setError('La descripción del producto es obligatoria.');
      return;
    }

    const numPrecio = parseFloat(precio);
    if (isNaN(numPrecio) || numPrecio <= 0) {
      setError('Por favor ingresa un precio unitario válido mayor a 0.');
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

    // Preparar sabor y personalización si corresponde
    let saborObj = null;
    if (sabores.trim() || selectedAlergenos.length || ingredientes.trim() || peso || unidad) {
      const opcionesSabores = sabores.trim()
        ? sabores.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      saborObj = {
        opciones: opcionesSabores.length > 0 ? opcionesSabores : undefined,
        unidad,
        peso,
        ingredientes: ingredientes.trim() || undefined,
        alergenos: selectedAlergenos,
        distintivos
      };
    }

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio_unitario: numPrecio,
      categoria,
      imagen_url: imagenUrl.trim() || '/images/conchas.png',
      activo: disponible === 'Disponible',
      es_temporada: isTemporada,
      es_personalizable: isPersonalizable,
      sabor: saborObj
    };

    try {
      setLoading(true);
      const created = await createProduct(payload);
      if (onShowToast) {
        onShowToast(`Producto creado exitosamente: ${created.nombre}`);
      }
      if (onCreateSuccess) {
        onCreateSuccess(created);
      }
      handleNav('/admin/productos');
    } catch (err) {
      setError(err.message || 'Error al guardar el producto.');
    } finally {
      setLoading(false);
    }
  };

  const previewPrice = parseFloat(precio);
  const formattedPreviewPrice = !isNaN(previewPrice) && previewPrice > 0
    ? `$${previewPrice.toFixed(2)}`
    : '$0.00';

  const categoryLabel = categoria === 'DULCE' ? 'Pan dulce' : 'Pan salado';

  return (
    <div className="admin-page-container">
      <AdminSidebar currentSection="catalogo" onNavigate={handleNav} />

      <div className="admin-main-area">
        <AdminTopBar breadcrumb="Panel de gestión / Catálogo" />

        <main className="admin-content" id="admin-create-product-content">
          {/* Encabezado */}
          <section className="admin-page-header">
            <div className="admin-header-presentation">
              <h1 className="admin-page-title">Agregar producto</h1>
              <p className="admin-page-subtitle">
                Prepara una nueva ficha para tu catálogo. Los campos con * son obligatorios.
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

          {/* Formulario y Vista Previa (2 columnas) */}
          <form className="admin-form-preview-grid" onSubmit={handleSubmit}>
            {/* Columna Izquierda: Ficha editable */}
            <div className="admin-form-column">
              {/* Panel 1: Información del producto */}
              <div className="admin-form-panel">
                <h2 className="admin-panel-title">Información del producto</h2>

                <div className="admin-form-group">
                  <label htmlFor="input-product-name" className="admin-label">
                    Nombre del producto *
                  </label>
                  <input
                    type="text"
                    id="input-product-name"
                    className="admin-input"
                    placeholder="Ej. Conchas de chocolate"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="input-product-desc" className="admin-label">
                    Descripción *
                  </label>
                  <textarea
                    id="input-product-desc"
                    className="admin-textarea"
                    rows="3"
                    placeholder="Describe los sabores, la textura y el aroma de este pan artesanal..."
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    required
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group flex-1">
                    <label htmlFor="select-product-category" className="admin-label">
                      Categoría *
                    </label>
                    <select
                      id="select-product-category"
                      className="admin-select-input"
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                    >
                      <option value="DULCE">Pan dulce</option>
                      <option value="SALADO">Pan salado</option>
                    </select>
                  </div>

                  <div className="admin-form-group flex-1">
                    <label htmlFor="input-product-price" className="admin-label">
                      Precio por pieza (MXN) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.01"
                      id="input-product-price"
                      className="admin-input"
                      placeholder="28.00"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                      required
                    />
                    <span className="admin-input-hint">Impuestos incluidos</span>
                  </div>
                </div>
              </div>

              {/* Panel 2: Disponibilidad y características */}
              <div className="admin-form-panel">
                <h2 className="admin-panel-title">Disponibilidad y características</h2>

                <div className="admin-form-row">
                  <div className="admin-form-group flex-1">
                    <label htmlFor="select-product-availability" className="admin-label">
                      Disponibilidad *
                    </label>
                    <select
                      id="select-product-availability"
                      className="admin-select-input"
                      value={disponible}
                      onChange={(e) => setDisponible(e.target.value)}
                    >
                      <option value="Disponible">Disponible</option>
                      <option value="No disponible">No disponible</option>
                    </select>
                  </div>

                  <div className="admin-form-group flex-1">
                    <label htmlFor="select-product-unit" className="admin-label">
                      Unidad de venta
                    </label>
                    <select
                      id="select-product-unit"
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
                    <label htmlFor="input-product-weight" className="admin-label">
                      Tamaño o peso aproximado
                    </label>
                    <input
                      type="text"
                      id="input-product-weight"
                      className="admin-input"
                      placeholder="90 g por pieza"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                    />
                  </div>

                  <div className="admin-form-group flex-1">
                    <label htmlFor="input-product-flavors" className="admin-label">
                      Sabores
                    </label>
                    <input
                      type="text"
                      id="input-product-flavors"
                      className="admin-input"
                      placeholder="Chocolate, Vainilla..."
                      value={sabores}
                      onChange={(e) => setSabores(e.target.value)}
                    />
                  </div>
                </div>

                <div className="admin-checkboxes-block">
                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      id="checkbox-handmade"
                      checked={isHechoAMano}
                      onChange={(e) => setIsHechoAMano(e.target.checked)}
                    />
                    <span>Hecho a mano</span>
                  </label>

                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      id="checkbox-homemade"
                      checked={isCasero}
                      onChange={(e) => setIsCasero(e.target.checked)}
                    />
                    <span>100% casero</span>
                  </label>

                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      id="checkbox-seasonal"
                      checked={isTemporada}
                      onChange={(e) => setIsTemporada(e.target.checked)}
                    />
                    <span>De temporada</span>
                  </label>

                  <label className="admin-checkbox-label">
                    <input
                      type="checkbox"
                      id="checkbox-customizable"
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

              {/* Panel 3: Ingredientes y alérgenos */}
              <div className="admin-form-panel">
                <h2 className="admin-panel-title">Ingredientes y alérgenos</h2>

                <div className="admin-form-group">
                  <label htmlFor="input-product-ingredients" className="admin-label">
                    Ingredientes *
                  </label>
                  <textarea
                    id="input-product-ingredients"
                    className="admin-textarea"
                    rows="2"
                    placeholder="Harina de trigo, leche, mantequilla, levadura..."
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

              {/* Acciones de publicación */}
              <div className="admin-form-actions-panel">
                <div className="admin-actions-buttons">
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    id="btn-cancel-create"
                    onClick={() => handleNav('/admin/productos')}
                    disabled={loading}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary"
                    id="btn-submit-product"
                    disabled={loading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                    <span>{loading ? 'Publicando...' : 'Publicar producto'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Fotografía y Vista previa */}
            <div className="admin-preview-column">
              {/* Fotografía del producto */}
              <div className="admin-preview-panel">
                <h2 className="admin-panel-title">Fotografía del producto</h2>

                <div className="admin-photo-container">
                  <img
                    src={imagenUrl.trim() || '/images/placeholder.svg'}
                    alt="Vista previa de imagen"
                    className="admin-preview-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholder.svg';
                    }}
                  />
                </div>

                <div className="admin-form-group">
                  <label htmlFor="input-product-image" className="admin-label">
                    URL de la fotografía
                  </label>
                  <input
                    type="url"
                    id="input-product-image"
                    className="admin-input"
                    placeholder="https://res.cloudinary.com/... o /images/conchas.png"
                    value={imagenUrl}
                    onChange={(e) => setImagenUrl(e.target.value)}
                  />
                  <span className="admin-input-hint">
                    JPG o PNG, máximo 5 MB. Mantén una imagen clara y cálida de tu pan.
                  </span>
                </div>
              </div>

              {/* Vista previa de la ficha pública */}
              <div className="admin-preview-panel">
                <h2 className="admin-panel-title">Vista previa de la ficha</h2>

                <div className="admin-live-card">
                  <div className="admin-live-card-badge">
                    <span className="admin-status-pill status-active">Nuevo</span>
                  </div>

                  <h3 className="admin-live-card-title">{nombre.trim() || 'Nombre del pan'}</h3>
                  <p className="admin-live-card-desc">
                    {descripcion.trim() || 'Descripción del pan artesanal preparado con recetas de nuestra tradición...'}
                  </p>

                  <hr className="admin-live-card-divider" />

                  <div className="admin-live-card-price-row">
                    <span className="admin-live-card-price">{formattedPreviewPrice} MXN</span>
                    <span className="admin-live-card-meta">
                      {categoryLabel} · {unidad} · {disponible}
                    </span>
                  </div>
                </div>

                <div className="admin-preview-info-box">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <span>
                    Al publicar, el nuevo pan aparecerá en el catálogo público. Revisa su foto, receta y precio.
                  </span>
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
