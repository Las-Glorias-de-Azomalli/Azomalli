/**
 * Servicio de Autenticación — Gestiona llamadas a los endpoints de auth y almacenamiento local.
 */
import { API_ENDPOINTS } from '../config/api';

const TOKEN_KEY = 'azomalli_token';
const USER_KEY = 'azomalli_user';

export const authService = {
  /**
   * Inicia sesión con correo y contraseña.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{ access_token: string, cuenta: object, message: string }>}
   */
  async login(email, password) {
    const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Credenciales inválidas');
    }

    if (data.access_token) {
      localStorage.setItem(TOKEN_KEY, data.access_token);
    }
    if (data.cuenta) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.cuenta));
    }

    return data;
  },

  /**
   * Cierra sesión eliminando el token y datos del usuario de localStorage.
   */
  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  /**
   * Obtiene el token guardado en localStorage.
   * @returns {string|null}
   */
  getStoredToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Obtiene los datos del usuario guardados en localStorage.
   * @returns {object|null}
   */
  getStoredUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Consulta el perfil del usuario autenticado con el token JWT.
   * @param {string} token
   * @returns {Promise<object>}
   */
  async fetchProfile(token) {
    const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Token inválido o expirado');
    }

    const data = await response.json();
    if (data.cuenta) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.cuenta));
    }
    return data;
  }
};
