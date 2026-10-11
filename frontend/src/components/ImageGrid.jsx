import { useEffect, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';

const pretty = (n) => n.replace(/^\d+[-_.\s]+/, '').replace(/[-_]+/g, ' ').trim();

// Photo grid of everything in /public/<folder> with a simple lightbox.
export default function ImageGrid({ folder = 'gallery', empty }) {
  const { t } = useI18n();
  const [imgs, setImgs] = useState(null);
  const [open, setOpen] = useState(-1);

  useEffect(() => {
    let off = false;
    api.get(`images/${folder}`).then((r) => !off && setImgs(r.images || [])).catch(() => !off && setImgs([]));
    return () => { off = true; };
  }, [folder]);

  useEffect(() => {
    if (open < 0) return undefined;
    const n = imgs.length;
    const h = (e) => {
      if (e.key === 'Escape') setOpen(-1);
      if (e.key === 'ArrowLeft') setOpen((x) => (x - 1 + n) % n);
      if (e.key === 'ArrowRight') setOpen((x) => (x + 1) % n);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, imgs]);

  if (!imgs) return <p className="hint">{t('loading')}</p>;
  if (!imgs.length) return <p className="hint">{empty}</p>;
  return (
    <>
      <ul className="img-grid">
        {imgs.map((im, k) => (
          <li key={im.src}>
            <button type="button" onClick={() => setOpen(k)} aria-label={pretty(im.name) || String(k + 1)}>
              <img src={im.src} alt={pretty(im.name)} loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      {open >= 0 && (
        <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setOpen(-1)}>
          <img src={imgs[open].src} alt={pretty(imgs[open].name)} onClick={(e) => e.stopPropagation()} />
          <button type="button" className="lb-close" onClick={() => setOpen(-1)} aria-label="Close">✕</button>
        </div>
      )}
    </>
  );
}
