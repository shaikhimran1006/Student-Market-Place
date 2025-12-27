import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
