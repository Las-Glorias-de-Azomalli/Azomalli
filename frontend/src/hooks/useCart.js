import { useState, useEffect, useCallback } from 'react';
import { createOrder } from '../services/orderService';

const STORAGE_KEY = 'azomalli_cart';

export function useCart() {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Error al recuperar carrito de localStorage:', e);
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  // Sincronizar cambios en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Error al guardar carrito en localStorage:', e);
    }
  }, [cart]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addToCart = useCallback((product) => {
    const prodId = product.producto_id;
    const prodName = product.nombre;
    const prodPrice = Number(product.precio_unitario ?? 0);
    const prodImage = product.imagen_url || '/images/placeholder.svg';

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.producto_id === prodId);
      if (existing) {
        return prevCart.map((item) =>
          item.producto_id === prodId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        {
          producto_id: prodId,
          nombre: prodName,
          precio_unitario: prodPrice,
          imagen_url: prodImage,
          quantity: 1
        }
      ];
    });
  }, []);

  const updateQuantity = useCallback((id, change) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.producto_id === id) {
            const newQty = item.quantity + change;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  }, []);

  const removeItem = useCallback((id) => {
    setCart((prevCart) => prevCart.filter((item) => item.producto_id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => {
    const itemPrice = Number(item.precio_unitario ?? 0);
    return sum + itemPrice * item.quantity;
  }, 0);

  const checkout = useCallback(async () => {
    const orderData = {
      items: cart,
      user: localStorage.getItem('azomalli_user')
        ? JSON.parse(localStorage.getItem('azomalli_user')).name
        : 'Invitado'
    };

    const result = await createOrder(orderData);
    clearCart();
    closeCart();
    return result;
  }, [cart, clearCart, closeCart]);

  return {
    cart,
    isOpen,
    openCart,
    closeCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    totalCount,
    totalAmount,
    checkout
  };
}
