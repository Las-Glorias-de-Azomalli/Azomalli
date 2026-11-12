/**
 * Configuración centralizada de la API.
 * 
 * Cambio de URL base en un solo lugar mediante variables de entorno
 */

// Si está definida la variable de entorno la usa, de lo contrario usa ruta relativa (útil con proxy en desarrollo)
export const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/+$/, '');

/**
 * Diccionario centralizado de endpoints.
 */
export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,

  // Catálogo de Productos
  PRODUCTS: {
    LIST: `${API_BASE_URL}/api/products`,
    BY_ID: (id) => `${API_BASE_URL}/api/products/${id}`,
  },

  // Pedidos / Encargos
  ORDERS: {
    CREATE: `${API_BASE_URL}/api/orders`,
    LIST: `${API_BASE_URL}/api/orders`,
    BY_ID: (id) => `${API_BASE_URL}/api/orders/${id}`,
    BY_USER: (userId) => `${API_BASE_URL}/api/orders/user/${userId}`,
  },

  // Autenticación y Cuentas
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    RECOVER_PASSWORD: `${API_BASE_URL}/api/auth/recover-password`,
    PROFILE: `${API_BASE_URL}/api/auth/profile`,
  }
};

/**
 * Construir URL con query parameters a partir de un objeto.
 * 
 * @param {string} endpoint - URL base del endpoint
 * @param {Object} [params] - Parámetros clave-valor para la consulta
 * @returns {string} URL formateada con query params
 */
export function buildApiUrl(endpoint, params = {}) {
  const query = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return query ? `${endpoint}?${query}` : endpoint;
}
