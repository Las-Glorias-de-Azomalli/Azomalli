import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrderDetailPage } from '../pages/OrderDetailPage';
import { DEMO_ORDERS } from '../pages/OrdersPage';
import * as AuthContextModule from '../context/AuthContext';
import * as OrderServiceModule from '../services/orderService';

describe('Pantalla OrderDetailPage (Figma 81:1829)', () => {
  beforeEach(() => {
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { nombre: 'Ana', primer_apellido: 'García', email: 'ana@example.com' },
      token: 'fake-jwt-token',
      isAuthenticated: true
    });
    jest.spyOn(OrderServiceModule, 'fetchOrderById').mockImplementation(async (id) => {
      return DEMO_ORDERS.find((o) => o.pedido_id === Number(id)) || DEMO_ORDERS[0];
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Renderiza encabezado del pedido AG-1048, banner y botón Volver a Mis pedidos', async () => {
    const handleNavigate = jest.fn();
    render(<OrderDetailPage orderId={1048} onNavigate={handleNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Pedido AG-1048')).toBeInTheDocument();
    });

    expect(screen.getByText('CADA DETALLE, HECHO CON CARIÑO')).toBeInTheDocument();
    expect(
      screen.getByText('Tu selección y los detalles de entrega, en un solo lugar.')
    ).toBeInTheDocument();

    // Botón Volver a Mis pedidos
    const btnBack = screen.getByRole('button', { name: /Volver a Mis pedidos/i });
    expect(btnBack).toBeInTheDocument();
    fireEvent.click(btnBack);
    expect(handleNavigate).toHaveBeenCalledWith('/pedidos');

    // Banner de preparación
    expect(screen.getByText('ENTREGA REGISTRADA')).toBeInTheDocument();
    expect(screen.getAllByText('En preparación').length).toBeGreaterThanOrEqual(1);
  });

  test('Renderiza tarjeta de Información del pedido con comprador, fechas y método de pago', async () => {
    render(<OrderDetailPage orderId={1048} />);

    await waitFor(() => {
      expect(screen.getByText('Información del pedido')).toBeInTheDocument();
    });

    expect(screen.getByText('Cuenta del comprador')).toBeInTheDocument();
    expect(screen.getByText('Ana · Demo')).toBeInTheDocument();

    expect(screen.getByText('Fecha de pedido')).toBeInTheDocument();
    expect(screen.getByText('Fecha de entrega')).toBeInTheDocument();
    expect(screen.getAllByText('04 oct 2026').length).toBeGreaterThanOrEqual(2);

    expect(screen.getByText('Lugar de entrega')).toBeInTheDocument();
    expect(screen.getByText('Panadería')).toBeInTheDocument();
    expect(screen.getByText('Recogida sin costo')).toBeInTheDocument();

    expect(screen.getByText('Método de pago')).toBeInTheDocument();
    expect(screen.getByText('Tarjeta')).toBeInTheDocument();

    expect(screen.getByText('Contenido del pedido')).toBeInTheDocument();
    expect(screen.getByText('3 productos · 7 piezas')).toBeInTheDocument();
  });

  test('Renderiza productos elegidos con personalizaciones (Conchas con sabor, topping, notas)', async () => {
    render(<OrderDetailPage orderId={1048} />);

    await waitFor(() => {
      expect(screen.getByText('Lo que elegiste')).toBeInTheDocument();
    });

    expect(
      screen.getByText('Personalización conservada por producto')
    ).toBeInTheDocument();

    // Productos presentes
    expect(screen.getByText('Conchas')).toBeInTheDocument();
    expect(screen.getByText('Roles de canela')).toBeInTheDocument();
    expect(screen.getByText('Panqué casero')).toBeInTheDocument();

    // Desglose de personalización de Conchas
    expect(screen.getByText('Vainilla')).toBeInTheDocument();
    expect(screen.getByText('Chispas')).toBeInTheDocument();
    expect(screen.getByText('Sin relleno')).toBeInTheDocument();
    expect(screen.getByText('Demo: sin azúcar extra en la superficie.')).toBeInTheDocument();

    // Cantidades e importes
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$76.00')).toBeInTheDocument();
    expect(screen.getAllByText('$120.00').length).toBeGreaterThanOrEqual(1);
  });

  test('Renderiza resumen financiero y total general ($296.00 MXN)', async () => {
    render(<OrderDetailPage orderId={1048} />);

    await waitFor(() => {
      expect(screen.getByText('Un pequeño gusto. Un gran momento.')).toBeInTheDocument();
    });

    expect(screen.getByText('Subtotal · 7 piezas')).toBeInTheDocument();
    expect(screen.getByText('Recogida en panadería')).toBeInTheDocument();
    expect(screen.getByText('Total general')).toBeInTheDocument();
    expect(screen.getAllByText('$296.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('MXN')).toBeInTheDocument();
  });
});