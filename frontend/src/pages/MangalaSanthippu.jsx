import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SiteShell from '../components/SiteShell';
import ApplySection from '../components/ApplySection';
import BankDetails from '../components/BankDetails';
import { useI18n } from '../i18n';
import { SITE } from '../config';
import { useSettings } from '../useSettings';
import { fmtEventDate } from '../date';

const UTR = {
  ta: 'கட்டணம் செலுத்திய பின் பரிவர்த்தனை எண்ணை (UTR) படிவத்தில் குறிப்பிட வேண்டும்.',
  en: 'After paying, enter the transaction number (UTR) in the form.',
};

// One page: event details, how to apply, payment and the application form (#apply). Contacts are in the site footer.
export default function MangalaSanthippu() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const { hash } = useLocation();
  const s = settings || {};

  // the page grows once settings load, so re-align the #apply anchor
  useEffect(() => {
    if (hash === '#apply' && settings) document.getElementById('apply')?.scrollIntoView();
  }, [hash, settings]);

  return (
    <SiteShell>
      <div className="wrap narrow">
        <section className="ms-hero">
          <p className="edition">{t('edition')}</p>
          <h1>{t('event')}</h1>
          <p>{t('hero_tag')}</p>
          <a href="#apply" className="btn accent apply-now">{t('apply_btn')} →</a>
          <p className="hint">{t('apply_note')}</p>
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

        <section className="card" aria-labelledby="how">
          <h2 id="how">{t('steps_title')}</h2>
          <ol className="steps">
            {[1, 2, 3, 4].map((n) => <li key={n}>{t(`step${n}`)}</li>)}
          </ol>
          <p className="hint warn">{t('notice_text')}</p>
        </section>

        <section className="card" aria-labelledby="pay">
          <h2 id="pay">{t('bank_title')}</h2>
          {settings ? <BankDetails settings={settings} lang={lang} /> : <p role="status">{t('loading')}</p>}
          <p className="hint">{UTR[lang]}</p>
        </section>

        <ApplySection />
      </div>
    </SiteShell>
  );
}
