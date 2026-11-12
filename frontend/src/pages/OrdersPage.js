import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { fetchUserOrders } from '../services/orderService';

export const DEMO_ORDERS = [
  {
    pedido_id: 1048,
    codigo_pedido: 'AG-1048',
    cuenta_id: 1,
    cliente_nombre: 'Ana · Demo',
    cliente_email: 'ana@example.com',
    fecha_pedido: '2026-10-04',
    fecha_entrega: '2026-10-04',
    lugar_entrega: 'Panadería',
    estado: 'PENDIENTE',
    pago: 'Tarjeta',
    monto_total: 296.00,
    total_piezas: 7,
    detalles: [
      {
        detalle_pedido_id: 1,
        pedido_id: 1048,
        producto_id: 2,
        producto_nombre: 'Conchas',
        producto_imagen_url: 'https://res.cloudinary.com/du7fghgi8/image/upload/v1792981331/concha_mantequilla.jpg',
        producto_categoria: 'DULCE',
        producto_es_personalizable: true,
        producto_precio_base: 22.00,
        cantidad: 4,
        precio_unitario: 25.00,
        subtotal: 100.00,
        sabor: { opcion: 'Vainilla' },
        topping: { opcion: 'Chispas' },
        relleno: { opcion: 'Sin relleno' },
        notas: 'Demo: sin azúcar extra en la superficie.'
      },
      {
        detalle_pedido_id: 2,
        pedido_id: 1048,
        producto_id: 4,
        producto_nombre: 'Roles de canela',
        producto_imagen_url: 'https://res.cloudinary.com/du7fghgi8/image/upload/v1792981332/roles_canela.jpg',
        producto_categoria: 'DULCE',
        producto_es_personalizable: false,
        producto_precio_base: 38.00,
        cantidad: 2,
        precio_unitario: 38.00,
        subtotal: 76.00,
        sabor: null,
        topping: null,
        relleno: null,
        notas: null
      },
      {
        detalle_pedido_id: 3,
        pedido_id: 1048,
        producto_id: 7,
        producto_nombre: 'Panqué casero',
        producto_imagen_url: 'https://res.cloudinary.com/du7fghgi8/image/upload/v1792981332/pan_mantequilla.jpg',
        producto_categoria: 'DULCE',
        producto_es_personalizable: false,
        producto_precio_base: 120.00,
        cantidad: 1,
        precio_unitario: 120.00,
        subtotal: 120.00,
        sabor: null,
        topping: null,
        relleno: null,
        notas: null
      }
    ]
  },
  {
    pedido_id: 1044,
    codigo_pedido: 'AG-1044',
    cuenta_id: 1,
    cliente_nombre: 'Ana · Demo',
    cliente_email: 'ana@example.com',
    fecha_pedido: '2026-09-28',
    fecha_entrega: '2026-09-28',
    lugar_entrega: 'Panadería',
    estado: 'ENTREGADO',
    pago: 'Efectivo',
    monto_total: 240.00,
    total_piezas: 2,
    detalles: [
      {
        detalle_pedido_id: 4,
        pedido_id: 1044,
        producto_id: 1,
        producto_nombre: 'Pay',
        producto_imagen_url: 'https://res.cloudinary.com/du7fghgi8/image/upload/v1792981331/pay_pina.jpg',
        producto_categoria: 'DULCE',
        producto_es_personalizable: true,
        producto_precio_base: 120.00,
        cantidad: 2,
        precio_unitario: 120.00,
        subtotal: 240.00,
        sabor: { opcion: 'Piña' },
        topping: null,
        relleno: null,
        notas: null
      }
    ]
  },
  {
    pedido_id: 1038,
    codigo_pedido: 'AG-1038',
    cuenta_id: 1,
    cliente_nombre: 'Ana · Demo',
    cliente_email: 'ana@example.com',
    fecha_pedido: '2026-09-20',
    fecha_entrega: '2026-09-20',
    lugar_entrega: 'Panadería',
    estado: 'ENTREGADO',
    pago: 'Transferencia',
    monto_total: 126.00,
    total_piezas: 4,
    detalles: [
      {
        detalle_pedido_id: 5,
        pedido_id: 1038,
        producto_id: 5,
        producto_nombre: 'Bollitos Integrales',
        producto_imagen_url: 'https://res.cloudinary.com/du7fghgi8/image/upload/v1792981331/bollito_relleno.jpg',
        producto_categoria: 'DULCE',
        producto_es_personalizable: false,
        producto_precio_base: 31.50,
        cantidad: 4,
        precio_unitario: 31.50,
        subtotal: 126.00,
        sabor: null,
        topping: null,
        relleno: null,
        notas: null
      }
    ]
  }
];

const SPANISH_MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const SPANISH_MONTHS_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic'
];

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function formatOrderDate(dateString) {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parts[2];
    const monthName = SPANISH_MONTHS_SHORT[monthIdx] || parts[1];
    return `${day} ${monthName} ${year}`;
  }
  return dateString;
}

export function formatPrice(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount ?? 0);
}

export function getStatusInfo(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'PENDIENTE' || s === 'EN PREPARACION' || s === 'EN PREPARACIÓN') {
    return {
      label: 'En preparación',
      badgeClass: 'status-badge-preparing',
      isInProgress: true
    };
  }
  if (s === 'ENTREGADO') {
    return {
      label: 'Entregado',
      badgeClass: 'status-badge-delivered',
      isInProgress: false
    };
  }
  if (s === 'CANCELADO') {
    return {
      label: 'Cancelado',
      badgeClass: 'status-badge-cancelled',
      isInProgress: false
    };
  }
  return {
    label: status || 'Pendiente',
    badgeClass: 'status-badge-preparing',
    isInProgress: true
  };
}

export function OrdersPage({
  cartCount = 0,
  onOpenCart,
  onNavigate,
  initialOrders = null,
  initialView = 'table',
  initialStatus = 'todos'
}) {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState(initialOrders || DEMO_ORDERS);
  const [currentView, setCurrentView] = useState(initialView); // 'table' | 'calendar'
  const [statusFilter, setStatusFilter] = useState(initialStatus); // 'todos' | 'en_curso'

  // Para navegación de calendario: defecto Octubre 2026 (según Figma) o mes actual
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 9, 1)); // Octubre 2026

  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      try {
        const data = await fetchUserOrders(token);
        if (isMounted && data && data.length > 0) {
          setOrders(data);
        }
      } catch {
        // En caso de error de red o backend no conectado, mantener los pedidos iniciales
      }
    }

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const displayName = user
    ? user.nombre || (user.email ? user.email.split('@')[0] : 'Ana · Demo')
    : 'Ana · Demo';

  // Cálculos de conteo
  const inProgressCount = useMemo(() => {
    return orders.filter((o) => getStatusInfo(o.estado).isInProgress).length;
  }, [orders]);

  const totalOrdersCount = orders.length;

  // Filtrado por estado
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'en_curso') {
      return orders.filter((o) => getStatusInfo(o.estado).isInProgress);
    }
    return orders;
  }, [orders, statusFilter]);

  // Construcción de la matriz para el calendario
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();

  const calendarGrid = useMemo(() => {
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    // En JS 0 es domingo, ajustar para que lunes sea 0
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells = [];

    // Días del mes anterior
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const dateObj = new Date(currentYear, currentMonth - 1, dayNum);
      const isoStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dayNumber: dayNum,
        isCurrentMonth: false,
        isoDate: isoStr,
        displayLabel: `${dayNum} ${SPANISH_MONTHS_SHORT[dateObj.getMonth()]}`
      });
    }

    // Días del mes actual
    for (let i = 1; i <= totalDaysInMonth; i++) {
      const isoStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({
        dayNumber: i,
        isCurrentMonth: true,
        isoDate: isoStr,
        displayLabel: String(i)
      });
    }

    // Días del mes siguiente para completar la semana (múltiplo de 7)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const dateObj = new Date(currentYear, currentMonth + 1, i);
      const isoStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({
        dayNumber: i,
        isCurrentMonth: false,
        isoDate: isoStr,
        displayLabel: `${i} ${SPANISH_MONTHS_SHORT[dateObj.getMonth()]}`
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Agrupar pedidos por fecha de entrega
  const ordersByDate = useMemo(() => {
    const map = {};
    filteredOrders.forEach((o) => {
      const dateKey = (o.fecha_entrega || '').split('T')[0];
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(o);
    });
    return map;
  }, [filteredOrders]);

  // Pedidos visibles en la cuadrícula
  const visibleDatesSet = useMemo(() => {
    return new Set(calendarGrid.map((c) => c.isoDate));
  }, [calendarGrid]);

  // Pedidos que están fuera de la cuadrícula visible del mes actual
  const complementaryOrders = useMemo(() => {
    return filteredOrders.filter((o) => {
      const d = (o.fecha_entrega || '').split('T')[0];
      return !visibleDatesSet.has(d);
    });
  }, [filteredOrders, visibleDatesSet]);

  const handlePrevMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleViewOrderDetail = (pedidoId) => {
    if (onNavigate) {
      onNavigate(`/pedidos/${pedidoId}`);
    } else {
      window.history.pushState({}, '', `/pedidos/${pedidoId}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="azomalli-app orders-page-view">
      <Navbar cartCount={cartCount} onOpenCart={onOpenCart} onNavigate={onNavigate} />

      <main className="orders-main-wrapper">
        <div className="orders-container">
          {/* Encabezado de página (Figma 81:34) */}
          <div className="orders-page-header">
            <div className="orders-title-group">
              <span className="orders-eyebrow">DE NUESTRAS MANOS A TU MESA</span>
              <h1 className="orders-headline">Mis pedidos</h1>
              <p className="orders-lead">
                Consulta tu historial y descubre cómo va tu próximo antojo.
              </p>
            </div>

            <button
              type="button"
              className="btn-explore-catalog"
              id="btn-explore-catalog"
              onClick={() => onNavigate && onNavigate('/')}
            >
              <span>Explorar catálogo</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </button>
          </div>

          {/* Historial y seguimiento (Figma 81:43) */}
          <div className="orders-controls-section">
            <div className="orders-filters-row">
              {/* Filtros de estado (Figma 81:45) */}
              <div className="orders-pill-group status-filter-group" role="tablist" aria-label="Filtro por estado de pedido">
                <button
                  type="button"
                  className={`orders-pill-btn ${statusFilter === 'todos' ? 'is-active' : ''}`}
                  id="filter-all-orders-btn"
                  onClick={() => setStatusFilter('todos')}
                  role="tab"
                  aria-selected={statusFilter === 'todos'}
                >
                  Todos ({totalOrdersCount})
                </button>
                <button
                  type="button"
                  className={`orders-pill-btn ${statusFilter === 'en_curso' ? 'is-active' : ''}`}
                  id="filter-active-orders-btn"
                  onClick={() => setStatusFilter('en_curso')}
                  role="tab"
                  aria-selected={statusFilter === 'en_curso'}
                >
                  En curso ({inProgressCount})
                </button>
              </div>

              {/* Selector de vista: Tabla / Calendario (Figma 81:50) */}
              <div className="orders-view-controls">
                <div className="orders-pill-group view-selector-group" role="tablist" aria-label="Selector de visualización">
                  <button
                    type="button"
                    className={`orders-pill-btn ${currentView === 'table' ? 'is-active' : ''}`}
                    id="view-table-btn"
                    onClick={() => setCurrentView('table')}
                    role="tab"
                    aria-selected={currentView === 'table'}
                  >
                    Tabla
                  </button>
                  <button
                    type="button"
                    className={`orders-pill-btn ${currentView === 'calendar' ? 'is-active' : ''}`}
                    id="view-calendar-btn"
                    onClick={() => setCurrentView('calendar')}
                    role="tab"
                    aria-selected={currentView === 'calendar'}
                  >
                    Calendario
                  </button>
                </div>
              </div>
            </div>

            <p className="orders-view-caption">
              Vista {currentView === 'table' ? 'Tabla' : 'Calendario'} activa · datos de demostración para {displayName}.
            </p>
          </div>

          {/* VISTA 1: TABLA (Figma 15:10586 / 81:57) */}
          {currentView === 'table' && (
            <div className="orders-table-card" id="orders-table-wrapper">
              <div className="orders-table-header-row">
                <span className="col-header col-id">Pedido</span>
                <span className="col-header col-date">Fecha de pedido</span>
                <span className="col-header col-date">Fecha de entrega</span>
                <span className="col-header col-place">Lugar de entrega</span>
                <span className="col-header col-status">Estado</span>
                <span className="col-header col-payment">Pago</span>
                <span className="col-header col-total">Total</span>
                <span className="col-header col-action">Acción</span>
              </div>

              <div className="orders-table-body">
                {filteredOrders.length === 0 ? (
                  <div className="orders-empty-state">
                    <p>No se encontraron pedidos con este filtro.</p>
                  </div>
                ) : (
                  filteredOrders.map((pedido) => {
                    const st = getStatusInfo(pedido.estado);
                    const formattedCode = pedido.codigo_pedido || `AG-${String(pedido.pedido_id).padStart(4, '0')}`;
                    return (
                      <div key={pedido.pedido_id} className="orders-table-row" data-order-id={pedido.pedido_id}>
                        <span className="col-cell col-id order-code-text">{formattedCode}</span>
                        <span className="col-cell col-date order-date-cell">{formatOrderDate(pedido.fecha_pedido)}</span>
                        <span className="col-cell col-date order-date-cell">{formatOrderDate(pedido.fecha_entrega)}</span>
                        <span className="col-cell col-place order-place-cell">{pedido.lugar_entrega || 'Panadería'}</span>
                        <span className="col-cell col-status">
                          <span className={`status-pill ${st.badgeClass}`}>{st.label}</span>
                        </span>
                        <span className="col-cell col-payment order-payment-cell">{pedido.pago || 'Efectivo'}</span>
                        <span className="col-cell col-total order-total-cell">{formatPrice(pedido.monto_total)}</span>
                        <span className="col-cell col-action">
                          <button
                            type="button"
                            className="btn-view-order-detail"
                            onClick={() => handleViewOrderDetail(pedido.pedido_id)}
                          >
                            Ver detalle
                          </button>
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* VISTA 2: CALENDARIO (Figma 81:1619 / 81:1659) */}
          {currentView === 'calendar' && (
            <div className="orders-calendar-container" id="orders-calendar-wrapper">
              <div className="calendar-panel-card">
                {/* Encabezado del mes */}
                <div className="calendar-card-header">
                  <div className="calendar-title-wrap">
                    <h2 className="calendar-current-month">
                      {SPANISH_MONTHS[currentMonth]} {currentYear}
                    </h2>
                    <span className="calendar-criteria-text">Por fecha de entrega</span>
                  </div>

                  <div className="calendar-month-arrows">
                    <button
                      type="button"
                      className="btn-calendar-arrow"
                      id="btn-cal-prev"
                      onClick={handlePrevMonth}
                      aria-label="Mes anterior"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="btn-calendar-arrow"
                      id="btn-cal-next"
                      onClick={handleNextMonth}
                      aria-label="Mes siguiente"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Días de la semana */}
                <div className="calendar-weekdays-bar">
                  {WEEKDAY_NAMES.map((w) => (
                    <div key={w} className="weekday-header-cell">
                      {w}
                    </div>
                  ))}
                </div>

                {/* Matriz del mes */}
                <div className="calendar-month-grid">
                  {calendarGrid.map((cell, idx) => {
                    const dayOrders = ordersByDate[cell.isoDate] || [];
                    const isToday =
                      new Date().getFullYear() === currentYear &&
                      new Date().getMonth() === currentMonth &&
                      new Date().getDate() === cell.dayNumber &&
                      cell.isCurrentMonth;

                    return (
                      <div
                        key={idx}
                        className={`calendar-cell ${cell.isCurrentMonth ? 'cell-current-month' : 'cell-overflow-month'} ${dayOrders.length > 0 ? 'cell-has-orders' : ''}`}
                      >
                        <div className="cell-top-bar">
                          <span className="cell-day-num">{cell.displayLabel}</span>
                          {isToday && <span className="today-badge-text">Hoy</span>}
                        </div>

                        {/* Tarjetas de pedido dentro del día */}
                        {dayOrders.map((ord) => {
                          const st = getStatusInfo(ord.estado);
                          const pieces = ord.total_piezas || (ord.detalles ? ord.detalles.reduce((acc, d) => acc + d.cantidad, 0) : 0);
                          const formattedCode = ord.codigo_pedido || `AG-${String(ord.pedido_id).padStart(4, '0')}`;

                          return (
                            <div
                              key={ord.pedido_id}
                              className={`order-day-card ${st.isInProgress ? 'order-card-in-progress' : 'order-card-completed'}`}
                            >
                              <div className="order-day-card-header">
                                <span className="day-order-code">{formattedCode}</span>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="7" y1="17" x2="17" y2="7"></line>
                                  <polyline points="7 7 17 7 17 17"></polyline>
                                </svg>
                              </div>

                              <span className={`status-pill ${st.badgeClass}`}>{st.label}</span>

                              <div className="day-order-details">
                                <span className="day-order-amount-pieces">
                                  {formatPrice(ord.monto_total)} · {pieces} {pieces === 1 ? 'pieza' : 'piezas'}
                                </span>
                                <span className="day-order-meta">
                                  {ord.lugar_entrega || 'Panadería'} · {ord.pago || 'Efectivo'}
                                </span>
                              </div>

                              <button
                                type="button"
                                className="day-order-link-detail"
                                onClick={() => handleViewOrderDetail(ord.pedido_id)}
                              >
                                Ver detalle
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Resumen del mes */}
                <div className="calendar-footer-summary">
                  <span className="calendar-summary-stat">
                    {ordersByDate[Object.keys(ordersByDate).find((k) => k.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`))]
                      ? '1 entrega en este mes'
                      : `${filteredOrders.length} entregas registradas`}
                  </span>
                  <span className="calendar-currency-stat">Importes en MXN</span>
                </div>
              </div>

              {/* Historial complementario (Pedidos fuera del mes - Figma 81:1809) */}
              {complementaryOrders.length > 0 && (
                <div className="complementary-history-section">
                  <h3 className="complementary-title">También en tu historial</h3>
                  <div className="complementary-cards-list">
                    {complementaryOrders.map((ord) => {
                      const st = getStatusInfo(ord.estado);
                      const pieces = ord.total_piezas || (ord.detalles ? ord.detalles.reduce((acc, d) => acc + d.cantidad, 0) : 0);
                      const formattedCode = ord.codigo_pedido || `AG-${String(ord.pedido_id).padStart(4, '0')}`;

                      return (
                        <div key={ord.pedido_id} className="complementary-order-card">
                          <div className="comp-ref-block">
                            <h4 className="comp-order-code">{formattedCode}</h4>
                            <span className="comp-order-pieces">
                              {pieces} {pieces === 1 ? 'pieza' : 'piezas'}
                            </span>
                          </div>

                          <div className="comp-dates-block">
                            <span className="comp-delivery-date">Entrega: {formatOrderDate(ord.fecha_entrega)}</span>
                            <span className="comp-creation-date">
                              Pedido: {formatOrderDate(ord.fecha_pedido)} · {ord.lugar_entrega || 'Panadería'}
                            </span>
                          </div>

                          <div className="comp-status-block">
                            <span className={`status-pill ${st.badgeClass}`}>{st.label}</span>
                          </div>

                          <div className="comp-payment-block">
                            <span>{ord.pago || 'Efectivo'}</span>
                          </div>

                          <div className="comp-amount-block">
                            <strong className="comp-amount-text">{formatPrice(ord.monto_total)}</strong>
                          </div>

                          <div className="comp-action-block">
                            <button
                              type="button"
                              className="btn-view-order-detail"
                              onClick={() => handleViewOrderDetail(ord.pedido_id)}
                            >
                              Ver detalle
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <p className="complementary-disclaimer">
                    Historial de demostración: las fechas y los estados se conservan tal como fueron registrados. Cada tarjeta se ubica en su día de entrega; en estos tres pedidos, la fecha de pedido coincide con la de entrega.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <footer className="orders-page-footer">
        <span className="footer-title">De nuestras manos a tu mesa.</span>
        <span className="footer-credits">Las Glorias de Azomalli · Datos de demostración · MXN</span>
      </footer>
    </div>
  );
}

export default OrdersPage;