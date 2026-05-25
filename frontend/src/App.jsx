import React, { useState, useEffect, Suspense, lazy, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import {
  Paintbrush, Sun, Moon, LogOut, Menu, X
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import TopNav, { Breadcrumbs } from './components/TopNav';

/* ─── Theme Context ─── */
export const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });
export const useTheme = () => useContext(ThemeContext);

/* ─── Lazy-loaded pages (code splitting) ─── */
const Login      = lazy(() => import('./pages/Login'));
const Signup     = lazy(() => import('./pages/Signup'));
const Catalog    = lazy(() => import('./pages/Catalog'));
const Visualizer = lazy(() => import('./pages/Visualizer'));
const Quotation  = lazy(() => import('./pages/Quotation'));
const Orders     = lazy(() => import('./pages/Orders'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

/* ─── Loading fallback (skeleton pulse) ─── */
function PageSkeleton() {
  return (
    <div style={{ padding: '2rem' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton-loader" style={{ height: '80px', marginBottom: '1rem' }} />
      ))}
    </div>
  );
}

/* ─── Auth guard ─── */
function ProtectedRoute({ children, isAuthenticated }) {
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}



/* ─── Customer top nav ─── */
function AppLayout({ children, user, onLogout }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <div className="app-container">
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          <Paintbrush size={22} style={{ color: 'var(--primary)' }} />
          VK <span>Paints</span>
        </Link>

        <div className={`nav-links ${menuOpen ? 'nav-links-open' : ''}`}>
          <Link to="/"          className={isActive('/')}          onClick={() => setMenuOpen(false)}>Catalog</Link>
          <Link to="/visualizer" className={isActive('/visualizer')} onClick={() => setMenuOpen(false)}>Visualizer</Link>
          <Link to="/quote"      className={isActive('/quote')}      onClick={() => setMenuOpen(false)}>Quotation</Link>
          <Link to="/orders"     className={isActive('/orders')}     onClick={() => setMenuOpen(false)}>My Orders</Link>
        </div>

        <div className="nav-user">
          <button
            className="btn btn-ghost icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="user-avatar-chip">
            <div className="avatar-circle">{(user?.email || 'U')[0].toUpperCase()}</div>
            <div className="nav-user-info">
              <div className="user-name">{user?.email?.split('@')[0] || 'User'}</div>
              <div className="user-role">{user?.role || 'Customer'}</div>
            </div>
          </div>

          <button className="btn btn-secondary" onClick={onLogout} title="Logout" aria-label="Logout">
            <LogOut size={16} /> <span className="hide-sm">Logout</span>
          </button>

          <button className="btn btn-ghost icon-btn mobile-menu-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Breadcrumbs />
        {children}
      </main>
    </div>
  );
}

/* ─── Admin layout with collapsible sidebar ─── */
function AdminLayout({ children, user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`admin-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Collapsible Sidebar */}
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} user={user} onLogout={onLogout} />

      {/* Main content */}
      <div className="admin-main">
        <TopNav user={user} />
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ─── Root App ─── */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('vkp-theme') || 'light');

  useEffect(() => {
    localStorage.setItem('vkp-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const role   = localStorage.getItem('role');
    const email  = localStorage.getItem('userEmail');
    if (token && userId) {
      setIsAuthenticated(true);
      setUser({ token, userId, role, email });
    }
  }, []);

  const handleLogin = (data) => {
    setIsAuthenticated(true);
    setUser({ token: data.token, userId: data.userId, role: data.role, email: localStorage.getItem('userEmail') });
  };

  const handleLogout = () => {
    ['token','userId','role','userEmail','email'].forEach(k => localStorage.removeItem(k));
    setIsAuthenticated(false);
    setUser(null);
  };

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.75rem',
            fontFamily: 'Inter, sans-serif',
            fontSize: '0.875rem',
            fontWeight: '500',
          },
          success: { style: { borderLeft: '4px solid #10B981' } },
          error:   { style: { borderLeft: '4px solid #EF4444' } },
          loading: { style: { borderLeft: '4px solid #4F46E5' } },
        }}
      />
      <Router>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route path="/login"  element={isAuthenticated ? <Navigate to={user?.role === 'Admin' ? '/admin' : '/'} replace /> : <Login onLogin={handleLogin} />} />
            <Route path="/signup" element={isAuthenticated ? <Navigate to={user?.role === 'Admin' ? '/admin' : '/'} replace /> : <Signup />} />

            <Route path="/" element={
              isAuthenticated && user?.role === 'Admin' ? <Navigate to="/admin" replace /> :
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AppLayout user={user} onLogout={handleLogout}><Catalog /></AppLayout>
              </ProtectedRoute>
            }/>
            <Route path="/visualizer" element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AppLayout user={user} onLogout={handleLogout}><Visualizer /></AppLayout>
              </ProtectedRoute>
            }/>
            <Route path="/quote" element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AppLayout user={user} onLogout={handleLogout}><Quotation /></AppLayout>
              </ProtectedRoute>
            }/>
            <Route path="/orders" element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AppLayout user={user} onLogout={handleLogout}><Orders /></AppLayout>
              </ProtectedRoute>
            }/>
            <Route path="/admin" element={<Navigate to="/admin/orders" replace />}/>
            <Route path="/admin/:tab" element={
              <ProtectedRoute isAuthenticated={isAuthenticated && user?.role === 'Admin'}>
                <AdminLayout user={user} onLogout={handleLogout}><AdminDashboard /></AdminLayout>
              </ProtectedRoute>
            }/>
            <Route path="*" element={<Navigate to={isAuthenticated ? (user?.role === 'Admin' ? '/admin' : '/') : '/login'} replace />}/>
          </Routes>
        </Suspense>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
