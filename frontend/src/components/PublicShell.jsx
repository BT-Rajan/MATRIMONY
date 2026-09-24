import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import LangToggle from './LangToggle';

export default function PublicShell({ children, showLang = true }) {
  const { t } = useI18n();
  return (
    <>
      <a className="skip" href="#main">{t('skip')}</a>
      <header className="topbar">
        <div className="wrap">
          <Link to="/" className="brand">{t('brand')}</Link>
          {showLang && <LangToggle />}
        </div>
      </header>
      <main id="main" className="wrap">{children}</main>
    </>
  );
}
