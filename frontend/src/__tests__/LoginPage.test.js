import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from '../pages/LoginPage';
import * as AuthContextModule from '../context/AuthContext';

describe('Componente LoginPage', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: mockLogin,
      logout: jest.fn()
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renderiza correctamente los elementos de Figma (sello casero, bienvenida y formulario)', () => {
    render(<LoginPage onNavigate={jest.fn()} onShowToast={jest.fn()} />);

    // Elementos visuales del diseño
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('CASERO')).toBeInTheDocument();
    expect(screen.getByText(/Qué gusto tenerte/i)).toBeInTheDocument();
    expect(screen.getByText('TU CUENTA, TU PAN FAVORITO')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();

    // Inputs y botones
    expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Recordarme/i)).toBeInTheDocument();
    expect(document.getElementById('login-submit-btn')).toBeInTheDocument();
    expect(screen.getByText(/Usamos tu correo únicamente/i)).toBeInTheDocument();
  });

  test('permite autocompletar credenciales con el botón de cuenta de demostración', () => {
    render(<LoginPage onNavigate={jest.fn()} onShowToast={jest.fn()} />);

    const demoBtn = screen.getByText('Cuenta de demostración');
    fireEvent.click(demoBtn);

    const emailInput = screen.getByLabelText(/Correo electrónico/i);
    const passwordInput = screen.getByLabelText(/^Contraseña/i);

    expect(emailInput.value).toBe('ana@example.com');
    expect(passwordInput.value).toBe('Panaderia123!');
  });

  test('muestra mensaje de error si las credenciales son incorrectas', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Credenciales inválidas'));

    render(<LoginPage onNavigate={jest.fn()} onShowToast={jest.fn()} />);

    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
      target: { value: 'error@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^Contraseña/i), {
      target: { value: 'wrongpass' }
    });

    const submitBtn = document.getElementById('login-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Credenciales inválidas');
    });
  });

  test('inicia sesión exitosamente y redirige a la página principal', async () => {
    mockLogin.mockResolvedValueOnce({
      access_token: 'fake-jwt-token',
      cuenta: { cuenta_id: 1, email: 'ana@example.com', nombre: 'Ana' }
    });

    const mockNavigate = jest.fn();
    const mockShowToast = jest.fn();

    render(<LoginPage onNavigate={mockNavigate} onShowToast={mockShowToast} />);

    fireEvent.change(screen.getByLabelText(/Correo electrónico/i), {
      target: { value: 'ana@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^Contraseña/i), {
      target: { value: 'Panaderia123!' }
    });

    const submitBtn = document.getElementById('login-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('ana@example.com', 'Panaderia123!');
      expect(mockNavigate).toHaveBeenCalledWith('/');
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('¡Hola de nuevo, Ana!'),
        'success'
      );
    });
  });
});
