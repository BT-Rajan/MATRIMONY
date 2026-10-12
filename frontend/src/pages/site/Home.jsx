import { Link } from 'react-router-dom';
import SiteShell from '../../components/SiteShell';
import HeroSlider from '../../components/HeroSlider';
import { useI18n } from '../../i18n';
import { useSettings } from '../../useSettings';
import { useDevice } from '../../useDevice';
import { fmtEventDate } from '../../date';
import { MS_FEATURE, UI, WELFARE, tx } from '../../content/site';

export default function Home() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  const device = useDevice();
  const s = settings || {};
  const venue = (lang === 'en' ? s.venue_en : s.venue_ta) || '';

  return (
    <SiteShell>
      <HeroSlider />

      <div className="wrap">
        <section className="home-intro">
          <h1>{tx(UI.welcome, lang)}</h1>
          <p className="tag">{tx(UI.tagline, lang)}</p>
          {device !== 'mobile' && <p className="sub">{tx(UI.welcome_sub, lang)}</p>}
          <div className="row">
            <Link to="/mangala-santhippu#apply" className="btn accent">{tx(UI.apply_ms, lang)} →</Link>
            {device !== 'mobile' && <Link to="/events" className="btn secondary">{tx(UI.see_events, lang)}</Link>}
          </div>
        </section>

        <section className="home-sec" aria-labelledby="up">
          <h2 id="up">{tx(UI.upcoming, lang)}</h2>
          <article className="event-card">
            <div className="ev-date">
              <span>{fmtEventDate(s.event_date, lang) || t('date_tba')}</span>
            </div>
            <div className="ev-body">
              <h3>{t('event')}</h3>
              <p>{t('edition')}{venue ? ` · ${venue}` : ''}</p>
              <p className="hint">{t('last_date_label')}: <strong>{t('last_date')}</strong></p>
              <Link to="/mangala-santhippu" className="btn small">{tx(UI.more, lang)}</Link>
            </div>
          </article>
        </section>

        <section className="home-sec ms-feature" aria-labelledby="ms">
          <div>
            <h2 id="ms">{tx(MS_FEATURE.title, lang)}</h2>
            <p>{tx(MS_FEATURE.text, lang)}</p>
          </div>
          <div className="row">
            <Link to="/mangala-santhippu#apply" className="btn accent">{t('apply_btn')} →</Link>
            <Link to="/mangala-santhippu" className="btn secondary">{tx(UI.details, lang)}</Link>
          </div>
        </section>

        <section className="home-sec" aria-labelledby="svc">
          <h2 id="svc">{tx(UI.service_title, lang)}</h2>
          {device !== 'mobile' && <p className="hint">{tx(UI.service_sub, lang)}</p>}
          <ul className="tiles">
            {WELFARE.map((w) => (
              <li key={w.title.en}><Link to="/welfare"><span aria-hidden="true">{w.icon}</span><strong>{tx(w.title, lang)}</strong></Link></li>
            ))}
          </ul>
        </section>

        <section className="home-sec" aria-labelledby="oc">
          <h2 id="oc">{tx(UI.our_community, lang)}</h2>
          <p>{tx(UI.our_community_text, lang)}</p>
          <Link to="/community" className="btn secondary small">{tx(UI.view_gallery, lang)}</Link>
        </section>
      </div>
    </SiteShell>
  );
}
