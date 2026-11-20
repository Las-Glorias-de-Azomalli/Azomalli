import React from 'react';
import { useAuth } from '../context/AuthContext';

export function AdminTopBar({ breadcrumb = 'Panel de gestión / Catálogo' }) {
  let auth = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    auth = useAuth();
  } catch {
    auth = null;
  }

  const user = auth?.user;
  const displayName = user
    ? user.nombre || (user.email ? user.email.split('@')[0] : 'Administradora')
    : 'Administradora';
  const initial = displayName.charAt(0).toUpperCase() || 'A';
  const roleLabel = user?.rol === 'ADMINISTRADOR' ? 'Administradora' : (user?.rol || 'Administradora');

  return (
    <header className="admin-topbar">
      <div className="admin-breadcrumb">
        <span>{breadcrumb}</span>
      </div>

      <div className="admin-session">
        <span className="admin-user-title">{roleLabel}</span>
        <div className="admin-avatar" title={displayName}>
          <span>{initial}</span>
        </div>
      </div>
    </header>
  );
}
