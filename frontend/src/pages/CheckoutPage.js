import React, { useState, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const DAYS_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTHS_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function formatDateSpanish(dateObj) {
  if (!dateObj) return '';
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const dayName = dayNames[dateObj.getDay()];
  const dayNum = dateObj.getDate();
  const monthName = MONTHS_NAMES[dateObj.getMonth()].toLowerCase();
  const year = dateObj.getFullYear();
  return `${dayName} ${dayNum} de ${monthName} de ${year}`;
}

export function CheckoutPage({
  cart,
  totalCount,
  totalAmount,
  onOpenCart,
  onNavigate,
  onCompleteOrder,
  onShowToast
}) {
  const { user } = useAuth();

  // Fecha base: hoy
  const today = useMemo(() => new Date(), []);
  
  // Por defecto, seleccionar 4 días en el futuro (o lunes próximo)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return d;
  });

  const [currentViewDate, setCurrentViewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);

  // Generar cuadrícula de días para el mes visible
  const calendarDays = useMemo(() => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 es domingo
    // Convertir a lunes = 0, domingo = 6
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Días del mes anterior para rellenar
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push({
        dayNumber: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i),
        isPast: true
      });
    }

    // Días del mes actual
    const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    for (let i = 1; i <= totalDaysInMonth; i++) {
      const d = new Date(year, month, i);
      const isPast = d < todayZero;
      const isToday = d.getTime() === todayZero.getTime();
      // En domingo se puede marcar no disponible para descanso o disponible
      const isAvailable = !isPast;

      days.push({
        dayNumber: i,
        isCurrentMonth: true,
        date: d,
        isPast,
        isToday,
        isAvailable
      });
    }

    // Rellenar días del próximo mes hasta completar múltiplo de 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        dayNumber: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i),
        isPast: false
      });
    }

    return days;
  }, [currentViewDate, today]);

  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (day) => {
    if (!day.isCurrentMonth || !day.isAvailable) return;
    setSelectedDate(day.date);
  };

  const handleConfirmOrder = async () => {
    if (!selectedDate) {
      if (onShowToast) onShowToast('Por favor selecciona una fecha de entrega en el calendario', 'error');
      return;
    }

    if (cart.length === 0) {
      if (onShowToast) onShowToast('Tu carrito está vacío', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const isoDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      
      const result = await onCompleteOrder({
        fecha_entrega: isoDate,
        lugar_entrega: 'Panadería · recogida sin costo',
        pago: 'EFECTIVO'
      });

      if (result && result.success) {
        setOrderConfirmed(result.pedido || result);
        if (onShowToast) {
          onShowToast(result.message || '¡Pedido realizado con éxito!', 'success', 5000);
        }
      }
    } catch (err) {
      if (onShowToast) {
        onShowToast(err.message || 'Error al completar el pedido', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountDisplay = user
    ? `${user.nombre || 'Usuario'} ${user.primer_apellido || ''}`.trim()
    : 'Ana · Demo';

  const todayShortStr = `${today.getDate()} de ${MONTHS_NAMES[today.getMonth()].toLowerCase()} de ${today.getFullYear()}`;
  const todayBadgeStr = `${today.getDate()} ${MONTHS_NAMES[today.getMonth()].substr(0, 3).toLowerCase()} ${today.getFullYear()}`;

  // Si ya se confirmó el pedido, mostrar pantalla de confirmación exitosa
  if (orderConfirmed) {
    const orderNum = orderConfirmed.pedido_id ? `GLO-${String(orderConfirmed.pedido_id).padStart(4, '0')}` : 'GLO-0001';
    return (
      <div className="azomalli-app checkout-success-view">
        <Navbar cartCount={0} onOpenCart={onOpenCart} onNavigate={onNavigate} />
        <main className="checkout-success-main">
          <div className="checkout-success-card">
            <div className="success-icon-badge">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9C291D" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span className="success-eyebrow">PEDIDO REGISTRADO</span>
            <h1 className="success-title">¡Gracias por tu compra!</h1>
            <p className="success-desc">
              Tu pedido ha sido recibido con el folio <strong>{orderNum}</strong> y se horneará con dedicación artesanal para el día{' '}
              <strong>{formatDateSpanish(selectedDate)}</strong>.
            </p>
            <div className="success-details-box">
              <div className="success-row">
                <span>Estado del pedido:</span>
                <span className="badge-pending">Pendiente</span>
              </div>
              <div className="success-row">
                <span>Método de pago:</span>
                <span>Efectivo (al recoger)</span>
              </div>
              <div className="success-row">
                <span>Lugar de entrega:</span>
                <span>Panadería · recogida sin costo</span>
              </div>
              <div className="success-row">
                <span>Total a liquidar:</span>
                <span className="success-total">${totalAmount.toFixed(2)} MXN</span>
              </div>
            </div>
            <div className="success-actions-row">
              <button
                type="button"
                className="btn-primary-azomalli"
                id="btn-view-my-orders"
                onClick={() => onNavigate && onNavigate('/pedidos')}
              >
                Ver mis pedidos
              </button>
              <button
                type="button"
                className="btn-secondary-azomalli"
                onClick={() => onNavigate && onNavigate('/')}
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="azomalli-app checkout-page-view">
      <Navbar cartCount={totalCount} onOpenCart={onOpenCart} onNavigate={onNavigate} />

      <main className="checkout-main-content">
        <div className="checkout-container">
          {/* Volver y progreso */}
          <div className="checkout-nav-progress">
            <button
              type="button"
              className="btn-back-to-cart"
              id="back-to-cart-btn"
              onClick={() => onNavigate && onNavigate('/cart')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Volver al carrito</span>
            </button>

            <div className="checkout-breadcrumb">
              <span className="crumb-inactive" onClick={() => onNavigate && onNavigate('/cart')}>
                Carrito
              </span>
              <span className="crumb-sep"> / </span>
              <span className="crumb-active">Fecha y confirmación</span>
            </div>
          </div>

          {/* Presentación del checkout */}
          <div className="checkout-presentation">
            <span className="checkout-eyebrow">FINALIZAR PEDIDO</span>
            <h1 className="checkout-title">Un día para disfrutarlo.</h1>
            <p className="checkout-subtitle">
              Elige el día en que deseas tener tu pedido listo y revisa los últimos detalles.
            </p>
          </div>

          {/* Distribución en dos columnas */}
          <div className="checkout-grid-layout">
            {/* Columna Izquierda: Calendario, Lugar y Pago */}
            <div className="checkout-left-col">
              {/* Calendario de disponibilidad */}
              <div className="checkout-calendar-card" id="availability-calendar-card">
                <div className="calendar-header-row">
                  <div className="calendar-month-titles">
                    <h2 className="calendar-month-name">
                      {MONTHS_NAMES[currentViewDate.getMonth()]} {currentViewDate.getFullYear()}
                    </h2>
                    <span className="calendar-today-indicator">Hoy: {todayShortStr}</span>
                  </div>

                  <div className="calendar-month-nav">
                    <button
                      type="button"
                      className="btn-month-nav btn-month-prev"
                      id="btn-calendar-prev"
                      onClick={handlePrevMonth}
                      aria-label="Mes anterior"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="btn-month-nav btn-month-next"
                      id="btn-calendar-next"
                      onClick={handleNextMonth}
                      aria-label="Mes siguiente"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Cuadrícula del mes */}
                <div className="calendar-grid-wrapper">
                  <div className="calendar-weekdays-row">
                    {DAYS_NAMES.map((name) => (
                      <span key={name} className="calendar-weekday-label">
                        {name}
                      </span>
                    ))}
                  </div>

                  <div className="calendar-days-grid" id="calendar-days-grid">
                    {calendarDays.map((day, idx) => {
                      const isSelected =
                        selectedDate &&
                        day.isCurrentMonth &&
                        day.date.getFullYear() === selectedDate.getFullYear() &&
                        day.date.getMonth() === selectedDate.getMonth() &&
                        day.date.getDate() === selectedDate.getDate();

                      let stateClass = 'day-other-month';
                      if (day.isCurrentMonth) {
                        if (isSelected) {
                          stateClass = 'day-selected';
                        } else if (day.isAvailable) {
                          stateClass = 'day-available';
                        } else {
                          stateClass = 'day-unavailable';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`calendar-day-cell ${stateClass}`}
                          disabled={!day.isCurrentMonth || !day.isAvailable}
                          onClick={() => handleSelectDay(day)}
                          data-day={day.dayNumber}
                          aria-label={`Día ${day.dayNumber}`}
                        >
                          <span className="day-number-text">{day.dayNumber}</span>
                          {day.isToday && <span className="today-dot" title="Hoy" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Leyenda de disponibilidad */}
                <div className="calendar-legend-row">
                  <div className="legend-item">
                    <span className="legend-sample sample-available" />
                    <span className="legend-text">Disponible</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-sample sample-unavailable" />
                    <span className="legend-text">No disponible</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-sample sample-selected" />
                    <span className="legend-text">Seleccionado</span>
                  </div>
                </div>

                <p className="calendar-demo-disclaimer">
                  Disponibilidad de demostración: las fechas habilitadas no representan una política real de la panadería.
                </p>
              </div>

              {/* Tarjeta de Fecha Elegida */}
              <div className="selected-date-card" id="selected-date-card">
                <div className="date-icon-box">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9C291D" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                    <polyline points="9 16 11 18 15 14"></polyline>
                  </svg>
                </div>

                <div className="selected-date-info">
                  <span className="selected-date-eyebrow">FECHA DE ENTREGA ELEGIDA</span>
                  <h3 className="selected-date-display" id="selected-date-display">
                    {formatDateSpanish(selectedDate)}
                  </h3>
                </div>

                <span className="pickup-badge">Recogida</span>
              </div>

              {/* Lugar y Pago */}
              <div className="delivery-and-payment-box">
                <div className="delivery-payment-grid">
                  {/* Lugar de entrega */}
                  <div className="field-group">
                    <span className="field-label">Lugar de entrega *</span>
                    <div className="field-card-option selected">
                      <span className="radio-circle active" />
                      <span className="field-option-text">Panadería · recogida sin costo</span>
                    </div>
                    <span className="field-hint">Recoge tu pedido en la panadería.</span>
                  </div>

                  {/* Método de pago */}
                  <div className="field-group">
                    <span className="field-label">Método de pago *</span>
                    <div className="field-card-option selected" id="payment-method-cash">
                      <span className="radio-circle active" />
                      <span className="field-option-text">Efectivo</span>
                    </div>
                    <span className="field-hint">Método de ejemplo; no implica un pago realizado.</span>
                  </div>
                </div>

                <div className="order-creation-metadata-row">
                  <span className="meta-info">Fecha de pedido: {todayBadgeStr}</span>
                  <span className="meta-info">Cuenta: {accountDisplay}</span>
                  <span className="meta-required">* Obligatorio</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Resumen de Compra */}
            <aside className="checkout-summary-panel">
              <h2 className="checkout-summary-title">Tu pedido, casi listo</h2>
              <span className="checkout-summary-status">Nuevo pedido · aún sin confirmar</span>

              <div className="summary-divider" />

              {/* Lista de productos elegidos */}
              <div className="checkout-items-list" id="checkout-items-list">
                {cart.map((item) => {
                  const itemId = item.cartItemId || item.producto_id;
                  const itemSubtotal = (Number(item.precio_unitario ?? 0) * item.quantity).toFixed(2);
                  return (
                    <div key={itemId} className="checkout-item-row">
                      <img
                        src={item.imagen_url || '/images/placeholder.svg'}
                        alt={item.nombre}
                        className="checkout-item-thumb"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '/images/placeholder.svg';
                        }}
                      />
                      <div className="checkout-item-details">
                        <h4 className="checkout-item-name">{item.nombre}</h4>
                        <span className="checkout-item-calc">
                          {item.quantity} × ${Number(item.precio_unitario ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <span className="checkout-item-subtotal">${itemSubtotal}</span>
                    </div>
                  );
                })}
              </div>

              {/* Personalizaciones conservadas */}
              {cart.some((i) => i.sabor || i.topping || i.relleno || i.notas) && (
                <div className="preserved-customization-box">
                  {cart
                    .filter((i) => i.sabor || i.topping || i.relleno || i.notas)
                    .map((item) => {
                      const itemId = item.cartItemId || item.producto_id;
                      const parts = [];
                      if (item.sabor) parts.push(item.sabor.opcion || item.sabor.sabor || item.sabor);
                      if (item.topping) parts.push(item.topping.opcion || item.topping.topping || item.topping);
                      if (item.relleno) parts.push(item.relleno.opcion || item.relleno.relleno || item.relleno);

                      return (
                        <div key={itemId} className="preserved-item">
                          <span className="preserved-item-summary">
                            {item.nombre}: {parts.join(' · ')}
                          </span>
                          {item.notas && <span className="preserved-item-notes">Notas: {item.notas}</span>}
                        </div>
                      );
                    })}
                </div>
              )}

              <div className="summary-divider" />

              {/* Desglose financiero */}
              <div className="checkout-calc-row">
                <span className="calc-label">Subtotal · {totalCount} piezas</span>
                <span className="calc-value">${totalAmount.toFixed(2)}</span>
              </div>

              <div className="checkout-calc-row">
                <span className="calc-label">Recogida en panadería</span>
                <span className="calc-value value-free">Sin costo</span>
              </div>

              <div className="summary-divider" />

              <div className="checkout-total-row">
                <span className="total-title">Total</span>
                <span className="total-number" id="checkout-total-amount">
                  ${totalAmount.toFixed(2)} <span className="currency-tag">MXN</span>
                </span>
              </div>

              <button
                type="button"
                className="btn-confirm-order"
                id="btn-confirm-order"
                disabled={isSubmitting || cart.length === 0}
                onClick={handleConfirmOrder}
              >
                <span>{isSubmitting ? 'Confirmando pedido...' : 'Confirmar pedido'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="7" y1="17" x2="17" y2="7"></line>
                  <polyline points="7 7 17 7 17 17"></polyline>
                </svg>
              </button>

              <p className="order-pending-notice">
                Al confirmar, tu pedido se registrará con estado inicial Pendiente.
              </p>

              <p className="order-disclaimer-notice">
                Compra de demostración. Esta vista no realiza cobros ni operaciones bancarias.
              </p>
            </aside>
          </div>
        </div>
      </main>

      <footer className="checkout-page-footer">
        <span className="footer-title">De nuestras manos a tu mesa.</span>
        <span className="footer-credits">Las Glorias de Azomalli · Datos de demostración · MXN</span>
      </footer>
    </div>
  );
}
