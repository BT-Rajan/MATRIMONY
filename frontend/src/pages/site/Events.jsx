import { Link } from 'react-router-dom';
import SiteShell from '../../components/SiteShell';
import PageHero from '../../components/PageHero';
import { useI18n } from '../../i18n';
import { useSettings } from '../../useSettings';
import { fmtEventDate } from '../../date';
import { EVENTS, PAST_EVENTS, tx } from '../../content/site';

const L = {
  title: { ta: 'நிகழ்வுகள் & செயல்பாடுகள்', en: 'Events & Activities' },
  sub: { ta: 'சங்கக் கூட்டங்கள், விழாக்கள் மற்றும் சமூக நிகழ்வுகள்.', en: 'Sangam meetings, festivals and community functions.' },
  upcoming: { ta: 'வரவிருக்கும் நிகழ்வுகள்', en: 'Upcoming events' },
  past: { ta: 'கடந்த நிகழ்வுகள்', en: 'Past events' },
  more: { ta: 'மேலும் நிகழ்வுகள் இங்கு அறிவிக்கப்படும்.', en: 'More events will be announced here.' },
  past_more: { ta: 'கடந்த நிகழ்வுகளின் பட்டியல் விரைவில் இங்கு சேர்க்கப்படும்.', en: 'More past events will be listed here soon.' },
  details: { ta: 'விவரங்கள்', en: 'Details' },
  venue: { ta: 'இடம்', en: 'Venue' },
};

export default function Events() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const s = settings || {};
  const venue = (lang === 'en' ? s.venue_en : s.venue_ta) || '';
  const l = (k) => tx(L[k], lang);
  return (
    <SiteShell>
      <PageHero title={l('title')} sub={l('sub')} />
      <div className="wrap">
        <section className="events-section" aria-labelledby="ev-upcoming">
          <h2 id="ev-upcoming" className="sec-title"><span className="sec-ico" aria-hidden="true">📅</span>{l('upcoming')}</h2>
          <div className="events-grid">
            <article className="event-card">
              <div className="ev-date"><span>{fmtEventDate(s.event_date, lang) || t('date_tba')}</span></div>
              <div className="ev-body">
                <h3>{t('event')} – {t('edition')}</h3>
                {venue && <p>{venue}</p>}
                <p className="hint">{t('last_date_label')}: <strong>{t('last_date')}</strong></p>
                <div className="row">
                  <Link to="/apply.html" className="btn small">{t('apply_btn')}</Link>
                  <Link to="/ms2026" className="btn secondary small">{l('details')}</Link>
                </div>
              </div>
            </article>
            {EVENTS.map((e) => (
              <article className="event-card" key={e.title.en}>
                <div className="ev-date"><span>{tx(e.date, lang)}</span></div>
                <div className="ev-body"><h3>{tx(e.title, lang)}</h3><p>{tx(e.venue, lang)}</p><p>{tx(e.text, lang)}</p></div>
              </article>
            ))}
          </div>
          <p className="hint">{l('more')}</p>
        </section>

        <section className="events-section" aria-labelledby="ev-past">
          <h2 id="ev-past" className="sec-title"><span className="sec-ico" aria-hidden="true">🏛️</span>{l('past')}</h2>
          <div className="events-grid">
            {PAST_EVENTS.map((e) => (
              <article className="event-card past-card" key={e.title.en}>
                <div className="ev-date past"><span>{tx(e.date, lang)}</span></div>
                <div className="ev-body">
                  <h3>{tx(e.title, lang)}</h3>
                  <p className="venue-line"><span aria-hidden="true">📍</span> <span className="sr-only">{l('venue')}: </span>{tx(e.venue, lang)}</p>
                  <p>{tx(e.text, lang)}</p>
                </div>
              </article>
            ))}
            <article className="event-card placeholder-card" aria-label={l('past_more')}>
              <div className="ev-body">
                <h3>+</h3>
                <p className="hint">{l('past_more')}</p>
              </div>
            </article>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
