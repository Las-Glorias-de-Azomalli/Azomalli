import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ProductCustomizationModal } from './components/ProductCustomizationModal';
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
    addToCart,
    updateQuantity,
    removeItem,
    totalCount,
    totalAmount,
    checkout
  } = useCart();

  const { toasts, showToast, removeToast } = useToast();

  const [editingItem, setEditingItem] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleDrawerCheckout = () => {
    closeCart();
    navigateTo('/cart');
  };

  const handleEditCustomization = (item) => {
    setEditingItem(item);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedCustomization = (product, customization) => {
    addToCart(product, customization);
    showToast(`Personalización actualizada: ${product.nombre}`);
    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  const handleCompleteOrder = async (orderMetadata) => {
    const result = await checkout(orderMetadata);
    return result;
  };

  const renderCurrentPage = () => {
    switch (currentPath) {
      case '/login':
        return (
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
              onCheckout={handleDrawerCheckout}
            />
          </>
        );

      case '/cart':
        return (
          <CartPage
            cart={cart}
            totalCount={totalCount}
            totalAmount={totalAmount}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onEditCustomization={handleEditCustomization}
            onOpenCart={openCart}
            onNavigate={navigateTo}
          />
        );

      case '/checkout':
        return (
          <CheckoutPage
            cart={cart}
            totalCount={totalCount}
            totalAmount={totalAmount}
            onOpenCart={openCart}
            onNavigate={navigateTo}
            onCompleteOrder={handleCompleteOrder}
            onShowToast={showToast}
          />
        );

      case '/pedidos':
      case '/orders':
        return (
          <OrdersPage
            cartCount={totalCount}
            onOpenCart={openCart}
            onNavigate={navigateTo}
          />
        );

      case '/pedidos/calendario':
        return (
          <OrdersPage
            cartCount={totalCount}
            onOpenCart={openCart}
            onNavigate={navigateTo}
            initialView="calendar"
          />
        );

      default:
        if (currentPath.startsWith('/pedidos/') || currentPath.startsWith('/orders/')) {
          const parts = currentPath.split('/');
          const orderId = parts[2] || parts[1];
          return (
            <OrderDetailPage
              orderId={orderId}
              cartCount={totalCount}
              onOpenCart={openCart}
              onNavigate={navigateTo}
            />
          );
        }

        return (
          <HomePage
            onNavigate={navigateTo}
            cart={cart}
            isCartOpen={isCartOpen}
            openCart={openCart}
            closeCart={closeCart}
            addToCart={addToCart}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
            totalCount={totalCount}
            totalAmount={totalAmount}
            toasts={toasts}
            showToast={showToast}
            removeToast={removeToast}
          />
        );
    }
  };

  return (
    <>
      {renderCurrentPage()}

      {/* Modal para editar personalizaciones desde la vista de carrito */}
      {editingItem && (
        <ProductCustomizationModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingItem(null);
          }}
          product={{
            producto_id: editingItem.producto_id,
            nombre: editingItem.nombre,
            descripcion: editingItem.descripcion || 'Producto artesanal Las Glorias de Azomalli',
            precio_unitario: editingItem.precio_unitario,
            imagen_url: editingItem.imagen_url,
            categoria: editingItem.categoria,
            es_personalizable: true
          }}
          initialCustomization={editingItem}
          onSave={handleSaveEditedCustomization}
        />
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
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
