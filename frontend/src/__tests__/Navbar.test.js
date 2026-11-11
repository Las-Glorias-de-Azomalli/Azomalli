import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../components/Navbar';
import * as AuthContextModule from '../context/AuthContext';

describe('Componente Navbar', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renderiza identidad de marca, enlaces de navegación y botón de carrito', () => {
    render(<Navbar cartCount={3} onOpenCart={jest.fn()} />);

    expect(screen.getByText('Las Glorias de Azomalli')).toBeInTheDocument();
    expect(screen.getByText('Catálogo')).toBeInTheDocument();
    expect(screen.getByText('Mis pedidos')).toBeInTheDocument();
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('en estado invitado navega a /login al hacer clic en Mi Perfil', () => {
    const handleNavigate = jest.fn();
    render(<Navbar cartCount={0} onNavigate={handleNavigate} />);

    const profileBtn = screen.getByRole('button', { name: /Iniciar sesión/i });
    fireEvent.click(profileBtn);

    expect(handleNavigate).toHaveBeenCalledWith('/login');
  });

  test('en estado autenticado muestra el nombre del usuario y el apartado Mi Perfil', () => {
    const mockLogout = jest.fn();
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { nombre: 'Ana', email: 'ana@example.com', rol: 'CLIENTE' },
      isAuthenticated: true,
      logout: mockLogout
    });

    render(<Navbar cartCount={0} />);

    expect(screen.getByText('Mi Perfil')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();

    // Al hacer clic abre el dropdown
    const profileBtn = screen.getByRole('button', { name: /Perfil de Ana/i });
    fireEvent.click(profileBtn);

    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.getByText('Cerrar sesión')).toBeInTheDocument();

    // Al hacer clic en cerrar sesión llama a logout
    const logoutBtn = screen.getByText('Cerrar sesión');
    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
