import { Link } from 'react-router-dom';
import PublicShell from '../components/PublicShell';
import { useI18n } from '../i18n';
import { SITE } from '../config';
import { useSettings } from '../useSettings';
import { fmtEventDate } from '../date';

export default function Landing() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const s = settings || {};
  return (
    <PublicShell>
      <section className="hero">
        <img className="logo" src="/logo.png" alt="" width="150" height="150" />
        <h1>{t('brand')}</h1>
        <p className="edition">{t('edition')}</p>
        <h2>{t('event')}</h2>
        <p>{t('hero_tag')}</p>
      </section>

      <section className="key-info" aria-label={t('event')}>
        <dl>
          <div><dt>{t('event_on')}</dt><dd>{fmtEventDate(s.event_date, lang) || t('date_tba')}</dd></div>
          <div><dt>{t('where')}</dt><dd>{(lang === 'en' ? s.venue_en : s.venue_ta) || '—'}</dd></div>
        </dl>
        <dl className="accent">
          <div><dt>{t('last_date_label')}</dt><dd>{t('last_date')}</dd></div>
          <div><dt>{t('bank_fee')}</dt><dd>₹ {SITE.fee}/-</dd></div>
        </dl>
      </section>

      {settings && (
        <p className="bank-line">
          <strong>{t('bank_title')}:</strong>{' '}
          {[(lang === 'en' && s.bank_name_en) || s.bank_name, s.bank_account && `${t('bank_acc')}: ${s.bank_account}`, s.bank_ifsc && `IFSC: ${s.bank_ifsc}`]
            .filter(Boolean).join(' · ')}
        </p>
      )}

      <section className="card" aria-labelledby="how">
        <h2 id="how">{t('steps_title')}</h2>
        <ol className="steps">
          {[1, 2, 3, 4].map((n) => <li key={n}>{t(`step${n}`)}</li>)}
        </ol>
        <p className="hint warn">{t('notice_text')}</p>
      </section>

      <div className="center">
        <Link to="/apply.html" className="btn block apply-now">{t('apply_btn')} →</Link>
        <p className="hint">{t('apply_note')}</p>
      </div>

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
