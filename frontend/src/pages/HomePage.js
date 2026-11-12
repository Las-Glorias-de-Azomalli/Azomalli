import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { BrandBanner } from '../components/BrandBanner';
import { CatalogSection } from '../components/CatalogSection';
import { CartDrawer } from '../components/CartDrawer';
import { Toast } from '../components/Toast';
import { Footer } from '../components/Footer';
import { ProductCustomizationModal } from '../components/ProductCustomizationModal';

import { useProducts } from '../hooks/useProducts';

export function HomePage({
  onNavigate,
  cart = [],
  isCartOpen = false,
  openCart = () => {},
  closeCart = () => {},
  addToCart = () => {},
  updateQuantity = () => {},
  removeItem = () => {},
  totalCount = 0,
  totalAmount = 0,
  toasts = [],
  showToast = () => {},
  removeToast = () => {}
}) {
  const {
    bestsellers,
    seasonal,
    filteredProducts,
    activeCategory,
    setActiveCategory
  } = useProducts();

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [selectedProductForCustomization, setSelectedProductForCustomization] = useState(null);
  const [initialCustomization, setInitialCustomization] = useState(null);

  const handleOpenCustomize = (product, existingItem = null) => {
    setSelectedProductForCustomization(product);
    setInitialCustomization(existingItem);
    setIsCustomizeModalOpen(true);
  };

  const handleCloseCustomize = () => {
    setIsCustomizeModalOpen(false);
    setSelectedProductForCustomization(null);
    setInitialCustomization(null);
  };

  const handleSaveCustomization = (product, customization) => {
    addToCart(product, customization);
    showToast(
      customization?.cartItemId
        ? `Personalización actualizada: ${product.nombre}`
        : `Añadido al carrito: ${product.nombre}`
    );
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    showToast(`Añadido al carrito: ${product.nombre}`);
  };

  const handleDrawerCheckout = () => {
    closeCart();
    if (onNavigate) {
      onNavigate('/cart');
    }
  };

  return (
    <div className="azomalli-app">
      <Navbar cartCount={totalCount} onOpenCart={openCart} onNavigate={onNavigate} />

      <main>
        <Hero
          onViewCart={() => onNavigate && onNavigate('/cart')}
          onOpenCart={openCart}
        />
        <BrandBanner />
        <CatalogSection
          bestsellers={bestsellers}
          seasonal={seasonal}
          filteredProducts={filteredProducts}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          onAddToCart={handleAddToCart}
          onCustomize={handleOpenCustomize}
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
        onCheckout={handleDrawerCheckout}
      />

      <ProductCustomizationModal
        isOpen={isCustomizeModalOpen}
        onClose={handleCloseCustomize}
        product={selectedProductForCustomization}
        initialCustomization={initialCustomization}
        onSave={handleSaveCustomization}
      />

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
