import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/auth/Login';
import RegistrationWizard from '../pages/registration/RegistrationWizard';
import MainLayout from '../layouts/MainLayout';
import MemberDashboard from '../pages/dashboard/MemberDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import MastersIndexPage from '../pages/admin/masters/MastersIndexPage';
import MasterListPage from '../pages/admin/masters/MasterListPage';
import MembersListPage from '../pages/admin/members/MembersListPage';
import MemberDetailPage from '../pages/admin/members/MemberDetailPage';
import BookletView from '../pages/admin/booklet/BookletView';
import ReportsPage from '../pages/admin/reports/ReportsPage';
import NotFound from '../pages/NotFound';
import ProtectedRoute from './ProtectedRoute';
import { ROLES, ROUTES } from '../utils/constants';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegistrationWizard />} />

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
          <Route path="/admin/members" element={<MembersListPage />} />
          <Route path="/admin/members/:id" element={<MemberDetailPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
        </Route>
        <Route path="/admin/booklet" element={<BookletView />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
