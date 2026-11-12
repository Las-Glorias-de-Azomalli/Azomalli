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

  const addToCart = useCallback((product, customization = null) => {
    const prodId = product.producto_id;
    const prodName = product.nombre;
    const prodPrice = Number(product.precio_unitario ?? 0);
    const prodImage = product.imagen_url || '/images/placeholder.svg';
    const quantity = customization?.quantity ? Number(customization.quantity) : 1;

    setCart((prevCart) => {
      // 1. Edición de un item específico en el carrito
      if (customization?.cartItemId) {
        return prevCart.map((item) => {
          if (item.cartItemId === customization.cartItemId) {
            return {
              ...item,
              quantity: quantity,
              precio_unitario: Number(customization.precio_unitario ?? item.precio_unitario),
              sabor: customization.sabor !== undefined ? customization.sabor : item.sabor,
              topping: customization.topping !== undefined ? customization.topping : item.topping,
              relleno: customization.relleno !== undefined ? customization.relleno : item.relleno,
              notas: customization.notas !== undefined ? customization.notas : item.notas,
              categoria: product.categoria || item.categoria
            };
          }
          return item;
        });
      }

      // 2. Nuevo item con personalización
      const hasCustomization = Boolean(
        customization &&
        (customization.sabor || customization.topping || customization.relleno || customization.notas)
      );

      if (hasCustomization) {
        const uniqueId = `item-${prodId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        return [
          ...prevCart,
          {
            cartItemId: uniqueId,
            producto_id: prodId,
            nombre: prodName,
            precio_unitario: Number(customization.precio_unitario ?? prodPrice),
            imagen_url: prodImage,
            categoria: product.categoria,
            quantity,
            es_personalizable: true,
            sabor: customization.sabor || null,
            topping: customization.topping || null,
            relleno: customization.relleno || null,
            notas: customization.notas || null
          }
        ];
      }

      // 3. Item estándar sin personalizaciones
      const existingIndex = prevCart.findIndex(
        (item) => item.producto_id === prodId && !item.sabor && !item.topping && !item.relleno && !item.notas
      );

      if (existingIndex > -1) {
        return prevCart.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }

      const defaultUniqueId = `item-${prodId}-${Date.now()}`;
      return [
        ...prevCart,
        {
          cartItemId: defaultUniqueId,
          producto_id: prodId,
          nombre: prodName,
          precio_unitario: prodPrice,
          imagen_url: prodImage,
          categoria: product.categoria,
          quantity
        }
      ];
    });
  }, []);

  const updateQuantity = useCallback((id, change) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.cartItemId === id || item.producto_id === id) {
            const newQty = item.quantity + change;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  }, []);

  const removeItem = useCallback((id) => {
    setCart((prevCart) => prevCart.filter((item) => item.cartItemId !== id && item.producto_id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => {
    const itemPrice = Number(item.precio_unitario ?? 0);
    return sum + itemPrice * item.quantity;
  }, 0);

  const checkout = useCallback(async (orderMetadata = {}) => {
    const formattedItems = cart.map((item) => ({
      producto_id: item.producto_id,
      cantidad: item.quantity,
      precio_unitario: item.precio_unitario,
      sabor: item.sabor,
      topping: item.topping,
      relleno: item.relleno,
      notas: item.notas
    }));

    const orderData = {
      items: formattedItems,
      fecha_entrega: orderMetadata.fecha_entrega,
      lugar_entrega: orderMetadata.lugar_entrega || 'Panadería · recogida sin costo',
      pago: 'EFECTIVO'
    };

    const token = orderMetadata.token || localStorage.getItem('azomalli_token');
    const result = await createOrder(orderData, token);
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
