/**
 * Servicio de Pedidos — Centraliza las peticiones HTTP relacionadas con encargos.
 */
import { API_ENDPOINTS } from '../config/api';

/**
 * Crea un nuevo pedido en el backend para el usuario autenticado.
 * 
 * @param {Object} orderData
 * @param {Array} orderData.items - Lista de productos en el carrito
 * @param {string} orderData.fecha_entrega - Fecha en formato YYYY-MM-DD
 * @param {string} [orderData.lugar_entrega] - Dirección o lugar de recogida
 * @param {string} [orderData.pago] - Método de pago (solo EFECTIVO)
 * @param {string} [token] - Token JWT de autenticación opcional
 * @returns {Promise<Object>} Respuesta del servidor con los detalles del pedido creado
 */
export async function createOrder(orderData, token = null) {
  const authToken = token || localStorage.getItem('azomalli_token');
  const headers = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(API_ENDPOINTS.ORDERS.CREATE, {
    method: 'POST',
    headers,
    body: JSON.stringify(orderData)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Error en el servidor al procesar el pedido (${response.status})`);
  }

  return data;
}

/**
 * Consulta la lista de pedidos realizados por el usuario actual.
 * 
 * @param {string} [token]
 * @returns {Promise<Array>} Lista de pedidos
 */
export async function fetchUserOrders(token = null, status = null) {
  const authToken = token || localStorage.getItem('azomalli_token');
  const headers = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const endpoint = API_ENDPOINTS.ORDERS.LIST || API_ENDPOINTS.ORDERS.CREATE;
  const url = status ? `${endpoint}?estado=${encodeURIComponent(status)}` : endpoint;

  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Error al obtener pedidos (${response.status})`);
  }

  return data.orders || [];
}

/**
 * Consulta los detalles de un pedido específico por ID.
 * 
 * @param {number|string} orderId
 * @param {string} [token]
 * @returns {Promise<Object>} Datos del pedido
 */
export async function fetchOrderById(orderId, token = null) {
  const authToken = token || localStorage.getItem('azomalli_token');
  const headers = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(API_ENDPOINTS.ORDERS.BY_ID(orderId), {
    method: 'GET',
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Error al consultar pedido (${response.status})`);
  }

  return data.pedido;
}
