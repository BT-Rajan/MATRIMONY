import SiteShell from '../../components/SiteShell';
import PageHero from '../../components/PageHero';
import { useI18n } from '../../i18n';
import { SITE } from '../../config';
import { HISTORY, OBJECTIVES, tx } from '../../content/site';
import { FOUNDERS, PATRONS, ADVISORS, PAST_PRESIDENTS, EXECUTIVE_COUNCIL } from '../../content/leadership';

const L = {
  title: { ta: 'சங்கம்', en: 'The Sangam' },
  sub: { ta: 'கார்காத்தார் சங்கம் – நோக்கம், வரலாறு மற்றும் தலைமை', en: 'Karkathar Sangam – purpose, history and leadership' },
  nav: { ta: 'பகுதிகள்', en: 'On this page' },
  obj: { ta: 'நோக்கங்கள்', en: 'Objectives' },
  hist: { ta: 'சங்க வரலாறு', en: 'History of the Sangam' },
  hist_none: { ta: 'சங்கத்தின் வரலாறு மற்றும் சமூகப் பாரம்பரியம் விரைவில் இங்கு சேர்க்கப்படும்.', en: 'The Sangam’s history and community heritage will be added here soon.' },
  office: { ta: 'தற்போதைய நிர்வாகிகள்', en: 'Current office bearers' },
  founders: { ta: 'நிறுவனர்கள்', en: 'Founders' },
  patrons: { ta: 'புரவலர்கள்', en: 'Patrons' },
  advisors: { ta: 'ஆலோசகர்கள்', en: 'Advisors' },
  past: { ta: 'முன்னாள் தலைவர்கள்', en: 'Past presidents' },
  council: { ta: 'செயற்குழு உறுப்பினர்கள்', en: 'Executive council' },
  soon: { ta: 'பெயர்கள் விரைவில் இங்கு வெளியிடப்படும்.', en: 'Names will be published here soon.' },
  tenure: { ta: 'பதவிக்காலம்', en: 'Tenure' },
  call: { ta: 'அழைக்க', en: 'Call' },
};

const SECTIONS = [
  ['obj', 'obj'], ['hist', 'hist'], ['office', 'office'], ['founders', 'founders'], ['patrons', 'patrons'],
  ['advisors', 'advisors'], ['past', 'past'], ['council', 'council'],
];

function People({ items, lang, t }) {
  if (!items.length) return <p className="hint">{t('soon')}</p>;
  return (
    <ul className="people-grid">
      {items.map((p, i) => (
        <li className="person" key={i}>
          <strong>{tx(p.name, lang)}</strong>
          {p.role && tx(p.role, lang) && <span>{tx(p.role, lang)}</span>}
        </li>
      ))}
    </ul>
  );
}

export default function About() {
  const { lang } = useI18n();
  const l = (k) => tx(L[k], lang);
  const sec = (id, title, body, extra = '') => (
    <section id={id} className={`sec card ${extra}`} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{title}</h2>
      {body}
    </section>
  );

  return (
    <SiteShell>
      <PageHero title={l('title')} sub={l('sub')} />
      <div className="wrap">
        <nav className="about-nav" aria-label={l('nav')}>
          {SECTIONS.map(([id, key]) => <a key={id} href={`#${id}`}>{l(key)}</a>)}
        </nav>

        <div className="about-grid">
          {sec('obj', l('obj'),
            <ul className="bullets">{OBJECTIVES.map((o) => <li key={o.en}>{tx(o, lang)}</li>)}</ul>)}
          {sec('hist', l('hist'), <p>{tx(HISTORY, lang) || l('hist_none')}</p>)}

          {sec('office', l('office'),
            <ul className="people-grid officers-grid">
              {SITE.officers.map((o) => (
                <li className="person" key={o.role.en}>
                  <span>{tx(o.role, lang)}</span>
                  <strong>{tx(o.name, lang)}</strong>
                  <a href={`tel:${o.tel}`}>{l('call')}: {o.phone}</a>
                </li>
              ))}
            </ul>,
            'span-2')}

          {sec('founders', l('founders'), <People items={FOUNDERS} lang={lang} t={l} />, 'span-2')}

          {sec('patrons', l('patrons'), <People items={PATRONS} lang={lang} t={l} />)}
          {sec('advisors', l('advisors'), <People items={ADVISORS} lang={lang} t={l} />)}

          {sec('past', l('past'),
            PAST_PRESIDENTS.length ? (
              <ul className="tenure-list">
                {PAST_PRESIDENTS.map((p, i) => (
                  <li key={i}>
                    <strong>{tx(p.name, lang)}</strong>
                    <time>{p.tenure}</time>
                  </li>
                ))}
              </ul>
            ) : <p className="hint">{l('soon')}</p>,
            'span-2')}

          {sec('council', l('council'), <People items={EXECUTIVE_COUNCIL} lang={lang} t={l} />, 'span-2')}
        </div>
      </div>
    </SiteShell>
  );
}
