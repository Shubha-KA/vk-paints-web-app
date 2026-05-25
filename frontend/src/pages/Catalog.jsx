import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_BASE = '';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      toast.error(err.message);
      // Fallback to empty
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (product) => {
    // Navigate to quotation page with product data in state
    navigate('/quote', { state: { selectedProduct: product } });
  };

  const getColorDisplay = (colorName) => {
    const colorMap = {
      'white': '#FFFFFF',
      'beige': '#F5F5DC',
      'blue': '#3B82F6',
      'red': '#EF4444',
      'green': '#10B981',
      'yellow': '#F59E0B',
      'grey': '#6B7280',
      'gray': '#6B7280',
      'black': '#1F2937',
      'cream': '#FFFDD0',
      'ivory': '#FFFFF0',
    };
    return colorMap[colorName.toLowerCase()] || colorName;
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton-loader" style={{ height: 32, width: 250, marginBottom: 8, borderRadius: 4 }} />
          <div className="skeleton-loader" style={{ height: 20, width: 400, borderRadius: 4 }} />
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card">
              <div className="card-body p-5">
                <div className="skeleton-loader" style={{ height: 140, borderRadius: 8, marginBottom: 20 }} />
                <div className="skeleton-loader" style={{ height: 24, width: '70%', marginBottom: 12, borderRadius: 4 }} />
                <div className="skeleton-loader" style={{ height: 16, width: '40%', marginBottom: 24, borderRadius: 4 }} />
                <div className="skeleton-loader" style={{ height: 40, borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Paint Catalog</h2>
          <p className="text-muted mt-2">Browse our premium paint collection and select one to get a quotation</p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="card empty-state">
          <p>No products available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3">
          {products.map(p => (
            <div key={p.id} className="card">
              <div className="card-body flex-col" style={{ padding: '1.25rem' }}>
                {/* Color swatch */}
                <div style={{
                  width: '100%',
                  height: '140px',
                  background: `linear-gradient(135deg, ${getColorDisplay(p.color)}, ${getColorDisplay(p.color)}dd)`,
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                }}></div>

                <h3 className="text-lg font-semibold text-main mb-2">{p.name}</h3>
                
                <div className="flex gap-2 mb-4 flex-wrap">
                  <span className="badge badge-blue">{p.type}</span>
                  <span className="badge badge-green">{p.color}</span>
                </div>

                <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted">Coverage</span>
                    <span className="text-sm font-semibold">{p.coverage_sqft_per_liter} sq ft/L</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-muted">Price</span>
                    <span className="text-xl font-semibold text-primary">₹{p.price_per_liter}/L</span>
                  </div>
                  <button 
                    className="btn btn-primary w-full" 
                    onClick={() => handleSelect(p)}
                  >
                    Select & Get Quote
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
