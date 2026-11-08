import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCard } from '../components/ProductCard';

const mockProduct = {
  producto_id: 1,
  nombre: 'Concha Tradicional de Vainilla',
  descripcion: 'Pan dulce tradicional esponjoso con costra de azúcar.',
  precio_unitario: 18.5,
  imagen_url: '/images/pan_conchas.png',
  categoria: 'DULCE',
  es_temporada: false,
};

describe('Componente ProductCard', () => {
  test('Renderiza adecuadamente el nombre, descripción y precio formateado', () => {
    render(<ProductCard product={mockProduct} onAddToCart={() => {}} />);

    // Verificar nombre
    expect(screen.getByText('Concha Tradicional de Vainilla')).toBeInTheDocument();

    // Verificar descripción
    expect(
      screen.getByText('Pan dulce tradicional esponjoso con costra de azúcar.')
    ).toBeInTheDocument();

    // Verificar precio formateado en pesos mexicanos
    expect(screen.getByText('$18.50')).toBeInTheDocument();

    // Verificar etiqueta calculada para dulce
    expect(screen.getByText('PAN DULCE')).toBeInTheDocument();
  });

  test('Emite el evento onAddToCart con el producto al hacer clic en el botón', () => {
    const handleAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={handleAddToCart} />);

    const addButton = screen.getByRole('button', {
      name: /Agregar Concha Tradicional de Vainilla al carrito/i,
    });
    fireEvent.click(addButton);

    expect(handleAddToCart).toHaveBeenCalledTimes(1);
    expect(handleAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  test('Muestra etiqueta de temporada cuando es_temporada es true', () => {
    const seasonalProduct = {
      ...mockProduct,
      es_temporada: true,
      tag: null,
    };
    render(<ProductCard product={seasonalProduct} onAddToCart={() => {}} />);

    expect(screen.getByText('DE TEMPORADA')).toBeInTheDocument();
  });
});

