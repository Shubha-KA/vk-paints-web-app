import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Users, LogOut, Paintbrush, ChevronLeft, ChevronRight, Settings } from 'lucide-react';

export default function Sidebar({ collapsed, setCollapsed, user, onLogout }) {
  const location = useLocation();
  const isActive = (path) => location.pathname.includes(path) ? 'admin-nav-item active' : 'admin-nav-item';

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-header">
        <div className="brand">
          <Paintbrush size={22} />
          {!collapsed && <span>VK Paints</span>}
        </div>
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="admin-nav">
        <Link to="/admin/orders" className={isActive('/orders')} title="Order Management">
          <LayoutDashboard size={20} />
          {!collapsed && <span>Orders</span>}
        </Link>
        <Link to="/admin/products" className={isActive('/products')} title="Product Management">
          <Package size={20} />
          {!collapsed && <span>Products</span>}
        </Link>
        <Link to="/admin/retailers" className={isActive('/retailers')} title="Retail Management">
          <Users size={20} />
          {!collapsed && <span>Retailers</span>}
        </Link>
        <Link to="/admin/settings" className={isActive('/settings')} title="Settings">
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </Link>
      </nav>

      <div className="admin-sidebar-footer">
        {!collapsed && (
          <div className="sidebar-user-info">
            <div className="avatar-circle avatar-sm">{(user?.email || 'A')[0].toUpperCase()}</div>
            <div>
              <div style={{ color: 'white', fontWeight: 600, fontSize: '0.875rem' }}>
                {user?.email?.split('@')[0] || 'Admin'}
              </div>
              <div style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>Administrator</div>
            </div>
          </div>
        )}
        <button className="btn btn-ghost w-full logout-btn" onClick={onLogout} title="Logout">
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
