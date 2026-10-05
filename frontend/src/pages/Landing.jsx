import { Link } from 'react-router-dom';
import PublicShell from '../components/PublicShell';
import { useI18n } from '../i18n';
import { SITE } from '../config';
import { useSettings } from '../useSettings';
import BankDetails from '../components/BankDetails';

export default function Landing() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  return (
    <PublicShell>
      <section className="hero">
        <h1>{t('brand')}</h1>
        <p className="edition">{t('edition')}</p>
        <h2>{t('event')}</h2>
        <p>{t('hero_tag')}</p>
        <p><Link to="/program.html" className="btn secondary small">{t('event_link')} →</Link></p>
      </section>

      <div className="deadline" role="note">
        <span>{t('last_date_label')}</span>
        <strong>{t('last_date')}</strong>
        {settings?.event_date && <small>{t('event_on')}: {settings.event_date}</small>}
      </div>

      <div className="notice" role="note">
        <strong>{t('notice_title')}</strong>
        {t('notice_text')}
      </div>

      <div className="center">
        <Link to="/apply.html" className="btn block" style={{ maxWidth: 420, margin: '0 auto' }}>{t('apply_btn')} →</Link>
        <p className="hint">{t('apply_note')}</p>
      </div>

      <section className="card" aria-labelledby="how">
        <h2 id="how">{t('steps_title')}</h2>
        <ol className="steps">
          {[1, 2, 3, 4].map((n) => <li key={n}>{t(`step${n}`)}</li>)}
        </ol>
      </section>

      <section className="card" aria-labelledby="pay">
        <h2 id="pay">{t('bank_title')}</h2>
        <p><strong>{t('bank_fee')}:</strong> Rs. {SITE.fee}/-</p>
        <BankDetails settings={settings} lang={lang} />
      </section>

      <section className="card" aria-labelledby="contact">
        <h2 id="contact">{t('contact_title')}</h2>
        <ul className="officers">
          {SITE.officers.map((o) => (
            <li key={o.role.en}>
              <span>{o.role[lang]}</span>
              <strong>{o.name[lang]}</strong>
              <a href={`tel:${o.tel}`}>{o.phone}</a>
            </li>
          ))}
        </ul>
      </section>

      <p className="foot"><Link to="/admin.html" className="btn secondary small">{t('staff_login')}</Link></p>
    </PublicShell>
  );
}
