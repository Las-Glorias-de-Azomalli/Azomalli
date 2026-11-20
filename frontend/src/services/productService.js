/**
 * Servicio de Productos — Centraliza las peticiones HTTP relacionadas al catálogo.
 */
import { API_ENDPOINTS, buildApiUrl } from '../config/api';

function getAuthHeaders(token = null, includeJsonContentType = false) {
  const headers = {};
  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }
  const authToken =
    token || (typeof localStorage !== 'undefined' ? localStorage.getItem('azomalli_token') : null);
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  return headers;
}

/**
 * Consulta el catálogo de productos aplicando filtros opcionales.
 * 
 * @param {Object} [filters]
 * @param {string} [filters.filter] - Tipo de filtro ('seasonal', etc.)
 * @param {string} [filters.category] - Categoría ('DULCE', 'SALADO', etc.)
 * @param {string} [filters.status] - Estado ('active', 'archived', 'all')
 * @param {string} [filters.search] - Búsqueda por nombre o código
 * @param {boolean} [filters.includeArchived] - Si debe incluir productos archivados
 * @returns {Promise<Array>} Lista de productos
 */
export async function fetchProducts({ filter, category, status, search, includeArchived } = {}) {
  const url = buildApiUrl(API_ENDPOINTS.PRODUCTS.LIST, {
    filter,
    category: category && category.toLowerCase() !== 'todos' ? category : undefined,
    status,
    search: search ? search.trim() : undefined,
    include_archived: includeArchived ? 'true' : undefined
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
 * @param {Object} [options]
 * @param {boolean} [options.includeArchived=true]
 * @returns {Promise<Object>} Datos del producto
 */
export async function fetchProductById(id, { includeArchived = true } = {}) {
  const url = buildApiUrl(API_ENDPOINTS.PRODUCTS.BY_ID(id), {
    include_archived: includeArchived ? 'true' : undefined
  });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al consultar producto ${id} (${response.status})`);
  }
  const data = await response.json();
  return data.product || data;
}

/**
 * Crea un nuevo producto en el catálogo.
 * 
 * @param {Object} productData
 * @param {string} [token]
 * @returns {Promise<Object>} Producto creado
 */
export async function createProduct(productData, token = null) {
  const headers = getAuthHeaders(token, true);

  const response = await fetch(API_ENDPOINTS.PRODUCTS.CREATE, {
    method: 'POST',
    headers,
    body: JSON.stringify(productData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Error al crear producto (${response.status})`);
  }
  return data.product || data;
}

/**
 * Actualiza los datos de un producto existente.
 * 
 * @param {number|string} id
 * @param {Object} productData
 * @param {string} [token]
 * @returns {Promise<Object>} Producto actualizado
 */
export async function updateProduct(id, productData, token = null) {
  const headers = getAuthHeaders(token, true);

  const response = await fetch(API_ENDPOINTS.PRODUCTS.UPDATE(id), {
    method: 'PUT',
    headers,
    body: JSON.stringify(productData)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Error al actualizar producto (${response.status})`);
  }
  return data.product || data;
}

/**
 * Archiva un producto (activo = false).
 * 
 * @param {number|string} id
 * @param {string} [token]
 * @returns {Promise<Object>} Producto archivado
 */
export async function archiveProduct(id, token = null) {
  const headers = getAuthHeaders(token, false);

  const response = await fetch(API_ENDPOINTS.PRODUCTS.ARCHIVE(id), {
    method: 'POST',
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Error al archivar producto (${response.status})`);
  }
  return data.product || data;
}

/**
 * Reactiva un producto previamente archivado (activo = true).
 * 
 * @param {number|string} id
 * @param {string} [token]
 * @returns {Promise<Object>} Producto reactivado
 */
export async function restoreProduct(id, token = null) {
  const headers = getAuthHeaders(token, false);

  const response = await fetch(API_ENDPOINTS.PRODUCTS.RESTORE(id), {
    method: 'POST',
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Error al reactivar producto (${response.status})`);
  }
  return data.product || data;
}

/**
 * Elimina o archiva un producto vía DELETE.
 * 
 * @param {number|string} id
 * @param {string} [token]
 * @returns {Promise<Object>} Resultado
 */
export async function deleteProduct(id, token = null) {
  const headers = getAuthHeaders(token, false);

  const response = await fetch(API_ENDPOINTS.PRODUCTS.DELETE(id), {
    method: 'DELETE',
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `Error al archivar producto (${response.status})`);
  }
  return data.product || data;
}
