import React from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { BrandBanner } from '../components/BrandBanner';
import { CatalogSection } from '../components/CatalogSection';
import { CartDrawer } from '../components/CartDrawer';
import { Toast } from '../components/Toast';
import { Footer } from '../components/Footer';

import { useProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useToast } from '../hooks/useToast';

export function HomePage() {
  const {
    bestsellers,
    seasonal,
    filteredProducts,
    activeCategory,
    setActiveCategory
  } = useProducts();

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

  const handleAddToCart = (product) => {
    addToCart(product);
    showToast(`Añadido al carrito: ${product.nombre}`);
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

  return (
    <div className="azomalli-app">
      <Navbar cartCount={totalCount} onOpenCart={openCart} />

      <main>
        <Hero />
        <BrandBanner />
        <CatalogSection
          bestsellers={bestsellers}
          seasonal={seasonal}
          filteredProducts={filteredProducts}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          onAddToCart={handleAddToCart}
        />
      </main>

      <Footer />

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
    </div>
  );
}
