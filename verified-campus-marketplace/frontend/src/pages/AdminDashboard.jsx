import { useEffect, useState } from 'react';
import api from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [flaggedProducts, setFlaggedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsRes, pendingRes, flaggedRes] = await Promise.all([
          api.get('/admin/analytics'),
          api.get('/admin/sellers/pending'),
          api.get('/admin/products/flagged'),
        ]);

        setMetrics(analyticsRes.data.data.metrics);
        setPendingSellers(pendingRes.data.data.pending || []);
        setFlaggedProducts(flaggedRes.data.data.flagged || []);
      } catch (err) {
        console.error(err);
        setMessage(err?.response?.data?.message || 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const reviewSeller = async (sellerId, action) => {
    try {
      await api.post('/admin/sellers/review', { sellerId, action });
      setPendingSellers((prev) => prev.filter((s) => s._id !== sellerId));
      setMessage(`Seller ${action}d`);
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  const chartData = [
    { name: 'Users', value: metrics?.users || 0 },
    { name: 'Sellers', value: metrics?.sellers || 0 },
    { name: 'Products', value: metrics?.products || 0 },
    { name: 'Flagged', value: metrics?.flagged || 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-slate-600">Approve sellers, monitor products, and track marketplace health.</p>
        </div>
        {message && <span className="text-sm text-primary">{message}</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {chartData.map((item) => (
          <div key={item.name} className="card text-center">
            <p className="text-xs uppercase tracking-wide text-slate-500">{item.name}</p>
            <p className="text-2xl font-semibold text-slate-800">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="value" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Pending Sellers</h3>
            <span className="text-xs text-slate-500">{pendingSellers.length} waiting</span>
          </div>
          {pendingSellers.map((seller) => (
            <div key={seller._id} className="flex justify-between items-center border-b last:border-none py-3">
              <div>
                <p className="font-semibold text-slate-800">{seller.name}</p>
                <p className="text-xs text-slate-600">{seller.email}</p>
                <p className="text-xs text-slate-500">{seller.college || 'College not set'}</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-primary" onClick={() => reviewSeller(seller._id, 'approve')}>Approve</button>
                <button className="px-3 py-2 text-sm text-red-600 border border-red-200 rounded" onClick={() => reviewSeller(seller._id, 'reject')}>Reject</button>
              </div>
            </div>
          ))}
          {pendingSellers.length === 0 && <p className="text-sm text-slate-600">No pending sellers.</p>}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Flagged Products</h3>
            <span className="text-xs text-slate-500">AI flagged content</span>
          </div>
          {flaggedProducts.map((product) => (
            <div key={product._id} className="border-b last:border-none py-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-800">{product.title}</p>
                  <p className="text-xs text-slate-600">Seller: {product.seller?.name} ({product.seller?.email})</p>
                  <p className="text-xs text-slate-500 capitalize">Category: {product.category}</p>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700">{product.status}</span>
              </div>
              {product.aiAnalysis?.reason && <p className="text-xs text-slate-600 mt-1">Reason: {product.aiAnalysis.reason}</p>}
            </div>
          ))}
          {flaggedProducts.length === 0 && <p className="text-sm text-slate-600">No flagged products right now.</p>}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
