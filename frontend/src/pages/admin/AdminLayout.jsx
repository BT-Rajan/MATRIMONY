import { Link, NavLink, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth';
import { useI18n } from '../../i18n';
import LangToggle from '../../components/LangToggle';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { t } = useI18n();

  if (user === undefined) return <p className="wrap" role="status">{t('loading')}</p>;
  if (!user) return <Navigate to="/admin/login" replace />;

  const link = ({ isActive }) => (isActive ? 'active' : undefined);
  return (
    <>
      <a className="skip" href="#main">{t('skip')}</a>
      <header className="topbar">
        <div className="wrap">
          <Link to="/" className="brand">{t('brand')}</Link>
          <div className="topbar-actions">
            <span className="who">{user.name} ({t('role_' + user.role)})</span>
            <LangToggle />
            <button type="button" className="btn secondary small" onClick={logout}>{t('sign_out')}</button>
          </div>
        </div>
      </header>
      <nav className="admin-nav" aria-label="Admin">
        <NavLink to="/admin" end className={link}>{t('nav_dashboard')}</NavLink>
        <NavLink to="/admin/applications" className={link}>{t('nav_apps')}</NavLink>
        {user.role === 'admin' && <NavLink to="/admin/users" className={link}>{t('nav_users')}</NavLink>}
      </nav>
      <main id="main" className="wrap"><Outlet /></main>
    </>
  );
}
