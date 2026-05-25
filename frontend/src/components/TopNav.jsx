import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '../App';

function Breadcrumbs() {
  const location = useLocation();
  const parts = location.pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  const crumbMap = {
    admin: 'Admin',
    orders: 'Orders',
    products: 'Products',
    retailers: 'Retailers',
    visualizer: 'Visualizer',
    quote: 'Get Quote',
  };

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link to="/" className="breadcrumb-item">Home</Link>
      {parts.map((p, i) => {
        const path = '/' + parts.slice(0, i + 1).join('/');
        const label = crumbMap[p] || p.charAt(0).toUpperCase() + p.slice(1);
        return (
          <React.Fragment key={path}>
            <span className="breadcrumb-sep">/</span>
            {i === parts.length - 1
              ? <span className="breadcrumb-item active">{label}</span>
              : <Link to={path} className="breadcrumb-item">{label}</Link>}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default function TopNav({ user }) {
  const { theme, toggleTheme } = useTheme();
  const [notifications] = useState([
    { id: 1, text: 'New order #47 placed', time: '2m ago', unread: true },
    { id: 2, text: 'Retailer "Sharma Paints" added', time: '1h ago', unread: true },
    { id: 3, text: 'Order #45 delivered', time: '3h ago', unread: false },
  ]);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="admin-header">
      <Breadcrumbs />
      <div className="admin-header-actions">
        {/* Notification bell */}
        <div className="notif-wrapper">
          <button
            className="btn btn-ghost icon-btn notif-btn"
            onClick={() => setNotifOpen(o => !o)}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span className="font-semibold">Notifications</span>
                <span className="badge badge-blue">{unreadCount} new</span>
              </div>
              {notifications.map(n => (
                <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`}>
                  <div className="notif-dot" style={{ opacity: n.unread ? 1 : 0 }} />
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text-main)' }}>{n.text}</div>
                    <div className="text-sm text-muted">{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          className="btn btn-ghost icon-btn"
          onClick={toggleTheme}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Profile chip */}
        <div className="user-avatar-chip">
          <div className="avatar-circle avatar-sm">{(user?.email || 'A')[0].toUpperCase()}</div>
          <div className="hide-sm nav-user-info">
            <div className="user-name">{user?.email?.split('@')[0] || 'Admin'}</div>
            <div className="user-role">Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export { Breadcrumbs };
