import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useI18n } from '../i18n';
import { FOOTER_NAV, NAV, UI, tx } from '../content/site';
import LangToggle from './LangToggle';
import '../site.css';

function HomeIcon() {
  return (
    <svg className="home-ico" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v10h13V10" /><path d="M10 20v-5.5h4V20" />
    </svg>
  );
}

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
              <NavLink key={n.to} to={n.to} end={n.end} className={n.hl ? 'hl' : undefined} aria-label={n.icon ? tx(n, lang) : undefined}>
                {n.icon === 'home' ? <><HomeIcon /><span className="home-txt">{tx(n, lang)}</span></> : tx(n, lang)}
              </NavLink>
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
          <nav className="foot-nav" aria-label={tx(UI.footer_menu, lang)}>
            {FOOTER_NAV.map((n) => <Link key={n.to} to={n.to}>{tx(n, lang)}</Link>)}
          </nav>
          <small>{tx(UI.footer_privacy, lang)}</small>
          <small className="copy">© {new Date().getFullYear()} {tx(UI.copyright, lang)}</small>
        </div>
      </footer>
    </>
  );
}
