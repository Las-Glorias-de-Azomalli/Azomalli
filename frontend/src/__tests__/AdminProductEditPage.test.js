import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminProductEditPage } from '../pages/AdminProductEditPage';
import * as AuthContextModule from '../context/AuthContext';
import * as ProductServiceModule from '../services/productService';

const MOCK_PRODUCT = {
  producto_id: 1,
  nombre: 'Conchas',
  descripcion: 'Una cubierta delicada y una miga suave.',
  precio_unitario: 25.00,
  categoria: 'DULCE',
  activo: true,
  es_temporada: false,
  es_personalizable: true,
  imagen_url: '/images/conchas.png',
  sabor: {
    opciones: ['Vainilla', 'Chocolate'],
    unidad: 'Pieza',
    peso: '90 g por pieza',
    ingredientes: 'Harina de trigo, leche, huevo, mantequilla, azúcar, levadura.',
    alergenos: ['Gluten (trigo)', 'Leche', 'Huevo'],
    distintivos: ['100% casero', 'Hecho a mano']
  }
};

describe('Pantalla AdminProductEditPage (Figma 15:11272)', () => {
  beforeEach(() => {
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { nombre: 'Administradora', rol: 'ADMINISTRADOR', email: 'admin@azomalli.com' },
      token: 'fake-jwt-admin-token',
      isAuthenticated: true
    });
    jest.spyOn(ProductServiceModule, 'fetchProductById').mockResolvedValue(MOCK_PRODUCT);
    jest.spyOn(ProductServiceModule, 'updateProduct').mockResolvedValue({
      ...MOCK_PRODUCT,
      nombre: 'Conchas Tradicionales',
      precio_unitario: 27.00
    });
    jest.spyOn(ProductServiceModule, 'archiveProduct').mockResolvedValue({
      ...MOCK_PRODUCT,
      activo: false
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Carga y pre-llena los datos del producto en el formulario', () => {
    render(<AdminProductEditPage initialProduct={MOCK_PRODUCT} productId={1} />);

    expect(screen.getByRole('heading', { name: 'Editar producto' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Conchas')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Una cubierta delicada y una miga suave.')).toBeInTheDocument();
    expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    expect(screen.getByDisplayValue('90 g por pieza')).toBeInTheDocument();
  });

  test('Guarda los cambios editados y navega de regreso a /admin/productos', async () => {
    const handleNavigate = jest.fn();
    const handleToast = jest.fn();
    render(
      <AdminProductEditPage
        initialProduct={MOCK_PRODUCT}
        productId={1}
        onNavigate={handleNavigate}
        onShowToast={handleToast}
      />
    );

    const inputName = screen.getByDisplayValue('Conchas');
    fireEvent.change(inputName, { target: { value: 'Conchas Tradicionales' } });

    const btnSave = screen.getByRole('button', { name: /Guardar cambios/i });
    fireEvent.click(btnSave);

    await waitFor(() => {
      expect(ProductServiceModule.updateProduct).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          nombre: 'Conchas Tradicionales'
        })
      );
      expect(handleToast).toHaveBeenCalledWith(expect.stringContaining('actualizado'));
      expect(handleNavigate).toHaveBeenCalledWith('/admin/productos');
    });
  });

  test('Muestra el panel de aviso de archivo y permite confirmar el archivado del producto', async () => {
    const handleNavigate = jest.fn();
    const handleToast = jest.fn();
    render(
      <AdminProductEditPage
        initialProduct={MOCK_PRODUCT}
        productId={1}
        onNavigate={handleNavigate}
        onShowToast={handleToast}
      />
    );

    // Caja de confirmación visible de archivo (Figma 15:11272)
    expect(screen.getByText('¿Archivar Conchas?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'El producto se retirará del catálogo público y ya no podrá agregarse a nuevos carritos.'
      )
    ).toBeInTheDocument();

    const btnConfirmArchive = screen.getByRole('button', { name: /Confirmar archivo/i });
    fireEvent.click(btnConfirmArchive);

    await waitFor(() => {
      expect(ProductServiceModule.archiveProduct).toHaveBeenCalledWith(1);
      expect(handleToast).toHaveBeenCalledWith(expect.stringContaining('archivado'));
      expect(handleNavigate).toHaveBeenCalledWith('/admin/productos');
    });
  });
});
