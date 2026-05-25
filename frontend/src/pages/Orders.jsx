import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const API_BASE = '';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('Please log in to view orders');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/orders/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return '#10B981';
      case 'Dispatched': return '#3B82F6';
      case 'Approved': return '#8B5CF6';
      case 'Assigned': return '#F97316';
      case 'Placed': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton-loader" style={{ height: 32, width: 200, marginBottom: 8, borderRadius: 4 }} />
          <div className="skeleton-loader" style={{ height: 20, width: 300, borderRadius: 4 }} />
        </div>
        <div className="table-container p-4">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-loader" style={{ height: 48, marginBottom: 12, borderRadius: 8 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">My Orders</h2>
          <p className="text-muted mt-2">Track your paint orders and delivery status</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="card empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <h3>No orders yet</h3>
          <p className="text-muted">Browse the catalog and place your first order!</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Products</th>
                <th>Labour</th>
                <th>Total Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const isLegacy = !o.items;
                return (
                  <tr key={o.id}>
                    <td className="font-semibold text-primary">#{o.id}</td>
                    <td className="text-muted">{formatDate(o.createdAt)}</td>
                    <td>
                      {isLegacy ? (
                        <span>Legacy Order ({o.liters} L)</span>
                      ) : (
                        <div>
                          {o.items.map((item, i) => (
                            <div key={i} className="text-sm text-secondary">
                              • {item.name} ({item.liters} L)
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      {o.requires_labour ? (
                        <span className="badge badge-green">✓ Requested</span>
                      ) : (
                        <span className="badge badge-gray">Not Needed</span>
                      )}
                    </td>
                    <td className="font-semibold text-main">₹{o.total_cost?.toLocaleString()}</td>
                    <td>
                      <span className="badge" style={{
                        backgroundColor: getStatusColor(o.status) + '18',
                        color: getStatusColor(o.status)
                      }}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
