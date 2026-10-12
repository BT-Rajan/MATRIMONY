import { Link } from 'react-router-dom';
import SiteShell from '../components/SiteShell';
import PageHero from '../components/PageHero';
import { useI18n } from '../i18n';
import { SITE } from '../config';
import { useSettings } from '../useSettings';
import { fmtEventDate } from '../date';

// Mangala Santhippu 2026: event details and how to apply. The form itself is on /apply.html.
export default function Ms2026() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const s = settings || {};
  return (
    <SiteShell>
      <PageHero title={t('event')} sub={`${t('edition')} · ${t('hero_tag')}`}>
        <div className="row">
          <Link to="/apply.html" className="btn accent">{t('apply_btn')} →</Link>
        </div>
        <p className="hint on-dark">{t('apply_note')}</p>
      </PageHero>

      <div className="wrap">
        <div className="ms-cols">
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

          <section className="card" aria-labelledby="how">
            <h2 id="how">{t('steps_title')}</h2>
            <ol className="steps">
              {[1, 2, 3, 4].map((n) => <li key={n}>{t(`step${n}`)}</li>)}
            </ol>
          </section>
        </div>
      </div>
    </SiteShell>
  );
}
