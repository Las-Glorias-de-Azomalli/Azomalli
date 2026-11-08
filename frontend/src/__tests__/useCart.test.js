import { renderHook, act } from '@testing-library/react';
import { useCart } from '../hooks/useCart';

describe('Hook useCart', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleProduct = {
    producto_id: 1,
    nombre: 'Concha de Vainilla',
    precio_unitario: 18.0,
    imagen_url: '/images/concha.png',
  };

  test('Inicia con carrito vacío y cerrado', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.cart).toEqual([]);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.totalAmount).toBe(0);
  });

  test('Permite abrir y cerrar el carrito', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.openCart();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeCart();
    });
    expect(result.current.isOpen).toBe(false);
  });

  test('Agrega un producto nuevo y actualiza cantidades y subtotales', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addToCart(sampleProduct);
    });

    expect(result.current.cart.length).toBe(1);
    expect(result.current.cart[0].quantity).toBe(1);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.totalAmount).toBe(18.0);

    // Si se agrega el mismo producto, incrementa quantity a 2
    act(() => {
      result.current.addToCart(sampleProduct);
    });

    expect(result.current.cart.length).toBe(1);
    expect(result.current.cart[0].quantity).toBe(2);
    expect(result.current.totalCount).toBe(2);
    expect(result.current.totalAmount).toBe(36.0);
  });

  test('Modifica cantidad y elimina si la cantidad llega a cero', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addToCart(sampleProduct);
    });

    // Disminuir cantidad a 0 -> se elimina
    act(() => {
      result.current.updateQuantity(sampleProduct.producto_id, -1);
    });

    expect(result.current.cart).toEqual([]);
    expect(result.current.totalCount).toBe(0);
  });

  test('Sincroniza el carrito con localStorage', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addToCart(sampleProduct);
    });

    const stored = JSON.parse(localStorage.getItem('azomalli_cart'));
    expect(stored).toHaveLength(1);
    expect(stored[0].nombre).toBe('Concha de Vainilla');
  });
});

