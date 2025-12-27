import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm text-slate-700">Email</label>
          <input type="email" className="w-full rounded border px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm text-slate-700">Password</label>
          <input type="password" className="w-full rounded border px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <button type="submit" className="btn-primary w-full">Login</button>
      </form>
      <p className="text-sm text-slate-600 mt-3">No account? <Link to="/register" className="text-primary">Register</Link></p>
    </div>
  );
};

export default Login;
