import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';

const SellerApply = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ businessName: '', description: '' });
  const [message, setMessage] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await api.post('/auth/seller/apply', form);
      setMessage(res.data.message || 'Application submitted');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to submit');
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-6 space-y-3">
      <h1 className="text-xl font-semibold">Become a Seller</h1>
      <p className="text-sm text-slate-600">Current status: {user?.sellerStatus || 'none'}</p>
      {message && <div className="text-primary text-sm">{message}</div>}
      <form className="space-y-3" onSubmit={submit}>
        <input className="border rounded px-3 py-2 w-full" placeholder="Business name" value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} required />
        <textarea className="border rounded px-3 py-2 w-full" rows={4} placeholder="What will you sell?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <button className="btn-primary w-full">Submit application</button>
      </form>
    </div>
  );
};

export default SellerApply;
