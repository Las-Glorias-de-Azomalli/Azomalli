import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export function Navbar({ cartCount = 0, onOpenCart, onNavigate }) {
  const [bump, setBump] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Hook de autenticación (si está dentro del provider)
  let auth = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    auth = useAuth();
  } catch {
    auth = null;
  }

  const user = auth ? auth.user : null;
  const isAuthenticated = auth ? auth.isAuthenticated : false;
  const logout = auth ? auth.logout : () => {};

  // Efecto bump cuando cambia el contador del carrito
  useEffect(() => {
    if (cartCount === 0) return;
    setBump(true);
    const timer = setTimeout(() => setBump(false), 300);
    return () => clearTimeout(timer);
  }, [cartCount]);

  // Cerrar dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navigateTo = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const scrollToSection = (id) => {
    const isHomePage = window.location.pathname === '/' || window.location.pathname === '';
    if (!isHomePage) {
      navigateTo('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          const navbarOffset = 112;
          const elementPosition = el.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - navbarOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    const el = document.getElementById(id);
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

  const handleProfileClick = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      setDropdownOpen((prev) => !prev);
    } else {
      navigateTo('/login');
    }
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigateTo('/');
  };

  // Obtener el nombre del usuario a mostrar
  const displayName = user
    ? user.nombre || (user.email ? user.email.split('@')[0] : 'Usuario')
    : null;

  return (
    <header className="navbar-wrapper">
      <div className="navbar-container">
        {/* Identidad de la Panadería */}
        <a
          href="/"
          className="brand-identity"
          id="brand-logo-link"
          onClick={(e) => {
            e.preventDefault();
            navigateTo('/');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img
            src="/images/logo.png"
            alt="Logo Las Glorias de Azomalli"
            className="brand-logo"
          />
          <span className="brand-name">Las Glorias de Azomalli</span>
        </a>

        {/* Enlaces de Navegación */}
        <nav className="nav-links">
          <a
            href="#catalogo"
            className="nav-link"
            id="nav-catalogo-link"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('catalogo');
            }}
          >
            Catálogo
          </a>

          <a
            href="#pedidos"
            className="nav-link"
            id="nav-pedidos-link"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('seccion-mas-vendidos');
            }}
          >
            Mis pedidos
          </a>

          {/* Apartado Cuenta / Mi Perfil (Figma 17:70 y 17:77) */}
          <div className="nav-profile-container" ref={dropdownRef}>
            <button
              type="button"
              className={`nav-profile-btn ${dropdownOpen ? 'is-active' : ''}`}
              id="nav-profile-btn"
              onClick={handleProfileClick}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              aria-label={isAuthenticated ? `Perfil de ${displayName}` : 'Iniciar sesión'}
            >
              {/* Icono user-round */}
              <svg
                className="icon-user"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="5" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>

              <span className="nav-profile-text-wrap">
                <span className="nav-profile-label" id="nav-profile-label">
                  Mi Perfil
                </span>
                {isAuthenticated && displayName && (
                  <span className="nav-profile-name" id="nav-profile-name">
                    {displayName}
                  </span>
                )}
              </span>

              {/* Icono chevron-down */}
              <svg
                className={`icon-chevron ${dropdownOpen ? 'rotated' : ''}`}
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {/* Menú Dropdown de Usuario */}
            {dropdownOpen && (
              <div
                className="nav-profile-dropdown is-open"
                id="nav-profile-dropdown"
                role="menu"
              >
                {isAuthenticated ? (
                  <>
                    <div className="dropdown-user-header">
                      <span className="dropdown-greeting">Hola,</span>
                      <strong className="dropdown-name" id="dropdown-user-display">
                        {displayName}
                      </strong>
                      <span className="dropdown-email">{user?.email}</span>
                      {user?.rol && (
                        <span className="dropdown-role-badge">{user.rol}</span>
                      )}
                    </div>

                    <ul className="dropdown-options">
                      <li>
                        <button
                          type="button"
                          className="dropdown-item-btn"
                          onClick={() => {
                            setDropdownOpen(false);
                            scrollToSection('catalogo');
                          }}
                        >
                          Catálogo de panes
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item-btn"
                          onClick={() => {
                            setDropdownOpen(false);
                            scrollToSection('seccion-mas-vendidos');
                          }}
                        >
                          Mis pedidos
                        </button>
                      </li>
                      <li className="dropdown-divider"></li>
                      <li>
                        <button
                          type="button"
                          className="dropdown-item-btn dropdown-logout-btn"
                          id="btn-logout"
                          onClick={handleLogout}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                          </svg>
                          Cerrar sesión
                        </button>
                      </li>
                    </ul>
                  </>
                ) : (
                  <div className="dropdown-guest-card">
                    <p className="dropdown-guest-text">
                      Inicia sesión para guardar tu carrito y ver tus pedidos.
                    </p>
                    <button
                      type="button"
                      className="dropdown-login-btn"
                      id="btn-login-nav"
                      onClick={() => {
                        setDropdownOpen(false);
                        navigateTo('/login');
                      }}
                    >
                      Iniciar sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botón Carrito con Contador dinámico */}
          <button
            type="button"
            className="cart-btn"
            id="open-cart-btn"
            onClick={onOpenCart}
            aria-label="Ver carrito de compras"
          >
            <svg
              className="icon-svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <span className={`cart-badge ${bump ? 'bump' : ''}`} id="cart-counter">
              {cartCount}
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
}
