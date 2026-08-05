import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/common/Loader';
import { ROUTES } from '../utils/constants';

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <Loader fullscreen />;

  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback = user.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.MEMBER_DASHBOARD;
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}
