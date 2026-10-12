import SiteShell from '../../components/SiteShell';
import PageHero from '../../components/PageHero';
import { FacebookIcon, PhoneIcon, UsersIcon, RoleIcon } from '../../components/Icons';
import { useI18n } from '../../i18n';
import { SITE, CONTACT_INFO } from '../../config';
import { UI, tx } from '../../content/site';

const L = {
  title: { ta: 'தொடர்புக்கு', en: 'Contact Us' },
  sub: { ta: 'சங்க நிர்வாகிகளை நேரடியாகத் தொடர்பு கொள்ளலாம்.', en: 'Reach the Sangam office bearers directly.' },
};

// Maps the officer's English role to an icon key.
const roleKey = (o) => o.role.en.toLowerCase();

export default function Contact() {
  const { t, lang } = useI18n();
  return (
    <SiteShell>
      <PageHero title={tx(L.title, lang)} sub={`${t('brand')} – ${tx(L.sub, lang)}`}>
        <div className="hero-badges" aria-hidden="true">
          <span><PhoneIcon /></span><span><UsersIcon /></span><span><FacebookIcon /></span>
        </div>
      </PageHero>
      <div className="wrap">
        <section className="card contact-section" aria-labelledby="c-office">
          <h2 id="c-office" className="sec-title"><span className="sec-ico"><UsersIcon /></span>{tx(UI.contact_office, lang)}</h2>
          <ul className="officer-grid">
            {SITE.officers.map((o) => (
              <li className="officer" key={o.role.en}>
                <span className="role-ico"><RoleIcon role={roleKey(o)} /></span>
                <div className="officer-body">
                  <span className="officer-role">{tx(o.role, lang)}</span>
                  <strong>{tx(o.name, lang)}</strong>
                  <a className="call-link" href={`tel:${o.tel}`}><PhoneIcon /> {o.phone}</a>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {CONTACT_INFO.facebook && (
          <section className="card contact-section" aria-labelledby="c-follow">
            <h2 id="c-follow" className="sec-title"><span className="sec-ico"><FacebookIcon /></span>{tx(UI.footer_follow, lang)}</h2>
            <a className="btn" href={CONTACT_INFO.facebook} target="_blank" rel="noopener noreferrer"><FacebookIcon /> Facebook</a>
          </section>
        )}
      </div>
    </SiteShell>
  );
}
