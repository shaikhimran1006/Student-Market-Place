import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Bars3Icon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const roleLabel = user
    ? {
        student: 'Student',
        seller: 'Seller',
        admin: 'Admin',
      }[user.role] || 'User'
    : '';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClasses = ({ isActive }) =>
    `px-3 py-2 text-sm font-medium ${isActive ? 'text-primary' : 'text-slate-600'} hover:text-primary`;

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="md:hidden" onClick={() => setOpen(!open)}>
            <Bars3Icon className="h-6 w-6 text-slate-700" />
          </button>
          <Link to="/" className="text-lg font-bold text-primary">Verified Campus</Link>
        </div>
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" className={linkClasses}>Home</NavLink>
          <NavLink to="/cart" className={linkClasses}>Cart</NavLink>
          <NavLink to="/orders" className={linkClasses}>Orders</NavLink>
          {user?.role === 'student' && <NavLink to="/student" className={linkClasses}>Student</NavLink>}
          {user?.role === 'student' && <NavLink to="/seller/apply" className={linkClasses}>Sell</NavLink>}
          {user?.role === 'seller' && <NavLink to="/seller/dashboard" className={linkClasses}>Seller</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" className={linkClasses}>Admin</NavLink>}
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/cart" className="relative">
            <ShoppingCartIcon className="h-6 w-6 text-slate-700" />
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-700">Hi, {user.name.split(' ')[0]}</span>
              {roleLabel && (
                <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Role: {roleLabel}
                </span>
              )}
              <button onClick={handleLogout} className="text-sm text-primary">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary">Login</Link>
          )}
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-200 px-4 pb-4">
          <div className="flex flex-col gap-2 pt-2">
            <NavLink to="/" className={linkClasses} onClick={() => setOpen(false)}>Home</NavLink>
            <NavLink to="/cart" className={linkClasses} onClick={() => setOpen(false)}>Cart</NavLink>
            <NavLink to="/orders" className={linkClasses} onClick={() => setOpen(false)}>Orders</NavLink>
            {user?.role === 'student' && <NavLink to="/student" className={linkClasses} onClick={() => setOpen(false)}>Student</NavLink>}
            {user?.role === 'student' && <NavLink to="/seller/apply" className={linkClasses} onClick={() => setOpen(false)}>Sell</NavLink>}
            {user?.role === 'seller' && <NavLink to="/seller/dashboard" className={linkClasses} onClick={() => setOpen(false)}>Seller</NavLink>}
            {user?.role === 'admin' && <NavLink to="/admin" className={linkClasses} onClick={() => setOpen(false)}>Admin</NavLink>}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
