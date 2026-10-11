import { Navigate, Route, Routes } from 'react-router-dom';
import Home from './pages/site/Home';
import About from './pages/site/About';
import Events from './pages/site/Events';
import Welfare from './pages/site/Welfare';
import NewsGallery from './pages/site/NewsGallery';
import Community from './pages/site/Community';
import Contact from './pages/site/Contact';
import MangalaSanthippu from './pages/MangalaSanthippu';
import Apply from './pages/Apply';
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
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/events" element={<Events />} />
      <Route path="/mangala-santhippu" element={<MangalaSanthippu />} />
      <Route path="/welfare" element={<Welfare />} />
      <Route path="/news-gallery" element={<NewsGallery />} />
      <Route path="/community" element={<Community />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/apply.html" element={<Apply />} />
      <Route path="/program.html" element={<Navigate to="/mangala-santhippu" replace />} />
      <Route path="/admin.html/login" element={<Login />} />
      <Route path="/admin.html" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="applications" element={<Applications />} />
        <Route path="applications/:id" element={<ApplicationView />} />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
