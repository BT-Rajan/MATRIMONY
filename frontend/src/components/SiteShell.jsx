import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n';
import { NAV, UI, tx } from '../content/site';
import LangToggle from './LangToggle';
import '../site.css';

export default function SiteShell({ children }) {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [pathname]);

  return (
    <>
      <a className="skip" href="#main">{t('skip')}</a>
      <header className="site-head">
        <div className="site-head-in">
          <Link to="/" className="site-brand">
            <img src="/logo-192.png" alt="" width="40" height="40" />
            <span>{t('brand')}</span>
          </Link>
          <nav id="site-nav" className={`site-nav${open ? ' open' : ''}`} aria-label="Main">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}>{tx(n, lang)}</NavLink>
            ))}
          </nav>
          <div className="site-head-actions">
            <LangToggle />
            <Link to="/admin.html" className="btn small login-btn">{tx(UI.member_login, lang)}</Link>
            <button type="button" className="menu-btn" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen((o) => !o)}>
              <span aria-hidden="true">{open ? '✕' : '☰'}</span>
              <span className="sr-only">{tx(UI.menu, lang)}</span>
            </button>
          </div>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="site-foot">
        <div className="wrap">
          <img src="/logo-192.png" alt="" width="48" height="48" />
          <strong>{t('brand')}</strong>
          <span>{tx(UI.tagline, lang)}</span>
          <small>{tx(UI.footer_privacy, lang)}</small>
        </div>
      </footer>
    </>
  );
}
