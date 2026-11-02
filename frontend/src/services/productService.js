/**
 * Servicio de Productos — Centraliza las peticiones HTTP relacionadas al catálogo.
 */
import { API_ENDPOINTS, buildApiUrl } from '../config/api';

/**
 * Consulta el catálogo de productos aplicando filtros opcionales.
 * 
 * @param {Object} [filters]
 * @param {string} [filters.filter] - Tipo de filtro ('seasonal', etc.)
 * @param {string} [filters.category] - Categoría ('DULCE', 'SALADO', etc.)
 * @returns {Promise<Array>} Lista de productos
 */
export async function fetchProducts({ filter, category } = {}) {
  const url = buildApiUrl(API_ENDPOINTS.PRODUCTS.LIST, {
    filter,
    category: category && category.toLowerCase() !== 'todos' ? category : undefined
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error en la API (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();
  return Array.isArray(data.products) ? data.products : [];
}

/**
 * Consulta un producto individual por su ID.
 * 
 * @param {number|string} id - ID del producto
 * @returns {Promise<Object>} Datos del producto
 */
export async function fetchProductById(id) {
  const url = API_ENDPOINTS.PRODUCTS.BY_ID(id);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al consultar producto ${id} (${response.status})`);
  }
  const data = await response.json();
  return data.product || data;
}
