import SiteShell from '../../components/SiteShell';
import PageHero from '../../components/PageHero';
import { PinIcon, FacebookIcon } from '../../components/Icons';
import { useI18n } from '../../i18n';
import { SITE, CONTACT_INFO } from '../../config';
import { UI, tx } from '../../content/site';

const L = {
  title: { ta: 'தொடர்புக்கு', en: 'Contact Us' },
  sub: { ta: 'சங்க நிர்வாகிகளை நேரடியாகத் தொடர்பு கொள்ளலாம்.', en: 'Reach the Sangam office bearers directly.' },
};

export default function Contact() {
  const { t, lang } = useI18n();
  return (
    <SiteShell>
      <PageHero title={tx(L.title, lang)} sub={`${t('brand')} – ${tx(L.sub, lang)}`} />
      <div className="wrap">
        <div className="contact-grid">
          <section className="card" aria-labelledby="c-office">
            <h2 id="c-office">{tx(UI.contact_office, lang)}</h2>
            <ul className="people-grid officers-grid">
              {SITE.officers.map((o) => (
                <li className="person" key={o.role.en}>
                  <span>{tx(o.role, lang)}</span>
                  <strong>{tx(o.name, lang)}</strong>
                  <a href={`tel:${o.tel}`}>{tx(UI.contact_call, lang)}: {o.phone}</a>
                </li>
              ))}
            </ul>
          </section>

          <section className="card" aria-labelledby="c-loc">
            <h2 id="c-loc"><span className="h-ico"><PinIcon /></span> {tx(UI.footer_location, lang)}</h2>
            <p>{tx(UI.footer_meet, lang)}: <strong>{tx(CONTACT_INFO.address, lang)}</strong></p>
            {CONTACT_INFO.facebook && (
              <p>
                <a className="btn secondary small" href={CONTACT_INFO.facebook} target="_blank" rel="noopener noreferrer">
                  <FacebookIcon /> {tx(UI.footer_follow, lang)}
                </a>
              </p>
            )}
          </section>
        </div>
      </div>
    </SiteShell>
  );
}
