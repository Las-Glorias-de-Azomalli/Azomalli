import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OrdersPage, DEMO_ORDERS } from '../pages/OrdersPage';
import * as AuthContextModule from '../context/AuthContext';
import * as OrderServiceModule from '../services/orderService';

describe('Pantalla OrdersPage (Figma 15:10586 y 81:1619)', () => {
  beforeEach(() => {
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { nombre: 'Ana', primer_apellido: 'García', email: 'ana@example.com' },
      token: 'fake-jwt-token',
      isAuthenticated: true
    });
    jest.spyOn(OrderServiceModule, 'fetchUserOrders').mockImplementation(async () => {
      return DEMO_ORDERS;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Renderiza encabezado, botón Explorar catálogo y vista Tabla por defecto (Figma 15:10586)', async () => {
    const handleNavigate = jest.fn();
    render(<OrdersPage onNavigate={handleNavigate} />);

    // Encabezado
    expect(screen.getByText('DE NUESTRAS MANOS A TU MESA')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mis pedidos' })).toBeInTheDocument();
    expect(
      screen.getByText('Consulta tu historial y descubre cómo va tu próximo antojo.')
    ).toBeInTheDocument();

    // Botón Explorar catálogo
    const btnExplore = screen.getByRole('button', { name: /Explorar catálogo/i });
    expect(btnExplore).toBeInTheDocument();
    fireEvent.click(btnExplore);
    expect(handleNavigate).toHaveBeenCalledWith('/');

    // Filtros de estado y controles de vista
    expect(screen.getByRole('tab', { name: /Todos/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /En curso/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tabla' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Calendario' })).toBeInTheDocument();

    // Columnas de la tabla
    expect(screen.getByText('Pedido')).toBeInTheDocument();
    expect(screen.getAllByText('Fecha de pedido').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Fecha de entrega').length).toBeGreaterThan(0);
    expect(screen.getByText('Lugar de entrega')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('Pago')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Acción')).toBeInTheDocument();

    // Esperar a que se listen los pedidos demo de Figma (AG-1048, AG-1044, AG-1038)
    await waitFor(() => {
      expect(screen.getByText('AG-1048')).toBeInTheDocument();
      expect(screen.getByText('AG-1044')).toBeInTheDocument();
      expect(screen.getByText('AG-1038')).toBeInTheDocument();
    });

    // Validar estados
    expect(screen.getByText('En preparación')).toBeInTheDocument();
    expect(screen.getAllByText('Entregado').length).toBeGreaterThanOrEqual(2);

    // Validar importes
    expect(screen.getByText('$296.00')).toBeInTheDocument();
    expect(screen.getByText('$240.00')).toBeInTheDocument();
    expect(screen.getByText('$126.00')).toBeInTheDocument();
  });

  test('Filtra correctamente por pedidos en curso al presionar En curso', async () => {
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('AG-1048')).toBeInTheDocument();
    });

    const btnEnCurso = screen.getByRole('tab', { name: /En curso/i });
    fireEvent.click(btnEnCurso);

    // AG-1048 (En preparación) debe seguir visible
    expect(screen.getByText('AG-1048')).toBeInTheDocument();

    // Los entregados (AG-1044 y AG-1038) no deben estar en la tabla
    expect(screen.queryByText('AG-1044')).not.toBeInTheDocument();
    expect(screen.queryByText('AG-1038')).not.toBeInTheDocument();
  });

  test('Cambia a la vista Calendario (Figma 81:1619) con cuadrícula, días y tarjetas de entrega', async () => {
    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('AG-1048')).toBeInTheDocument();
    });

    const btnCalendar = screen.getByRole('tab', { name: 'Calendario' });
    fireEvent.click(btnCalendar);

    // Encabezado de mes y leyenda (inicializa en Octubre 2026 por el pedido activo AG-1048)
    await waitFor(() => {
      expect(screen.getByText('Octubre 2026')).toBeInTheDocument();
    });
    expect(screen.getByText('Por fecha de entrega')).toBeInTheDocument();

    // Días de la semana
    ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].forEach((day) => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });

    // En octubre 2026 debe figurar la entrega de AG-1048
    await waitFor(() => {
      expect(screen.getByText('AG-1048')).toBeInTheDocument();
      expect(screen.getByText('$296.00 · 7 piezas')).toBeInTheDocument();
    });

    // Historial complementario para entregas fuera del mes (AG-1038 en septiembre)
    expect(screen.getByText('También en tu historial')).toBeInTheDocument();
    expect(screen.getByText('AG-1038')).toBeInTheDocument();
    expect(screen.getByText('4 piezas')).toBeInTheDocument();
  });

  test('Al hacer clic en Ver detalle navega a la ruta de detalle del pedido', async () => {
    const handleNavigate = jest.fn();
    render(<OrdersPage onNavigate={handleNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('AG-1048')).toBeInTheDocument();
    });

    const detailButtons = screen.getAllByRole('button', { name: 'Ver detalle' });
    expect(detailButtons.length).toBeGreaterThan(0);

    fireEvent.click(detailButtons[0]);
    expect(handleNavigate).toHaveBeenCalledWith('/pedidos/1048');
  });

  test('Redirige a /login y no muestra pantalla mock si el usuario no está autenticado', () => {
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false
    });

    const handleNavigate = jest.fn();
    const { container } = render(<OrdersPage onNavigate={handleNavigate} />);

    expect(handleNavigate).toHaveBeenCalledWith('/login');
    // No debe renderizarse la pantalla de pedidos ni pedidos mock
    expect(screen.queryByText('Mis pedidos')).not.toBeInTheDocument();
    expect(screen.queryByText('AG-1048')).not.toBeInTheDocument();
  });

  test('No aplica fallback a mock si el usuario no tiene pedidos registrados', async () => {
    jest.spyOn(OrderServiceModule, 'fetchUserOrders').mockImplementation(async () => {
      return [];
    });

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('Aún no tienes pedidos registrados.')).toBeInTheDocument();
    });

    // Asegura que no se muestran pedidos mock como AG-1048
    expect(screen.queryByText('AG-1048')).not.toBeInTheDocument();
  });

  test('El calendario empieza en el mes del pedido activo más antiguo (ej. Noviembre 2026)', async () => {
    const novemberOrders = [
      {
        pedido_id: 2001,
        codigo_pedido: 'AG-2001',
        fecha_entrega: '2026-11-20',
        estado: 'PENDIENTE',
        monto_total: 150.0,
        total_piezas: 3
      },
      {
        pedido_id: 2002,
        codigo_pedido: 'AG-2002',
        fecha_entrega: '2026-11-10',
        estado: 'PENDIENTE',
        monto_total: 100.0,
        total_piezas: 2
      },
      {
        pedido_id: 2000,
        codigo_pedido: 'AG-2000',
        fecha_entrega: '2026-10-01',
        estado: 'ENTREGADO',
        monto_total: 80.0,
        total_piezas: 1
      }
    ];

    jest.spyOn(OrderServiceModule, 'fetchUserOrders').mockResolvedValue(novemberOrders);

    render(<OrdersPage initialView="calendar" />);

    await waitFor(() => {
      expect(screen.getByText('Noviembre 2026')).toBeInTheDocument();
      expect(screen.getByText('AG-2002')).toBeInTheDocument();
      expect(screen.getByText('AG-2001')).toBeInTheDocument();
    });
  });
});