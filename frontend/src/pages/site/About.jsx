import SiteShell from '../../components/SiteShell';
import { useI18n } from '../../i18n';
import { SITE } from '../../config';
import { HISTORY, OBJECTIVES, tx } from '../../content/site';

const L = {
  title: { ta: 'எங்களைப் பற்றி', en: 'About Us' },
  obj: { ta: 'நோக்கங்கள்', en: 'Objectives' },
  hist: { ta: 'சங்க வரலாறு', en: 'History of the Sangam' },
  hist_none: { ta: 'சங்கத்தின் வரலாறு மற்றும் சமூகப் பாரம்பரியம் விரைவில் இங்கு சேர்க்கப்படும்.', en: 'The Sangam’s history and community heritage will be added here soon.' },
  office: { ta: 'நிர்வாகிகள்', en: 'Office bearers' },
};

export default function About() {
  const { t, lang } = useI18n();
  return (
    <SiteShell>
      <div className="wrap narrow">
        <h1>{tx(L.title, lang)}</h1>
        <p className="lead">{t('brand')}</p>
        <section className="card"><h2>{tx(L.obj, lang)}</h2>
          <ul className="bullets">{OBJECTIVES.map((o) => <li key={o.en}>{tx(o, lang)}</li>)}</ul>
        </section>
        <section className="card"><h2>{tx(L.hist, lang)}</h2>
          <p>{tx(HISTORY, lang) || tx(L.hist_none, lang)}</p>
        </section>
        <section className="card"><h2>{tx(L.office, lang)}</h2>
          <ul className="officers">
            {SITE.officers.map((o) => (
              <li key={o.role.en}><span>{o.role[lang]}</span><strong>{o.name[lang]}</strong><a href={`tel:${o.tel}`}>{o.phone}</a></li>
            ))}
          </ul>
        </section>
      </div>
    </SiteShell>
  );
}
