import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      const res = await api.get('/cart');
      setCart(res.data.data.cart || res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCart(); }, []);

  const updateQty = async (productId, quantity) => {
    await api.put('/cart/update', { productId, quantity });
    loadCart();
  };

  const removeItem = async (productId) => {
    await api.post('/cart/remove', { productId });
    loadCart();
  };

  if (loading) return <div>Loading cart...</div>;
  if (!cart || cart.items.length === 0) return <div>Your cart is empty.</div>;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-3">
        {cart.items.map((item) => (
          <div key={item.product._id} className="card flex justify-between items-center">
            <div>
              <p className="font-semibold">{item.product.title}</p>
              <p className="text-sm text-slate-600">${item.price} · {item.product.productType}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-2" onClick={() => updateQty(item.product._id, Math.max(1, item.quantity - 1))}>-</button>
              <span>{item.quantity}</span>
              <button className="px-2" onClick={() => updateQty(item.product._id, item.quantity + 1)}>+</button>
              <button className="text-red-600" onClick={() => removeItem(item.product._id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <div className="card space-y-2">
        <h3 className="font-semibold">Summary</h3>
        <div className="flex justify-between text-sm"><span>Items</span><span>{cart.totals.itemCount}</span></div>
        <div className="flex justify-between text-sm"><span>Subtotal</span><span>${cart.totals.subtotal?.toFixed(2)}</span></div>
        <button className="btn-primary w-full" onClick={() => navigate('/checkout')}>Checkout</button>
      </div>
    </div>
  );
};

export default Cart;
