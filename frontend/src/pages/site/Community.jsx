import { Link } from 'react-router-dom';
import SiteShell from '../../components/SiteShell';
import { useI18n } from '../../i18n';
import { COMMUNITY_SECTIONS, UI, tx } from '../../content/site';

const L = {
  title: { ta: 'சமூகம்', en: 'Community' },
  sub: { ta: 'கார்காத்தார் சமூகக் குடும்பங்களின் சாதனைகள், மூத்தோர், இளைஞர் மற்றும் தொழில் வல்லுநர்கள்.', en: 'Achievements, elders, youth and professionals of the Karkathar community families.' },
  join: { ta: 'சமூகத்தில் இணைய அல்லது உங்கள் விவரங்களைப் பகிர சங்க நிர்வாகிகளைத் தொடர்பு கொள்ளுங்கள்.', en: 'To join the community or share your details, please contact the Sangam office bearers.' },
  contact: { ta: 'தொடர்புக்கு', en: 'Contact us' },
};

export default function Community() {
  const { lang } = useI18n();
  return (
    <SiteShell>
      <div className="wrap narrow">
        <h1>{tx(L.title, lang)}</h1>
        <p className="lead">{tx(L.sub, lang)}</p>
        <p>{tx(UI.our_community_text, lang)}</p>
        <ul className="welfare-list">
          {COMMUNITY_SECTIONS.map((c) => (
            <li className="card" key={c.title.en}>
              <span className="w-ico" aria-hidden="true">{c.icon}</span>
              <div><h2>{tx(c.title, lang)}</h2><p>{tx(c.text, lang)}</p></div>
            </li>
          ))}
        </ul>
        <p className="hint">{tx(UI.community_consent, lang)}</p>
        <p>{tx(L.join, lang)}</p>
        <Link to="/contact" className="btn">{tx(L.contact, lang)}</Link>
      </div>
    </SiteShell>
  );
}
