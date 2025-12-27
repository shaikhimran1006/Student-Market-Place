import { useEffect, useState } from 'react';
import api from '../api/axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/me');
        setOrders(res.data.data.orders || res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const unlockDigital = async (orderId, itemId) => {
    try {
      await api.post('/orders/digital/unlock', { orderId, itemId });
      setMessage('Digital item unlocked');
      setOrders((prev) => prev.map((o) => o._id === orderId ? {
        ...o,
        items: o.items.map((it) => it._id === itemId ? {
          ...it,
          digitalAccess: { ...it.digitalAccess, isUnlocked: true },
        } : it),
      } : o));
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Could not unlock');
    }
  };

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Orders</h1>
        {message && <span className="text-sm text-primary">{message}</span>}
      </div>
      {orders.map((order) => (
        <div key={order._id} className="card space-y-3">
          <div className="flex justify-between text-sm text-slate-600">
            <span className="font-semibold">{order.orderNumber}</span>
            <span className="capitalize px-2 py-1 rounded-full bg-slate-100 text-slate-700">{order.status}</span>
          </div>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-700">
            <div className="space-y-2">
              {order.items.map((item) => (
                <div key={item._id} className="flex justify-between items-center border-b last:border-none pb-2">
                  <div>
                    <p className="font-semibold text-slate-800">{item.productSnapshot.title}</p>
                    <p className="text-xs text-slate-500 capitalize">{item.productSnapshot.productType}</p>
                    {item.productSnapshot.productType === 'digital' && (
                      <p className="text-xs text-emerald-700">{item.digitalAccess?.isUnlocked ? 'Unlocked' : 'Locked'}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p>x{item.quantity}</p>
                    {item.productSnapshot.productType === 'digital' && (
                      <button
                        className="text-xs text-primary"
                        onClick={() => unlockDigital(order._id, item._id)}
                        disabled={item.digitalAccess?.isUnlocked}
                      >
                        {item.digitalAccess?.isUnlocked ? 'Download ready' : 'Unlock download'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <div className="text-sm text-slate-700">Total: ${order.pricing.total}</div>
              <div className="text-xs text-slate-500">Placed: {new Date(order.createdAt).toLocaleString()}</div>
              {order.timeline && order.timeline.length > 0 && (
                <div className="border rounded-lg p-2 bg-slate-50">
                  <p className="text-xs font-semibold text-slate-700 mb-1">Timeline</p>
                  <div className="space-y-1">
                    {order.timeline.map((t) => (
                      <div key={t.timestamp} className="flex justify-between text-xs text-slate-600">
                        <span className="capitalize">{t.status}</span>
                        <span>{new Date(t.timestamp).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      {orders.length === 0 && <div>No orders yet.</div>}
    </div>
  );
};

export default Orders;
