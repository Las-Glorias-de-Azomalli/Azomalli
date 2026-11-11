import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export function LoginPage({ cartCount = 0, onOpenCart, onNavigate, onShowToast }) {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigateTo = (path) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleFillDemo = () => {
    setEmail('ana@example.com');
    setPassword('Panaderia123!');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Por favor ingresa tu correo y contraseña');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (onShowToast) {
        const nombre = result?.cuenta?.nombre || 'Bienvenido';
        onShowToast(`¡Hola de nuevo, ${nombre}! Sesión iniciada con éxito.`, 'success');
      }
      // Redirigir al inicio tras login exitoso
      navigateTo('/');
    } catch (err) {
      setErrorMessage(err.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <Navbar cartCount={cartCount} onOpenCart={onOpenCart} onNavigate={onNavigate} />

      <main className="login-main-container">
        <section className="login-card-layout">
          {/* Tarjeta Visual: Invitación Artesanal (Figma 15:10381) */}
          <div className="login-visual-card">
            <img
              src="/images/hero_conchas.png"
              alt="Conchas recién horneadas artesanales"
              className="login-visual-bg"
            />
            <div className="login-visual-overlay" />

            {/* Sello Casero Circular (Figma 15:10384) */}
            <div className="login-stamp-badge">
              <span className="stamp-percent">100%</span>
              <span className="stamp-label">CASERO</span>
            </div>

            {/* Mensaje de Bienvenida (Figma 15:10387) */}
            <div className="login-visual-welcome">
              <h2 className="welcome-headline">
                Qué gusto tenerte<br />de vuelta.
              </h2>
              <p className="welcome-subline">
                Hecho a mano. Para compartir. Para disfrutar.
              </p>
            </div>
          </div>

          {/* Tarjeta del Formulario: Formulario de Acceso (Figma 15:10390) */}
          <div className="login-form-card">
            <header className="login-header-group">
              <span className="eyebrow-accent">TU CUENTA, TU PAN FAVORITO</span>
              <h1 className="login-title">Iniciar sesión</h1>
              <p className="login-description">
                Entra para guardar tu carrito y seguir cada paso de tu pedido.
              </p>
            </header>

            {errorMessage && (
              <div
                className="login-error-banner"
                id="login-error-message"
                role="alert"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              {/* Campo Correo Electrónico (Figma 15:10395) */}
              <div className="form-group">
                <label htmlFor="login-email" className="form-label">
                  Correo electrónico
                </label>
                <div className="input-icon-wrapper">
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    className="form-input"
                    placeholder="ana@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <svg
                    className="input-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </div>
                <button
                  type="button"
                  className="demo-account-hint"
                  onClick={handleFillDemo}
                  title="Haz clic para autocompletar credenciales demo"
                >
                  Cuenta de demostración
                </button>
              </div>

              {/* Campo Contraseña (Figma 15:10401) */}
              <div className="form-group">
                <label htmlFor="login-password" className="form-label">
                  Contraseña
                </label>
                <div className="input-icon-wrapper">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" x2="22" y1="2" y2="22" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Opciones de Acceso: Recordarme y Olvido (Figma 15:10406) */}
              <div className="login-options-row">
                <label className="checkbox-container" htmlFor="login-remember">
                  <input
                    type="checkbox"
                    id="login-remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-custom" />
                  <span className="checkbox-text">Recordarme</span>
                </label>

                <a
                  href="#recuperar"
                  className="forgot-password-link"
                  onClick={(e) => {
                    e.preventDefault();
                    if (onShowToast) {
                      onShowToast('Función de recuperación en desarrollo', 'info');
                    }
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Botón Acción (Figma 15:10413) */}
              <button
                type="submit"
                id="login-submit-btn"
                className="btn-login-action"
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Iniciando sesión...' : 'Iniciar sesión'}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              </button>
            </form>

            {/* Separador (Figma 15:10416) */}
            <div className="login-divider" />

            {/* Acceso a Registro (Figma 15:10417) */}
            <div className="login-register-prompt">
              <span className="prompt-text">¿Aún no tienes una cuenta?</span>
              <a
                href="#registro"
                className="prompt-link"
                onClick={(e) => {
                  e.preventDefault();
                  if (onShowToast) {
                    onShowToast('Módulo de registro disponible en /api/auth/register', 'info');
                  }
                }}
              >
                Regístrate
              </a>
            </div>

            {/* Nota Informativa (Figma 15:10420) */}
            <footer className="login-security-note">
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
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Usamos tu correo únicamente para tu cuenta y tus pedidos.</span>
            </footer>
          </div>
        </section>
      </main>

      {/* Pie de compra (Figma 15:10423) */}
      <footer className="login-footer-bar">
        <span className="footer-bar-headline">De nuestras manos a tu mesa.</span>
        <span className="footer-bar-subtext">
          Las Glorias de Azomalli · Datos de demostración · MXN
        </span>
      </footer>
    </div>
  );
}
