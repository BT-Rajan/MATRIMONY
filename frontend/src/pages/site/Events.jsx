import { Link } from 'react-router-dom';
import SiteShell from '../../components/SiteShell';
import { useI18n } from '../../i18n';
import { useSettings } from '../../useSettings';
import { fmtEventDate } from '../../date';
import { EVENTS, tx } from '../../content/site';

const L = {
  title: { ta: 'நிகழ்வுகள் & செயல்பாடுகள்', en: 'Events & Activities' },
  sub: { ta: 'சங்கக் கூட்டங்கள், விழாக்கள் மற்றும் சமூக நிகழ்வுகள்.', en: 'Sangam meetings, festivals and community functions.' },
  more: { ta: 'மேலும் நிகழ்வுகள் இங்கு அறிவிக்கப்படும்.', en: 'More events will be announced here.' },
};

export default function Events() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const s = settings || {};
  const venue = (lang === 'en' ? s.venue_en : s.venue_ta) || '';
  return (
    <SiteShell>
      <div className="wrap narrow">
        <h1>{tx(L.title, lang)}</h1>
        <p className="lead">{tx(L.sub, lang)}</p>
        <article className="event-card">
          <div className="ev-date"><span>{fmtEventDate(s.event_date, lang) || t('date_tba')}</span></div>
          <div className="ev-body">
            <h3>{t('event')} – {t('edition')}</h3>
            {venue && <p>{venue}</p>}
            <p className="hint">{t('last_date_label')}: <strong>{t('last_date')}</strong></p>
            <div className="row">
              <Link to="/apply.html" className="btn small">{t('apply_btn')}</Link>
              <Link to="/mangala-santhippu" className="btn secondary small">{tx({ ta: 'விவரங்கள்', en: 'Details' }, lang)}</Link>
            </div>
          </div>
        </article>
        {EVENTS.map((e) => (
          <article className="event-card" key={e.title.en}>
            <div className="ev-date"><span>{tx(e.date, lang)}</span></div>
            <div className="ev-body"><h3>{tx(e.title, lang)}</h3><p>{tx(e.venue, lang)}</p><p>{tx(e.text, lang)}</p></div>
          </article>
        ))}
        <p className="hint">{tx(L.more, lang)}</p>
      </div>
    </SiteShell>
  );
}
