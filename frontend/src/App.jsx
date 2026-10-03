import { Route, Routes } from 'react-router-dom';
import Landing from './pages/Landing';
import Apply from './pages/Apply';
import EventInfo from './pages/EventInfo';
import Login from './pages/admin/Login';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Applications from './pages/admin/Applications';
import ApplicationView from './pages/admin/ApplicationView';
import Users from './pages/admin/Users';
import Settings from './pages/admin/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/apply.html" element={<Apply />} />
      <Route path="/program.html" element={<EventInfo />} />
      <Route path="/admin.html/login" element={<Login />} />
      <Route path="/admin.html" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="applications" element={<Applications />} />
        <Route path="applications/:id" element={<ApplicationView />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Landing />} />
    </Routes>
  );
}
