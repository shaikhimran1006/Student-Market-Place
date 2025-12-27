import { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const defaultForm = {
  title: '',
  description: '',
  price: '',
  category: 'electronics',
  productType: 'physical',
  condition: 'good',
  stock: 1,
};

const statusColors = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  removed: 'bg-slate-200 text-slate-700',
  rejected: 'bg-red-100 text-red-700',
};

const SellerDashboard = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState(defaultForm);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/mine', { params: { status: statusFilter || undefined } });
      setProducts(res.data.data.products || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const createProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.post('/products', {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      });
      setMessage('Product submitted for review');
      setForm(defaultForm);
      loadProducts();
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Could not create product');
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    return products.reduce(
      (acc, p) => {
        acc.total += 1;
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      { total: 0, active: 0, pending: 0, removed: 0, rejected: 0 }
    );
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Seller Workspace</h1>
          <p className="text-sm text-slate-600">Track your listings and submit new products for review.</p>
        </div>
        {message && <span className="text-sm text-primary">{message}</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card text-center">
          <p className="text-xs uppercase text-slate-500">Total</p>
          <p className="text-2xl font-semibold">{summary.total}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs uppercase text-slate-500">Active</p>
          <p className="text-2xl font-semibold text-green-700">{summary.active}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs uppercase text-slate-500">Pending</p>
          <p className="text-2xl font-semibold text-amber-700">{summary.pending}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs uppercase text-slate-500">Removed/Rejected</p>
          <p className="text-2xl font-semibold text-slate-700">{summary.removed + summary.rejected}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Your Products</h3>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="removed">Removed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {loading && <p className="text-sm text-slate-600">Loading your products...</p>}
          {!loading && products.length === 0 && <p className="text-sm text-slate-600">No products yet.</p>}
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product._id} className="border rounded-lg p-3 flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-800">{product.title}</p>
                  <p className="text-sm text-slate-600">${product.price}</p>
                  <p className="text-xs text-slate-500 capitalize">{product.category} · {product.productType}</p>
                  <p className="text-xs text-slate-500">Stock: {product.stock ?? 'n/a'}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${statusColors[product.status] || 'bg-slate-200 text-slate-700'}`}>
                  {product.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-3">Quick Create</h3>
          <form className="space-y-3" onSubmit={createProduct}>
            <div>
              <label className="text-sm text-slate-600">Title</label>
              <input
                type="text"
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Description</label>
              <textarea
                className="input"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-slate-600">Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm text-slate-600">Stock</label>
                <input
                  type="number"
                  min="0"
                  className="input"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-slate-600">Category</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  <option value="electronics">Electronics</option>
                  <option value="study-materials">Study Materials</option>
                  <option value="event-passes">Event Passes</option>
                  <option value="subscriptions">Subscriptions</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-600">Condition</label>
                <select
                  className="input"
                  value={form.condition}
                  onChange={(e) => setForm({ ...form, condition: e.target.value })}
                >
                  <option value="good">Good</option>
                  <option value="like-new">Like New</option>
                  <option value="new">New</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-600">Product Type</label>
              <select
                className="input"
                value={form.productType}
                onChange={(e) => setForm({ ...form, productType: e.target.value })}
                required
              >
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
              </select>
            </div>
            <button className="btn-primary w-full" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Submit for review'}
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-2">Add images later by editing the product after creation.</p>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
