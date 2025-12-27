import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, cartRes] = await Promise.all([
          api.get('/orders/me'),
          api.get('/cart'),
        ]);
        setOrders(ordersRes.data.data.orders || []);
        setCart(cartRes.data.data.cart || null);
      } catch (err) {
        setMessage(err?.response?.data?.message || 'Could not load your dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const summary = useMemo(() => {
    const statusBuckets = orders.reduce(
      (acc, order) => {
        acc.total += 1;
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      },
      { total: 0 }
    );

    const digitalItems = orders.flatMap((o) =>
      o.items.filter((i) => i.productSnapshot?.productType === 'digital')
    );
    const physicalOpen = orders.filter((o) => o.orderType !== 'digital' && o.status !== 'delivered').length;
    const cartCount = cart?.items?.length || 0;

    return {
      statusBuckets,
      digitalItems,
      physicalOpen,
      cartCount,
    };
  }, [orders, cart]);

  if (loading) return <div>Loading your student hub...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Student Hub</h1>
          <p className="text-sm text-slate-600">Track orders, downloads, and keep shopping curated for you.</p>
        </div>
        {message && <span className="text-sm text-primary">{message}</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card text-center">
          <p className="text-xs uppercase text-slate-500">Orders</p>
          <p className="text-2xl font-semibold">{summary.statusBuckets.total}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs uppercase text-slate-500">In Cart</p>
          <p className="text-2xl font-semibold text-slate-800">{summary.cartCount}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs uppercase text-slate-500">Downloads</p>
          <p className="text-2xl font-semibold text-emerald-700">{summary.digitalItems.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs uppercase text-slate-500">Awaiting Delivery</p>
          <p className="text-2xl font-semibold text-amber-700">{summary.physicalOpen}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Recent Orders</h3>
          <Link to="/orders" className="text-sm text-primary">See all</Link>
        </div>
        {orders.length === 0 && <p className="text-sm text-slate-600">No orders yet. Browse the marketplace to get started.</p>}
        <div className="space-y-3">
          {orders.slice(0, 5).map((order) => (
            <div key={order._id} className="border rounded-lg p-3 flex justify-between items-start">
              <div>
                <p className="font-semibold text-slate-800">{order.items[0]?.productSnapshot?.title || 'Order'}</p>
                <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                <p className="text-sm text-slate-600">Items: {order.items.length} · ${order.pricing?.total?.toFixed(2)}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 capitalize">{order.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Digital Library</h3>
          <Link to="/assistant" className="text-sm text-primary">Ask AI</Link>
        </div>
        {summary.digitalItems.length === 0 && <p className="text-sm text-slate-600">No downloads yet.</p>}
        <div className="grid gap-2 md:grid-cols-2">
          {summary.digitalItems.map((item) => (
            <div key={item._id} className="border rounded-lg p-3">
              <p className="font-semibold text-slate-800">{item.productSnapshot?.title}</p>
              <p className="text-xs text-slate-500">Download limit: {item.digitalAccess?.downloadLimit ?? 'Unlimited'}</p>
              <Link to="/orders" className="text-sm text-primary">View order</Link>
            </div>
          ))}
        </div>
      </div>

      <div className="card bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Keep shopping</p>
            <h3 className="font-semibold text-slate-900">Explore verified listings picked for students</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['electronics', 'study-materials', 'event-passes', 'subscriptions'].map((cat) => (
              <Link key={cat} to={`/?category=${cat}`} className="px-3 py-2 rounded-full bg-white text-sm text-slate-700 border">
                {cat.replace('-', ' ')}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
