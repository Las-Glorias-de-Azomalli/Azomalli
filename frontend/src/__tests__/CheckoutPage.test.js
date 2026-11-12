import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CheckoutPage } from '../pages/CheckoutPage';
import * as AuthContextModule from '../context/AuthContext';

const sampleCart = [
  {
    cartItemId: 'item-1',
    producto_id: 1,
    nombre: 'Conchas',
    precio_unitario: 25.0,
    imagen_url: '/images/conchas.png',
    quantity: 4,
    sabor: { opcion: 'Vainilla' },
    topping: { opcion: 'Chispas' },
    relleno: { opcion: 'Sin relleno' },
    notas: 'Demo: sin azúcar extra en la superficie.'
  },
  {
    cartItemId: 'item-2',
    producto_id: 2,
    nombre: 'Roles de canela',
    precio_unitario: 38.0,
    imagen_url: '/images/roles_canela.png',
    quantity: 2
  }
];

describe('Componente CheckoutPage', () => {
  beforeEach(() => {
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { nombre: 'Ana', primer_apellido: 'García', email: 'ana@example.com' },
      isAuthenticated: true
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Renderiza elementos del diseño Figma 81:1413 (calendario, entrega y pago en efectivo)', () => {
    render(
      <CheckoutPage
        cart={sampleCart}
        totalCount={6}
        totalAmount={176.0}
        onCompleteOrder={jest.fn()}
      />
    );

    expect(screen.getByText('FINALIZAR PEDIDO')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Un día para disfrutarlo.' })).toBeInTheDocument();
    expect(screen.getByText('Volver al carrito')).toBeInTheDocument();
    expect(screen.getByText('Fecha y confirmación')).toBeInTheDocument();

    // Calendario y leyendas
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByText('No disponible')).toBeInTheDocument();
    expect(screen.getByText('Seleccionado')).toBeInTheDocument();

    // Fecha elegida
    expect(screen.getByText('FECHA DE ENTREGA ELEGIDA')).toBeInTheDocument();
    expect(screen.getByText('Recogida')).toBeInTheDocument();

    // Lugar de entrega y pago en efectivo
    expect(screen.getByText(/Lugar de entrega \*/i)).toBeInTheDocument();
    expect(screen.getByText('Panadería · recogida sin costo')).toBeInTheDocument();
    expect(screen.getByText(/Método de pago \*/i)).toBeInTheDocument();
    expect(screen.getByText('Efectivo')).toBeInTheDocument();

    // Resumen lateral
    expect(screen.getByText('Tu pedido, casi listo')).toBeInTheDocument();
    expect(screen.getByText('Conchas: Vainilla · Chispas · Sin relleno')).toBeInTheDocument();
    expect(screen.getByText('Notas: Demo: sin azúcar extra en la superficie.')).toBeInTheDocument();
    expect(document.getElementById('checkout-total-amount')).toHaveTextContent('$176.00 MXN');
  });

  test('Permite seleccionar un día disponible en el calendario', () => {
    render(
      <CheckoutPage
        cart={sampleCart}
        totalCount={6}
        totalAmount={176.0}
        onCompleteOrder={jest.fn()}
      />
    );

    const availableDayButtons = screen.getAllByRole('button', { name: /^Día \d+/i });
    // Hacer clic en algún día disponible
    const enabledBtn = availableDayButtons.find((btn) => !btn.disabled);
    expect(enabledBtn).toBeDefined();

    fireEvent.click(enabledBtn);
    expect(document.getElementById('selected-date-display')).toBeInTheDocument();
  });

  test('Completa el pedido al hacer clic en Confirmar pedido y muestra vista de agradecimiento', async () => {
    const handleCompleteOrder = jest.fn().mockResolvedValueOnce({
      success: true,
      pedido: {
        pedido_id: 42,
        estado: 'PENDIENTE',
        monto_total: 176.0
      },
      message: '¡Pedido realizado con éxito!'
    });

    render(
      <CheckoutPage
        cart={sampleCart}
        totalCount={6}
        totalAmount={176.0}
        onCompleteOrder={handleCompleteOrder}
        onShowToast={jest.fn()}
      />
    );

    const confirmBtn = document.getElementById('btn-confirm-order');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleCompleteOrder).toHaveBeenCalledTimes(1);
      const [orderPayload] = handleCompleteOrder.mock.calls[0];
      expect(orderPayload.pago).toBe('EFECTIVO');
      expect(orderPayload.lugar_entrega).toBe('Panadería · recogida sin costo');
      expect(orderPayload.fecha_entrega).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    // Vista de confirmación
    await waitFor(() => {
      expect(screen.getByText('¡Gracias por tu compra!')).toBeInTheDocument();
      expect(screen.getByText('GLO-0042')).toBeInTheDocument();
    });
  });
});
