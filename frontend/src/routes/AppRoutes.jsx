import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import RegisterComingSoon from '../pages/auth/RegisterComingSoon';
import MainLayout from '../layouts/MainLayout';
import MemberDashboard from '../pages/dashboard/MemberDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import MastersIndexPage from '../pages/admin/masters/MastersIndexPage';
import MasterListPage from '../pages/admin/masters/MasterListPage';
import NotFound from '../pages/NotFound';
import ProtectedRoute from './ProtectedRoute';
import { ROLES, ROUTES } from '../utils/constants';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterComingSoon />} />

      <Route element={<ProtectedRoute allowedRoles={[ROLES.MEMBER]} />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<MemberDashboard />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route element={<MainLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/masters" element={<MastersIndexPage />} />
          <Route path="/admin/masters/:slug" element={<MasterListPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
