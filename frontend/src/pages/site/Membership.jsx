import { Link } from 'react-router-dom';
import SiteShell from '../../components/SiteShell';
import PageHero from '../../components/PageHero';
import { useI18n } from '../../i18n';
import { tx } from '../../content/site';

const L = {
  title: { ta: 'உறுப்பினர்', en: 'Membership' },
  sub: { ta: 'சங்க உறுப்பினர் சேர்க்கை குறித்த தகவல்.', en: 'About joining the Sangam.' },
  head: { ta: 'அழைப்பின் மூலம் மட்டுமே உறுப்பினர் சேர்க்கை', en: 'Membership is by invitation only' },
  body: {
    ta: 'அழைப்பு பெற, சங்க நிர்வாகிகளைத் தொடர்பு கொண்டு கோரிக்கை வையுங்கள். அழைப்பை நீட்டிக்கவோ அல்லது மறுக்கவோ, எந்தக் காரணமும் குறிப்பிடாமல், சங்க நிர்வாகிகளுக்கு முழு உரிமை உண்டு.',
    en: 'To request an invite, please contact the office-bearers. The office-bearers have the absolute right to extend or refuse an invite to anyone, without citing any reason.',
  },
  contact: { ta: 'நிர்வாகிகளைத் தொடர்பு கொள்ளுங்கள்', en: 'Contact the office-bearers' },
};

export default function Membership() {
  const { lang } = useI18n();
  return (
    <SiteShell>
      <PageHero title={tx(L.title, lang)} sub={tx(L.sub, lang)} />
      <div className="wrap narrow">
        <section className="card">
          <h2>{tx(L.head, lang)}</h2>
          <p>{tx(L.body, lang)}</p>
          <Link to="/contact" className="btn">{tx(L.contact, lang)}</Link>
        </section>
      </div>
    </SiteShell>
  );
}
