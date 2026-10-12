import SiteShell from '../../components/SiteShell';
import PageHero from '../../components/PageHero';
import ImageGrid from '../../components/ImageGrid';
import { useI18n } from '../../i18n';
import { NEWS, tx } from '../../content/site';

const L = {
  title: { ta: 'செய்திகள் & படங்கள்', en: 'News & Gallery' },
  news: { ta: 'அறிவிப்புகள்', en: 'Announcements' },
  none: { ta: 'தற்போது புதிய அறிவிப்புகள் இல்லை.', en: 'No announcements at the moment.' },
  gallery: { ta: 'படத்தொகுப்பு', en: 'Gallery' },
  empty: { ta: 'படங்கள் விரைவில் சேர்க்கப்படும்.', en: 'Photographs will be added soon.' },
};

export default function NewsGallery() {
  const { lang } = useI18n();
  return (
    <SiteShell>
      <PageHero title={tx(L.title, lang)} />
      <div className="wrap">
        <section aria-labelledby="nw">
          <h2 id="nw">{tx(L.news, lang)}</h2>
          {NEWS.length === 0 && <p className="hint">{tx(L.none, lang)}</p>}
          {NEWS.map((n) => (
            <article className="card" key={n.title.en}>
              <h3>{tx(n.title, lang)}</h3><p className="hint">{n.date}</p><p>{tx(n.text, lang)}</p>
            </article>
          ))}
        </section>
        <section aria-labelledby="gl">
          <h2 id="gl">{tx(L.gallery, lang)}</h2>
          <ImageGrid folder="gallery" empty={tx(L.empty, lang)} />
        </section>
      </div>
    </SiteShell>
  );
}
