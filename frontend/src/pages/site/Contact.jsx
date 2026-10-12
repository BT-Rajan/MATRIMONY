import SiteShell from '../../components/SiteShell';
import PageHero from '../../components/PageHero';
import { useI18n } from '../../i18n';
import { SITE } from '../../config';
import { tx } from '../../content/site';

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
        <section className="card">
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
