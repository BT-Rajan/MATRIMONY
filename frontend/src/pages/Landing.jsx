import { Link } from 'react-router-dom';
import PublicShell from '../components/PublicShell';
import { useI18n } from '../i18n';
import { SITE } from '../config';

export default function Landing() {
  const { t, lang } = useI18n();
  return (
    <PublicShell>
      <section className="hero">
        <h1>{t('brand')}</h1>
        <h2>{t('event')}</h2>
        <p>{t('hero_tag')}</p>
        {SITE.event.date && (
          <p><strong>{t('when')}:</strong> {SITE.event.date} &nbsp;|&nbsp; <strong>{t('where')}:</strong> {SITE.event.venue[lang]}</p>
        )}
      </section>

      <div className="notice" role="note">
        <strong>{t('notice_title')}</strong>
        {t('notice_text')}
      </div>

      <div className="center">
        <Link to="/apply" className="btn block" style={{ maxWidth: 420, margin: '0 auto' }}>{t('apply_btn')} →</Link>
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
        <div className="bank">
          <p><strong>{t('bank_fee')}:</strong> Rs. {SITE.fee}/-</p>
          <p>{t('bank_acc')}: <strong>{SITE.bank.account}</strong>, {t('bank_branch')}</p>
        </div>
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

      <p className="foot"><Link to="/admin">{t('staff_login')}</Link></p>
    </PublicShell>
  );
}
