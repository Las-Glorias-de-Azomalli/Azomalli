import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCustomizationModal } from '../components/ProductCustomizationModal';

const sampleCustomizableProduct = {
  producto_id: 1,
  nombre: 'Conchas',
  descripcion: 'Miga suave, cubierta delicada y ese sabor casero.',
  precio_unitario: 22.0,
  imagen_url: '/images/conchas.png',
  es_personalizable: true,
  categoria: 'DULCE',
  sabor: { opciones: ['Vainilla', 'Chocolate', 'Fresa'] },
  topping: {
    opciones: [
      { label: 'Sin topping', extra: 0 },
      { label: 'Chispas', extra: 3 },
      { label: 'Nuez', extra: 6 }
    ]
  },
  relleno: {
    opciones: [
      { label: 'Sin relleno', extra: 0 },
      { label: 'Crema pastelera', extra: 7 }
    ]
  }
};

describe('Componente ProductCustomizationModal', () => {
  test('No se renderiza si isOpen es false', () => {
    const { container } = render(
      <ProductCustomizationModal
        isOpen={false}
        onClose={jest.fn()}
        product={sampleCustomizableProduct}
        onSave={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  test('Renderiza encabezados, datos del producto y opciones de Figma', () => {
    render(
      <ProductCustomizationModal
        isOpen={true}
        onClose={jest.fn()}
        product={sampleCustomizableProduct}
        onSave={jest.fn()}
      />
    );

    expect(screen.getByText('PERSONALIZA TU ANTOJO')).toBeInTheDocument();
    expect(screen.getByText('Haz tus conchas a tu gusto.')).toBeInTheDocument();
    expect(screen.getByText('Conchas')).toBeInTheDocument();
    expect(screen.getByText('$22.00 c/u')).toBeInTheDocument();
    expect(screen.getByText(/Miga suave, cubierta delicada/i)).toBeInTheDocument();

    // Opciones
    expect(screen.getByText('Vainilla')).toBeInTheDocument();
    expect(screen.getByText('Chocolate')).toBeInTheDocument();
    expect(screen.getByText('Sin topping')).toBeInTheDocument();
    expect(screen.getByText('Chispas')).toBeInTheDocument();
    expect(screen.getByText('+$3')).toBeInTheDocument();
  });

  test('Permite cambiar cantidad y recalcular subtotal', () => {
    render(
      <ProductCustomizationModal
        isOpen={true}
        onClose={jest.fn()}
        product={sampleCustomizableProduct}
        onSave={jest.fn()}
      />
    );

    // Cantidad inicial 1, precio base $22
    expect(screen.getByText('$22.00 MXN')).toBeInTheDocument();

    // Clic en botón +
    const plusBtn = screen.getByRole('button', { name: /Aumentar cantidad/i });
    fireEvent.click(plusBtn);

    // Cantidad ahora 2, subtotal $44.00 MXN
    expect(screen.getByText('$44.00 MXN')).toBeInTheDocument();
    expect(screen.getByText('2 piezas · $22.00 c/u')).toBeInTheDocument();
  });

  test('Emite evento onSave con la personalización seleccionada', () => {
    const handleSave = jest.fn();
    const handleClose = jest.fn();

    render(
      <ProductCustomizationModal
        isOpen={true}
        onClose={handleClose}
        product={sampleCustomizableProduct}
        onSave={handleSave}
      />
    );

    // Seleccionar sabor Chocolate
    fireEvent.click(screen.getByText('Chocolate'));

    // Seleccionar topping Chispas
    fireEvent.click(screen.getByText('Chispas'));

    // Escribir notas
    const notesInput = screen.getByLabelText(/Notas adicionales/i);
    fireEvent.change(notesInput, { target: { value: 'Bien dorado por favor' } });

    // Guardar
    const submitBtn = document.getElementById('submit-customization-btn');
    fireEvent.click(submitBtn);

    expect(handleSave).toHaveBeenCalledTimes(1);
    const [, customization] = handleSave.mock.calls[0];
    expect(customization.sabor.opcion).toBe('Chocolate');
    expect(customization.topping.opcion).toBe('Chispas');
    expect(customization.notas).toBe('Bien dorado por favor');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
