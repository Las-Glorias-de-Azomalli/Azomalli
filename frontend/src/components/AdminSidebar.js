import React from 'react';

export function AdminSidebar({ currentSection = 'catalogo', onNavigate }) {
  const handleNav = (path, e) => {
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <aside className="admin-sidebar" aria-label="Navegación de administración">
      {/* Identidad */}
      <div className="admin-sidebar-identity">
        <a
          href="/admin/productos"
          className="admin-brand-link"
          onClick={(e) => handleNav('/admin/productos', e)}
        >
          <img
            src="/images/logo.png"
            alt="Logo Las Glorias de Azomalli"
            className="admin-brand-logo"
          />
          <div className="admin-brand-text">
            <span className="admin-brand-title">Las Glorias<br />de Azomalli</span>
            <span className="admin-editorial-badge">ADMINISTRACIÓN</span>
          </div>
        </a>
      </div>

      <hr className="admin-sidebar-divider" />

      {/* Secciones */}
      <nav className="admin-sidebar-nav">
        <ul className="admin-nav-list">
          <li>
            <a
              href="#dashboard"
              className={`admin-nav-item ${currentSection === 'dashboard' ? 'is-active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleNav('/admin/productos');
              }}
            >
              <svg className="admin-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
              <span>Dashboard</span>
            </a>
          </li>

          <li>
            <a
              href="/admin/productos"
              className={`admin-nav-item ${currentSection === 'catalogo' ? 'is-active' : ''}`}
              id="admin-nav-catalogo"
              onClick={(e) => handleNav('/admin/productos', e)}
            >
              <svg className="admin-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m2 22 10-10" />
                <path d="M16 8a4.4 4.4 0 0 0-6.2 0" />
                <path d="M18.8 5.2a8.8 8.8 0 0 0-12.4 0" />
                <path d="M11 13a4.4 4.4 0 0 0 0-6.2" />
                <path d="M8.2 15.8a8.8 8.8 0 0 0 0-12.4" />
                <path d="M22 2a11.2 11.2 0 0 0-15.8 0" />
                <path d="M22 2a11.2 11.2 0 0 1 0 15.8" />
              </svg>
              <span>Catálogo</span>
            </a>
          </li>

          <li>
            <a
              href="/pedidos"
              className={`admin-nav-item ${currentSection === 'pedidos' ? 'is-active' : ''}`}
              onClick={(e) => handleNav('/pedidos', e)}
            >
              <svg className="admin-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <path d="M12 11h4" />
                <path d="M12 16h4" />
                <path d="M8 11h.01" />
                <path d="M8 16h.01" />
              </svg>
              <span>Pedidos e historial</span>
            </a>
          </li>

          <li>
            <a
              href="#clientes"
              className={`admin-nav-item ${currentSection === 'clientes' ? 'is-active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                handleNav('/admin/productos');
              }}
            >
              <svg className="admin-nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 21a8 8 0 0 0-16 0" />
                <circle cx="10" cy="8" r="5" />
                <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
              </svg>
              <span>Clientes</span>
            </a>
          </li>
        </ul>
      </nav>

      {/* Acceso a tienda pública */}
      <div className="admin-sidebar-footer">
        <hr className="admin-sidebar-divider" />
        <a
          href="/"
          className="admin-view-store-link"
          id="admin-link-public-store"
          onClick={(e) => handleNav('/', e)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
          <span>Ver tienda pública</span>
        </a>
      </div>
    </aside>
  );
}
