import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import toast from 'react-hot-toast';

const API_BASE = '';

export default function Quotation() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialProduct = location.state?.selectedProduct || null;

  const [products, setProducts] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [lineItems, setLineItems] = useState([
    {
      id: Date.now(),
      productId: initialProduct ? initialProduct.id : '',
      area: 500,
      liters: 0,
      cost: 0,
      calculated: false
    }
  ]);
  
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [requiresLabour, setRequiresLabour] = useState(false);

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchRetailers();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) setProducts(await res.json());
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const fetchRetailers = async () => {
    try {
      const res = await fetch(`${API_BASE}/retailers`);
      if (res.ok) setRetailers(await res.json());
    } catch (err) {
      console.error('Failed to fetch retailers:', err);
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { id: Date.now(), productId: '', area: 500, liters: 0, cost: 0, calculated: false }]);
    setOrderPlaced(false);
  };

  const removeLineItem = (id) => {
    setLineItems(lineItems.filter(item => item.id !== id));
    setOrderPlaced(false);
  };

  const updateLineItem = (id, field, value) => {
    setLineItems(lineItems.map(item => item.id === id ? { ...item, [field]: value, calculated: false } : item));
    setOrderPlaced(false);
  };

  const calculate = () => {
    setLineItems(lineItems.map(item => {
      if (!item.productId) return item;
      const product = products.find(p => p.id === Number(item.productId));
      if (!product) return item;
      const liters = Math.ceil(item.area / product.coverage_sqft_per_liter);
      const cost = liters * product.price_per_liter;
      return { ...item, liters, cost, calculated: true };
    }));
    setOrderPlaced(false);
  };

  const totalCost = lineItems.reduce((sum, item) => sum + (item.calculated ? item.cost : 0), 0);
  const isCalculated = lineItems.some(item => item.calculated);

  const availableCities = [...new Set(retailers.map(r => r.city))];
  const filteredRetailers = retailers.filter(r => r.city === selectedCity);

  const placeOrder = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      toast.error('Please log in to place an order');
      navigate('/login');
      return;
    }

    if (!selectedRetailer) {
      toast.error('Please select a nearest retail shop to fulfill your order.');
      return;
    }

    const itemsToOrder = lineItems
      .filter(item => item.calculated && item.productId)
      .map(item => {
        const p = products.find(prod => prod.id === Number(item.productId));
        return {
          productId: p.id,
          name: p.name,
          liters: item.liters,
          cost: item.cost
        };
      });

    if (itemsToOrder.length === 0) return;

    const userEmail = localStorage.getItem('email');

    setOrderLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: parseInt(userId),
          userEmail: userEmail,
          retailerId: parseInt(selectedRetailer),
          items: itemsToOrder,
          total_cost: totalCost,
          requires_labour: requiresLabour
        })
      });

      if (!res.ok) throw new Error('Failed to place order');
      setOrderPlaced(true);
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error('Error placing order: ' + err.message);
    } finally {
      setOrderLoading(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(4, 120, 87);
    doc.text('V K Paints Quotation', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 32);
    
    const tableColumn = ["Product", "Type", "Area (Sq Ft)", "Req. Liters", "Price/L", "Total Cost"];
    const tableRows = [];
    
    lineItems.filter(item => item.calculated && item.productId).forEach(item => {
      const product = products.find(p => p.id === Number(item.productId));
      if (product) {
        tableRows.push([
          product.name, product.type, item.area.toString(),
          `${item.liters} L`, `Rs. ${product.price_per_liter}`, `Rs. ${item.cost.toLocaleString()}`
        ]);
      }
    });
    
    doc.autoTable({ head: [tableColumn], body: tableRows, startY: 40, theme: 'grid', headStyles: { fillColor: [16, 185, 129] } });
    
    const finalY = doc.previousAutoTable.finalY || 40;
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Grand Total: Rs. ${totalCost.toLocaleString()}`, 14, finalY + 15);
    
    doc.save('paint-quotation.pdf');
  };

  const groupedProducts = products.reduce((acc, product) => {
    acc[product.type] = acc[product.type] || [];
    acc[product.type].push(product);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Smart Quotation Builder</h2>
          <p className="text-muted mt-2">Select multiple products to estimate costs</p>
        </div>
        {isCalculated && (
          <button className="btn btn-secondary" onClick={downloadPDF}>
            📄 Download PDF
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          {lineItems.map((item) => (
            <div key={item.id} className="p-4 mb-4" style={{
              background: 'var(--slate-50)',
              borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', position: 'relative'
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Select Product / Category</label>
                  <select className="form-select" value={item.productId} onChange={(e) => updateLineItem(item.id, 'productId', e.target.value)}>
                    <option value="">-- Select Product --</option>
                    {Object.keys(groupedProducts).map(type => (
                      <optgroup label={type} key={type}>
                        {groupedProducts[type].map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Coverage: {p.coverage_sqft_per_liter} sqft/L - ₹{p.price_per_liter}/L)</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Wall Area (Sq Ft)</label>
                  <input type="number" value={item.area} onChange={(e) => updateLineItem(item.id, 'area', Number(e.target.value))} className="form-input" />
                </div>
              </div>
              
              {lineItems.length > 1 && (
                <button onClick={() => removeLineItem(item.id)} style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '1.2rem', padding: '5px', lineHeight: 1 }} title="Remove Item">×</button>
              )}
              
              {item.calculated && item.productId && (
                <div className="mt-4 p-4 flex justify-between items-center" style={{ background: 'var(--secondary-light)', borderRadius: 'var(--radius-md)', color: 'var(--secondary-hover)' }}>
                  <span className="font-semibold text-sm">Requirement: {item.liters} L</span>
                  <span className="font-semibold text-sm">Cost: ₹{item.cost.toLocaleString()}</span>
                </div>
              )}
            </div>
          ))}

          <div className="flex gap-4 mt-6">
            <button className="btn btn-ghost" style={{ flex: 1, border: '2px dashed var(--primary-light)', color: 'var(--primary)' }} onClick={addLineItem}>+ Add Product</button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={calculate}>Calculate Total Estimate</button>
          </div>
          
          {isCalculated && (
            <div className="mt-8 p-6" style={{ background: 'linear-gradient(135deg, var(--secondary-light), #A7F3D0)', borderRadius: 'var(--radius-lg)', border: '1px solid #6EE7B7' }}>
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg" style={{ color: 'var(--secondary-hover)' }}>Grand Total</span>
                <span className="text-2xl font-bold" style={{ color: '#047857' }}>₹{totalCost.toLocaleString()}</span>
              </div>

              <div className="p-6 bg-white mb-6" style={{ borderRadius: 'var(--radius-md)' }}>
                <h4 className="font-semibold text-main mb-4">Delivery & Fulfullment</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nearest Location (City)</label>
                    <select className="form-select" value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedRetailer(''); }}>
                      <option value="">-- Select City --</option>
                      {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Select Retail Store</label>
                    <select className="form-select" value={selectedRetailer} onChange={(e) => setSelectedRetailer(e.target.value)} disabled={!selectedCity}>
                      <option value="">-- Select Store --</option>
                      {filteredRetailers.map(r => <option key={r.id} value={r.id}>{r.name} ({r.address})</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="labourCheck" checked={requiresLabour} onChange={(e) => setRequiresLabour(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                  <label htmlFor="labourCheck" className="text-sm font-semibold cursor-pointer text-main">I need a Labour Facility (Painters / Contractors)</label>
                </div>
              </div>

              {!orderPlaced ? (
                <button className="btn btn-secondary w-full" style={{ padding: '1rem', fontSize: '1rem', backgroundColor: '#047857', color: 'white', border: 'none' }} onClick={placeOrder} disabled={orderLoading}>
                  {orderLoading ? 'Processing Order...' : 'Confirm & Place Order'}
                </button>
              ) : (
                <div className="mt-4 p-4 text-center font-semibold" style={{ background: 'rgba(255,255,255,0.8)', borderRadius: 'var(--radius-md)', color: '#047857' }}>
                  ✅ Order placed successfully! <a href="#" onClick={(e) => { e.preventDefault(); navigate('/orders'); }} style={{ color: '#047857', textDecoration: 'underline' }}>View My Orders</a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
