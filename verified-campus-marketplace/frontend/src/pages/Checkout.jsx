import { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Checkout = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', street: '', city: '', state: '', zipCode: '', country: 'USA', phone: '',
    paymentMethod: 'card',
  });
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/orders', {
        paymentMethod: form.paymentMethod,
        shippingAddress: form,
      });
      setMessage('Order placed!');
      navigate('/orders');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Checkout failed');
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6 space-y-3">
      <h1 className="text-xl font-semibold">Checkout</h1>
      {message && <div className="text-sm text-primary">{message}</div>}
      <form className="space-y-3" onSubmit={submit}>
        <div className="grid grid-cols-2 gap-3">
          <input className="border rounded px-3 py-2" placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
          <input className="border rounded px-3 py-2" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
        </div>
        <input className="border rounded px-3 py-2 w-full" placeholder="Street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
        <div className="grid grid-cols-3 gap-3">
          <input className="border rounded px-3 py-2" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          <input className="border rounded px-3 py-2" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
          <input className="border rounded px-3 py-2" placeholder="ZIP" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} required />
        </div>
        <div>
          <label className="text-sm text-slate-700">Payment Method</label>
          <select className="border rounded px-3 py-2 w-full" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
            <option value="card">Card</option>
            <option value="paypal">PayPal</option>
            <option value="campus-credits">Campus Credits</option>
            <option value="cash-on-delivery">Cash on Delivery</option>
          </select>
        </div>
        <button className="btn-primary w-full">Place order</button>
      </form>
    </div>
  );
};

export default Checkout;
