import { Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Apply from './pages/Apply';
import Login from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Applications from './pages/admin/Applications';
import ApplicationView from './pages/admin/ApplicationView';
import Users from './pages/admin/Users';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/apply" element={<Apply />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="applications" element={<Applications />} />
        <Route path="applications/:id" element={<ApplicationView />} />
        <Route path="users" element={<Users />} />
      </Route>
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
