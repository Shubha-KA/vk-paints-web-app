import React, { useState, useEffect, useMemo, memo } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const API_BASE = '';

/* ─── Skeleton Loader ─── */
function SkeletonBlock({ h = 40, mb = 12, radius = 8 }) {
  return <div className="skeleton-loader" style={{ height: h, marginBottom: mb, borderRadius: radius }} />;
}

/* ─── KPI Card ─── */
const KpiCard = memo(function KpiCard({ label, value, delta, deltaDir, icon, accent }) {
  return (
    <div className="kpi-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="kpi-label">{label}</div>
          <div className="kpi-value" style={{ color: accent || 'var(--text-main)' }}>{value}</div>
          {delta && <div className={`kpi-delta ${deltaDir}`}>{deltaDir === 'up' ? '▲' : '▼'} {delta}</div>}
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 'var(--radius-lg)',
          background: accent ? accent + '18' : 'var(--primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem'
        }}>{icon}</div>
      </div>
    </div>
  );
});

/* ─── Memoized Orders Table ─── */
const OrdersTable = memo(function OrdersTable({ orders, users, retailers, onUpdateStatus, onNotify }) {
  if (orders.length === 0) return (
    <div className="empty-state"><p>No orders yet.</p></div>
  );
  return (
    <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
      <table className="modern-table">
        <thead>
          <tr>
            <th>ID</th><th>Customer</th><th>Items</th>
            <th>Labour</th><th>Retailer</th><th>Total</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => {
            const user = users.find(u => u.id === o.userId);
            const retailer = retailers.find(r => r.id === o.retailerId);
            return (
              <tr key={o.id}>
                <td className="font-semibold text-primary">#{o.id}</td>
                <td>
                  <div className="font-semibold">{user ? user.name : `User ${o.userId}`}</div>
                  <div className="text-sm text-muted">{user?.email || ''}</div>
                </td>
                <td>{o.items ? o.items.length + ' items' : (o.liters || 0) + ' L'}</td>
                <td>{o.requires_labour ? <span className="badge badge-green">Yes</span> : <span className="badge badge-gray">No</span>}</td>
                <td className="text-sm">{retailer ? retailer.name : '—'}</td>
                <td className="font-semibold">₹{o.total_cost?.toLocaleString() || '—'}</td>
                <td>
                  <select
                    value={o.status}
                    onChange={e => onUpdateStatus(o.id, e.target.value)}
                    className="form-select"
                    style={{ padding: '0.35rem 2rem 0.35rem 0.6rem', fontSize: '0.82rem' }}
                  >
                    {['Placed','Approved','Assigned','Dispatched','Delivered'].map(s =>
                      <option key={s} value={s}>{s}</option>
                    )}
                  </select>
                </td>
                <td>
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                    onClick={() => onNotify(o)}
                  >
                    📧 Notify
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});

/* ─── Main Component ─── */
export default function AdminDashboard() {
  const { tab } = useParams();
  const activeTab = tab || 'orders';

  const [orders, setOrders]       = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [products, setProducts]   = useState([]);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);

  const [newRetailer, setNewRetailer] = useState({ name:'', city:'', email:'', lat:0, lng:0, address:'' });
  const [newProduct, setNewProduct]   = useState({ name:'', type:'Interior', color:'', price_per_liter:0, coverage_sqft_per_liter:100 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oR, rtR, pR, uR] = await Promise.all([
        fetch(`${API_BASE}/orders`),
        fetch(`${API_BASE}/retailers`),
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/users`)
      ]);
      setOrders(   oR.ok  ? await oR.json()  : []);
      setRetailers(rtR.ok ? await rtR.json() : []);
      setProducts( pR.ok  ? await pR.json()  : []);
      setUsers(    uR.ok  ? await uR.json()  : []);
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  /* ─── KPI derivations (memoised) ─── */
  const kpis = useMemo(() => {
    const totalRevenue = orders.reduce((s, o) => s + (o.total_cost || 0), 0);
    const delivered    = orders.filter(o => o.status === 'Delivered').length;
    const pending      = orders.filter(o => !['Delivered','Placed'].includes(o.status)).length;
    return { totalRevenue, delivered, pending, totalOrders: orders.length };
  }, [orders]);

  /* ─── Chart data (memoised) ─── */
  const ordersByStatus = useMemo(() => {
    const counts = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [orders]);

  const revenueByProduct = useMemo(() => {
    const rev = {};
    orders.forEach(o => {
      if (o.items) o.items.forEach(item => {
        rev[item.name] = (rev[item.name] || 0) + item.cost;
      });
    });
    return Object.entries(rev).slice(0,6).map(([name, revenue]) => ({ name: name.length > 12 ? name.slice(0,12)+'…' : name, revenue }));
  }, [orders]);

  const activityTimeline = useMemo(() =>
    [...orders]
      .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)
      .map(o => {
        const u = users.find(u => u.id === o.userId);
        const colors = { Delivered:'#10B981', Dispatched:'#3B82F6', Approved:'#8B5CF6', Assigned:'#F97316', Placed:'#F59E0B' };
        return {
          id: o.id,
          text: `Order #${o.id} ${o.status.toLowerCase()} by ${u?.name || 'user'}`,
          time: new Date(o.createdAt).toLocaleDateString('en-IN', { month:'short', day:'numeric' }),
          color: colors[o.status] || '#6B7280',
          initial: o.status[0]
        };
      })
  , [orders, users]);

  const PIE_COLORS = ['#4F46E5','#10B981','#F59E0B','#EF4444','#8B5CF6'];

  /* ─── Handlers ─── */
  const handleAddRetailer = async (e) => {
    e.preventDefault();
    const id = toast.loading('Adding retailer…');
    try {
      const res = await fetch(`${API_BASE}/retailers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRetailer)
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast.success('Retailer added successfully!', { id });
      setNewRetailer({ name:'', city:'', email:'', lat:0, lng:0, address:'' });
      fetchData();
    } catch (err) { toast.error(err.message, { id }); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    const id = toast.loading('Adding product…');
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      toast.success('Product added successfully!', { id });
      setNewProduct({ name:'', type:'Interior', color:'', price_per_liter:0, coverage_sqft_per_liter:100 });
      fetchData();
    } catch (err) { toast.error(err.message, { id }); }
  };

  const handleNotifyRetailer = async (order) => {
    const retailer = retailers.find(r => r.id === order.retailerId);
    if (!retailer?.email) { toast.error('Retailer email not found'); return; }
    const id = toast.loading('Notifying retailer…');
    try {
      const res = await fetch(`${API_BASE}/orders/${order.id}/notify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target:'RETAILER', email: retailer.email })
      });
      if (res.ok) toast.success('Retailer notified!', { id });
      else toast.error('Notification failed', { id });
    } catch (err) { toast.error(err.message, { id }); }
  };

  const handleUpdateStatus = async (orderId, status) => {
    const order = orders.find(o => o.id === orderId);
    const user  = users.find(u => u.id === order?.userId);
    const id = toast.loading('Updating status…');
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userEmail: user?.email })
      });
      if (res.ok) {
        toast.success(`Status → ${status}. Customer notified.`, { id });
        fetchData();
      } else toast.error('Update failed', { id });
    } catch (err) { toast.error(err.message, { id }); }
  };

  /* ─── Loading skeleton ─── */
  if (loading) return (
    <div>
      <div className="kpi-grid">
        {[1,2,3,4].map(i => <SkeletonBlock key={i} h={100} />)}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <SkeletonBlock h={260} />
        <SkeletonBlock h={260} />
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">
            {activeTab === 'orders' ? 'Order Management'
              : activeTab === 'retailers' ? 'Retail Management'
              : 'Product Management'}
          </h2>
          <p className="text-muted mt-2">Manage your platform data and operations</p>
        </div>
      </div>

      {/* ─── Orders tab ─── */}
      {activeTab === 'orders' && (
        <div>
          {/* KPI Row */}
          <div className="kpi-grid">
            <KpiCard label="Total Orders"   value={kpis.totalOrders}   delta="vs last month" deltaDir="up"   icon="📦" accent="#4F46E5" />
            <KpiCard label="Total Revenue"  value={`₹${kpis.totalRevenue.toLocaleString()}`} delta="growing" deltaDir="up" icon="💰" accent="#10B981" />
            <KpiCard label="In Progress"    value={kpis.pending}       delta="active"        deltaDir="up"   icon="⚙️" accent="#F59E0B" />
            <KpiCard label="Delivered"      value={kpis.delivered}     delta="completed"     deltaDir="up"   icon="✅" accent="#10B981" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Orders by Status Pie */}
            <div className="chart-card">
              <div className="chart-title">Orders by Status</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={ordersByStatus} cx="50%" cy="50%" outerRadius={80}
                    dataKey="value" label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {ordersByStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: '0.8rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue by Product Bar */}
            <div className="chart-card">
              <div className="chart-title">Revenue by Product</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueByProduct} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => '₹'+v} />
                  <Tooltip
                    formatter={v => ['₹'+v.toLocaleString(), 'Revenue']}
                    contentStyle={{ background:'var(--bg-surface)', border:'1px solid var(--border-color)', borderRadius:8, fontSize:'0.8rem' }}
                  />
                  <Bar dataKey="revenue" fill="#4F46E5" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Timeline + Orders Table */}
          <div className="grid grid-cols-2 gap-6 mb-6" style={{ gridTemplateColumns: '1fr 2fr' }}>
            {/* Activity Timeline */}
            <div className="card">
              <div className="card-header"><h3 className="card-title">Recent Activity</h3></div>
              <div className="card-body">
                {activityTimeline.length === 0 ? (
                  <div className="empty-state"><p>No recent activity.</p></div>
                ) : (
                  <div className="timeline">
                    {activityTimeline.map(item => (
                      <div key={item.id} className="timeline-item">
                        <div className="timeline-dot" style={{ background: item.color + '20', color: item.color }}>
                          {item.initial}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-text">{item.text}</div>
                          <div className="timeline-time">{item.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Orders Table */}
            <div className="card">
              <div className="card-header"><h3 className="card-title">All Orders</h3></div>
              <OrdersTable
                orders={orders} users={users} retailers={retailers}
                onUpdateStatus={handleUpdateStatus}
                onNotify={handleNotifyRetailer}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Retailers tab ─── */}
      {activeTab === 'retailers' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header"><h3 className="card-title">Add New Retailer</h3></div>
            <div className="card-body">
              <form onSubmit={handleAddRetailer}>
                {[['Name','text','name'],['City','text','city'],['Email','email','email'],['Address','text','address']].map(([label,type,field]) => (
                  <div className="form-group" key={field}>
                    <label className="form-label">{label}</label>
                    <input type={type} className="form-input" value={newRetailer[field]}
                      onChange={e => setNewRetailer({...newRetailer, [field]: e.target.value})} required />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group"><label className="form-label">Latitude</label>
                    <input type="number" step="any" className="form-input" value={newRetailer.lat}
                      onChange={e => setNewRetailer({...newRetailer, lat: parseFloat(e.target.value)})} required /></div>
                  <div className="form-group"><label className="form-label">Longitude</label>
                    <input type="number" step="any" className="form-input" value={newRetailer.lng}
                      onChange={e => setNewRetailer({...newRetailer, lng: parseFloat(e.target.value)})} required /></div>
                </div>
                <button type="submit" className="btn btn-primary w-full mt-4">Add Retailer</button>
              </form>
            </div>
          </div>
          <div className="card" style={{ maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header"><h3 className="card-title">Existing Retailers ({retailers.length})</h3></div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {retailers.length === 0
                ? <div className="empty-state"><p>No retailers yet.</p></div>
                : retailers.map(r => (
                  <div key={r.id} className="p-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <div className="font-semibold text-main">{r.name} <span className="text-sm font-normal text-muted">({r.city})</span></div>
                    <div className="text-sm text-muted mt-2">{r.email} · {r.address}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Products tab ─── */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header"><h3 className="card-title">Add New Product</h3></div>
            <div className="card-body">
              <form onSubmit={handleAddProduct}>
                {[['Name','text','name'],['Type/Category','text','type'],['Color','text','color']].map(([label,type,field]) => (
                  <div className="form-group" key={field}>
                    <label className="form-label">{label}</label>
                    <input type={type} className="form-input" value={newProduct[field]}
                      onChange={e => setNewProduct({...newProduct, [field]: e.target.value})} required />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group"><label className="form-label">Price/Liter (₹)</label>
                    <input type="number" className="form-input" value={newProduct.price_per_liter}
                      onChange={e => setNewProduct({...newProduct, price_per_liter: parseFloat(e.target.value)})} required /></div>
                  <div className="form-group"><label className="form-label">Coverage (sqft/L)</label>
                    <input type="number" className="form-input" value={newProduct.coverage_sqft_per_liter}
                      onChange={e => setNewProduct({...newProduct, coverage_sqft_per_liter: parseFloat(e.target.value)})} required /></div>
                </div>
                <button type="submit" className="btn btn-primary w-full mt-4">Add Product</button>
              </form>
            </div>
          </div>
          <div className="card" style={{ maxHeight: '600px', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header"><h3 className="card-title">Existing Products ({products.length})</h3></div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {products.length === 0
                ? <div className="empty-state"><p>No products yet.</p></div>
                : products.map(p => (
                  <div key={p.id} className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <div>
                      <div className="font-semibold text-main">{p.name} <span className="badge badge-gray" style={{ marginLeft: 6 }}>{p.type}</span></div>
                      <div className="text-sm text-muted mt-1">{p.color} finish</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-primary">₹{p.price_per_liter}<span className="text-sm font-normal text-muted">/L</span></div>
                      <div className="text-sm text-muted">{p.coverage_sqft_per_liter} sqft/L</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
