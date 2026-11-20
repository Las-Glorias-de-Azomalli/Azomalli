import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminProductCreatePage } from '../pages/AdminProductCreatePage';
import * as AuthContextModule from '../context/AuthContext';
import * as ProductServiceModule from '../services/productService';

describe('Pantalla AdminProductCreatePage (Figma 15:11113)', () => {
  beforeEach(() => {
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { nombre: 'Administradora', rol: 'ADMINISTRADOR', email: 'admin@azomalli.com' },
      token: 'fake-jwt-admin-token',
      isAuthenticated: true
    });
    jest.spyOn(ProductServiceModule, 'createProduct').mockResolvedValue({
      producto_id: 10,
      nombre: 'Conchas de chocolate',
      descripcion: 'La miga suave de siempre con cubierta de cacao.',
      precio_unitario: 28.00,
      categoria: 'DULCE',
      activo: true
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Renderiza todos los campos del formulario y el botón Volver al catálogo', () => {
    const handleNavigate = jest.fn();
    render(<AdminProductCreatePage onNavigate={handleNavigate} />);

    expect(screen.getByRole('heading', { name: 'Agregar producto' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre del producto \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripción \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Categoría \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Precio por pieza/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Disponibilidad \*/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Unidad de venta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ingredientes \*/i)).toBeInTheDocument();

    const btnBack = screen.getByRole('button', { name: /Volver al catálogo/i });
    fireEvent.click(btnBack);
    expect(handleNavigate).toHaveBeenCalledWith('/admin/productos');
  });

  test('Actualiza reactivamente la ficha de vista previa al escribir nombre y precio', () => {
    render(<AdminProductCreatePage />);

    const inputName = screen.getByLabelText(/Nombre del producto \*/i);
    const inputPrice = screen.getByLabelText(/Precio por pieza/i);

    fireEvent.change(inputName, { target: { value: 'Conchas de Fresa' } });
    fireEvent.change(inputPrice, { target: { value: '30.00' } });

    // La vista previa debe mostrar el nombre y precio actualizados
    expect(screen.getByText('Conchas de Fresa')).toBeInTheDocument();
    expect(screen.getByText('$30.00 MXN')).toBeInTheDocument();
  });

  test('Valida campos obligatorios y muestra mensaje de error si el nombre está vacío', async () => {
    render(<AdminProductCreatePage />);

    const btnSubmit = screen.getByRole('button', { name: /Publicar producto/i });
    fireEvent.click(btnSubmit);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/El nombre del producto es obligatorio/i)).toBeInTheDocument();
    });
  });

  test('Publica exitosamente el producto y redirige a /admin/productos', async () => {
    const handleNavigate = jest.fn();
    const handleToast = jest.fn();
    render(<AdminProductCreatePage onNavigate={handleNavigate} onShowToast={handleToast} />);

    fireEvent.change(screen.getByLabelText(/Nombre del producto \*/i), {
      target: { value: 'Conchas de chocolate' }
    });
    fireEvent.change(screen.getByLabelText(/Descripción \*/i), {
      target: { value: 'La miga suave de siempre con cubierta de cacao.' }
    });
    fireEvent.change(screen.getByLabelText(/Precio por pieza/i), {
      target: { value: '28.00' }
    });

    const btnSubmit = screen.getByRole('button', { name: /Publicar producto/i });
    fireEvent.click(btnSubmit);

    await waitFor(() => {
      expect(ProductServiceModule.createProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Conchas de chocolate',
          precio_unitario: 28.00,
          categoria: 'DULCE'
        })
      );
      expect(handleToast).toHaveBeenCalledWith(expect.stringContaining('creado exitosamente'));
      expect(handleNavigate).toHaveBeenCalledWith('/admin/productos');
    });
  });
});
