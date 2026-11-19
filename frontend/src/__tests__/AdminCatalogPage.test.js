import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminCatalogPage } from '../pages/AdminCatalogPage';
import * as AuthContextModule from '../context/AuthContext';
import * as ProductServiceModule from '../services/productService';

const MOCK_PRODUCTS = [
  {
    producto_id: 1,
    nombre: 'Conchas',
    descripcion: 'Concha suave tradicional con costra dulce.',
    precio_unitario: 25.00,
    categoria: 'DULCE',
    activo: true,
    es_temporada: false,
    imagen_url: '/images/conchas.png'
  },
  {
    producto_id: 2,
    nombre: 'Roles de canela',
    descripcion: 'Deliciosos roles con glaseado artesanal.',
    precio_unitario: 38.00,
    categoria: 'DULCE',
    activo: true,
    es_temporada: true,
    imagen_url: '/images/roles_canela.png'
  },
  {
    producto_id: 3,
    nombre: 'Baguette Rústica',
    descripcion: 'Pan crujiente de masa madre.',
    precio_unitario: 45.00,
    categoria: 'SALADO',
    activo: false,
    es_temporada: false,
    imagen_url: '/images/pan_integral.png'
  }
];

describe('Pantalla AdminCatalogPage (Figma 15:10955)', () => {
  beforeEach(() => {
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { nombre: 'Administradora', rol: 'ADMINISTRADOR', email: 'admin@azomalli.com' },
      token: 'fake-jwt-admin-token',
      isAuthenticated: true
    });
    jest.spyOn(ProductServiceModule, 'fetchProducts').mockResolvedValue(MOCK_PRODUCTS);
    jest.spyOn(ProductServiceModule, 'archiveProduct').mockResolvedValue({
      ...MOCK_PRODUCTS[0],
      activo: false
    });
    jest.spyOn(ProductServiceModule, 'restoreProduct').mockResolvedValue({
      ...MOCK_PRODUCTS[2],
      activo: true
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Renderiza encabezado, métricas de catálogo y botón Agregar producto', async () => {
    const handleNavigate = jest.fn();
    render(<AdminCatalogPage onNavigate={handleNavigate} initialProducts={MOCK_PRODUCTS} />);

    // Título y subtítulo
    expect(screen.getByRole('heading', { name: 'Catálogo de panes' })).toBeInTheDocument();
    expect(
      screen.getByText('Cuida lo que se ve en la tienda: productos, precios y disponibilidad.')
    ).toBeInTheDocument();

    // Botón Agregar producto
    const btnAdd = screen.getByRole('button', { name: /Agregar producto/i });
    expect(btnAdd).toBeInTheDocument();
    fireEvent.click(btnAdd);
    expect(handleNavigate).toHaveBeenCalledWith('/admin/productos/nuevo');

    // Métricas
    expect(screen.getByText('Productos activos')).toBeInTheDocument();
    expect(screen.getByText('Productos archivados')).toBeInTheDocument();
    expect(screen.getByText('Categorías')).toBeInTheDocument();
  });

  test('Muestra productos activos por defecto y permite alternar a la pestaña Archivados', () => {
    render(<AdminCatalogPage initialProducts={MOCK_PRODUCTS} />);

    // Conchas y Roles deben estar visibles (activos)
    expect(screen.getByText('Conchas')).toBeInTheDocument();
    expect(screen.getByText('Roles de canela')).toBeInTheDocument();
    expect(screen.queryByText('Baguette Rústica')).not.toBeInTheDocument();

    // Alternar a pestaña Archivados
    const tabArchived = screen.getByRole('tab', { name: /Archivados/i });
    fireEvent.click(tabArchived);

    // Ahora Baguette debe verse y los activos ocultarse
    expect(screen.getByText('Baguette Rústica')).toBeInTheDocument();
    expect(screen.queryByText('Conchas')).not.toBeInTheDocument();
  });

  test('Filtra productos reactivamente por término de búsqueda y por categoría', () => {
    render(<AdminCatalogPage initialProducts={MOCK_PRODUCTS} />);

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre o código/i);
    fireEvent.change(searchInput, { target: { value: 'Roles' } });

    expect(screen.getByText('Roles de canela')).toBeInTheDocument();
    expect(screen.queryByText('Conchas')).not.toBeInTheDocument();

    // Limpiar búsqueda
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('Conchas')).toBeInTheDocument();

    // Filtro por categoría SALADO en activos (no hay salados activos en MOCK)
    const selectCat = screen.getByLabelText(/Filtrar por categoría/i);
    fireEvent.change(selectCat, { target: { value: 'SALADO' } });
    expect(screen.queryByText('Conchas')).not.toBeInTheDocument();
  });

  test('Permite archivar un producto activo y llama al servicio correspondiente', async () => {
    const handleToast = jest.fn();
    render(<AdminCatalogPage initialProducts={MOCK_PRODUCTS} onShowToast={handleToast} />);

    const btnArchive = screen.getByTitle('Archivar Conchas');
    expect(btnArchive).toBeInTheDocument();

    fireEvent.click(btnArchive);

    await waitFor(() => {
      expect(ProductServiceModule.archiveProduct).toHaveBeenCalledWith(1);
      expect(handleToast).toHaveBeenCalledWith(expect.stringContaining('archivado'));
    });
  });

  test('Navega hacia la pantalla de edición al presionar el botón Editar', () => {
    const handleNavigate = jest.fn();
    render(<AdminCatalogPage initialProducts={MOCK_PRODUCTS} onNavigate={handleNavigate} />);

    const btnEdit = screen.getByTitle('Editar Conchas');
    fireEvent.click(btnEdit);

    expect(handleNavigate).toHaveBeenCalledWith('/admin/productos/editar/1');
  });
});
