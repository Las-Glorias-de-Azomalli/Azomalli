import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CartPage } from '../pages/CartPage';
import * as AuthContextModule from '../context/AuthContext';

const sampleCart = [
  {
    cartItemId: 'item-1-abc',
    producto_id: 1,
    nombre: 'Conchas',
    precio_unitario: 25.0,
    imagen_url: '/images/conchas.png',
    categoria: 'DULCE',
    quantity: 4,
    sabor: { opcion: 'Vainilla' },
    topping: { opcion: 'Chispas' },
    relleno: { opcion: 'Sin relleno' },
    notas: 'Demo: sin azúcar extra en la superficie.'
  },
  {
    cartItemId: 'item-2-xyz',
    producto_id: 2,
    nombre: 'Roles de canela',
    precio_unitario: 38.0,
    imagen_url: '/images/roles_canela.png',
    categoria: 'DULCE',
    quantity: 2
  }
];

describe('Componente CartPage', () => {
  beforeEach(() => {
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { nombre: 'Ana', email: 'ana@example.com' },
      isAuthenticated: true
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Muestra estado vacío si el carrito no tiene productos', () => {
    render(
      <CartPage
        cart={[]}
        totalCount={0}
        totalAmount={0}
        onUpdateQuantity={jest.fn()}
        onRemoveItem={jest.fn()}
        onNavigate={jest.fn()}
      />
    );

    expect(screen.getByText('Tu carrito está vacío.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Explorar catálogo/i })).toBeInTheDocument();
  });

  test('Renderiza encabezados y productos del diseño Figma (15:10487)', () => {
    render(
      <CartPage
        cart={sampleCart}
        totalCount={6}
        totalAmount={176.0}
        onUpdateQuantity={jest.fn()}
        onRemoveItem={jest.fn()}
        onNavigate={jest.fn()}
      />
    );

    expect(screen.getByText('PARA COMPARTIR. PARA DISFRUTAR.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Tu carrito' })).toBeInTheDocument();
    expect(screen.getByText(/6 piezas elegidas con cariño/i)).toBeInTheDocument();

    // Nombres de productos
    expect(screen.getByText('Conchas')).toBeInTheDocument();
    expect(screen.getByText('Roles de canela')).toBeInTheDocument();

    // Caja de personalización
    expect(screen.getByText('PERSONALIZACIÓN')).toBeInTheDocument();
    expect(screen.getByText('Vainilla')).toBeInTheDocument();
    expect(screen.getByText('Chispas')).toBeInTheDocument();
    expect(screen.getByText('Sin relleno')).toBeInTheDocument();
    expect(screen.getByText('Demo: sin azúcar extra en la superficie.')).toBeInTheDocument();

    // Resumen
    expect(screen.getByText('Resumen del pedido')).toBeInTheDocument();
    expect(screen.getByText('Subtotal · 6 piezas')).toBeInTheDocument();
    expect(screen.getByText('Recogida en panadería')).toBeInTheDocument();
    expect(screen.getByText('Sin costo')).toBeInTheDocument();
    expect(screen.getAllByText('$176.00').length).toBeGreaterThan(0);
  });

  test('Permite modificar cantidades y quitar productos', () => {
    const handleUpdate = jest.fn();
    const handleRemove = jest.fn();

    render(
      <CartPage
        cart={sampleCart}
        totalCount={6}
        totalAmount={176.0}
        onUpdateQuantity={handleUpdate}
        onRemoveItem={handleRemove}
        onNavigate={jest.fn()}
      />
    );

    // Clic en aumentar cantidad del primer producto
    const plusButtons = screen.getAllByRole('button', { name: /Aumentar cantidad/i });
    fireEvent.click(plusButtons[0]);
    expect(handleUpdate).toHaveBeenCalledWith('item-1-abc', 1);

    // Clic en quitar producto
    const removeButtons = screen.getAllByRole('button', { name: /Quitar producto/i });
    fireEvent.click(removeButtons[0]);
    expect(handleRemove).toHaveBeenCalledWith('item-1-abc');
  });

  test('El botón Continuar pedido navega a /checkout cuando el usuario está autenticado', () => {
    const handleNavigate = jest.fn();

    render(
      <CartPage
        cart={sampleCart}
        totalCount={6}
        totalAmount={176.0}
        onUpdateQuantity={jest.fn()}
        onRemoveItem={jest.fn()}
        onNavigate={handleNavigate}
      />
    );

    const continueBtn = document.getElementById('continue-order-btn');
    fireEvent.click(continueBtn);

    expect(handleNavigate).toHaveBeenCalledWith('/checkout');
  });
});
