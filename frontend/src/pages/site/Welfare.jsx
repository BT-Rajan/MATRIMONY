import { Link } from 'react-router-dom';
import SiteShell from '../../components/SiteShell';
import { useI18n } from '../../i18n';
import { WELFARE, tx } from '../../content/site';

const L = {
  title: { ta: 'சமூக நலன்', en: 'Community Welfare' },
  sub: { ta: 'கல்வி உதவி, மருத்துவ ஆதரவு, தேவையுள்ள குடும்பங்களுக்கு உதவி மற்றும் சமூக முயற்சிகள்.', en: 'Education assistance, medical support, help for families in need and community initiatives.' },
  ask: { ta: 'உதவி தேவையா அல்லது உதவ விரும்புகிறீர்களா? சங்க நிர்வாகிகளைத் தொடர்பு கொள்ளுங்கள்.', en: 'Need help, or want to volunteer? Please contact the Sangam office bearers.' },
  contact: { ta: 'தொடர்புக்கு', en: 'Contact us' },
};

export default function Welfare() {
  const { lang } = useI18n();
  return (
    <SiteShell>
      <div className="wrap narrow">
        <h1>{tx(L.title, lang)}</h1>
        <p className="lead">{tx(L.sub, lang)}</p>
        <ul className="welfare-list">
          {WELFARE.map((w) => (
            <li className="card" key={w.title.en}>
              <span className="w-ico" aria-hidden="true">{w.icon}</span>
              <div><h2>{tx(w.title, lang)}</h2><p>{tx(w.text, lang)}</p></div>
            </li>
          ))}
        </ul>
        <p>{tx(L.ask, lang)}</p>
        <Link to="/contact" className="btn">{tx(L.contact, lang)}</Link>
      </div>
    </SiteShell>
  );
}
