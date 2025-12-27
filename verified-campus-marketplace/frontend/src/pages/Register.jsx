import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', studentId: '', college: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow p-6">
      <h1 className="text-xl font-semibold mb-4">Create account</h1>
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
      <form className="space-y-3" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm text-slate-700">Name</label>
          <input className="w-full rounded border px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm text-slate-700">Email</label>
          <input type="email" className="w-full rounded border px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm text-slate-700">Password</label>
          <input type="password" className="w-full rounded border px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <div>
          <label className="block text-sm text-slate-700">Student ID (optional for instant verification)</label>
          <input className="w-full rounded border px-3 py-2" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm text-slate-700">College</label>
          <input className="w-full rounded border px-3 py-2" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary w-full">Register</button>
      </form>
      <p className="text-sm text-slate-600 mt-3">Have an account? <Link to="/login" className="text-primary">Login</Link></p>
    </div>
  );
};

export default Register;
