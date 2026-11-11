import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { useCart } from './hooks/useCart';
import { useToast } from './hooks/useToast';
import { CartDrawer } from './components/CartDrawer';
import { Toast } from './components/Toast';

function AppRouter() {
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  });

  const {
    cart,
    isOpen: isCartOpen,
    openCart,
    closeCart,
    updateQuantity,
    removeItem,
    totalCount,
    totalAmount,
    checkout
  } = useCart();

  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigateTo = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
      setCurrentPath(path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCheckout = async () => {
    try {
      const result = await checkout();
      if (result && result.success) {
        showToast(result.message || '¡Pedido realizado con éxito!', 'success', 5000);
      }
    } catch {
      showToast('Ocurrió un error al procesar el pedido', 'error');
    }
  };

  const isLogin = currentPath === '/login';

  return (
    <>
      {isLogin ? (
        <>
          <LoginPage
            cartCount={totalCount}
            onOpenCart={openCart}
            onNavigate={navigateTo}
            onShowToast={showToast}
          />
          <CartDrawer
            isOpen={isCartOpen}
            onClose={closeCart}
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            totalAmount={totalAmount}
            onCheckout={handleCheckout}
          />
          <Toast toasts={toasts} onRemove={removeToast} />
        </>
      ) : (
        <HomePage onNavigate={navigateTo} />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
