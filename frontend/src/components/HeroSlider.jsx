import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';
import { useDevice } from '../useDevice';
import { UI, tx } from '../content/site';

const INTERVAL = 5500;
const pretty = (n) => n.replace(/^\d+[-_.\s]+/, '').replace(/[-_]+/g, ' ').trim();

// Full-screen hero. Shows every image in /public/hero (device folders first, see public/hero/README.txt).
// Images that match the screen shape fill it; very different shapes (posters etc.) are shown whole on a blurred backdrop.
export default function HeroSlider({ children }) {
  const { t, lang } = useI18n();
  const device = useDevice();
  const [imgs, setImgs] = useState(null);
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ratios, setRatios] = useState({});
  const [stageRatio, setStageRatio] = useState(16 / 9);
  const stage = useRef(null);
  const touchX = useRef(null);
  const reduce = useMemo(() => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), []);

  useEffect(() => {
    let off = false;
    api.get(`images/hero/${device}`).then((r) => { if (!off) { setImgs(r.images || []); setI(0); } }).catch(() => !off && setImgs([]));
    return () => { off = true; };
  }, [device]);

  useEffect(() => {
    if (!stage.current || !window.ResizeObserver) return undefined;
    const ro = new ResizeObserver(([e]) => { const { width, height } = e.contentRect; if (height) setStageRatio(width / height); });
    ro.observe(stage.current);
    return () => ro.disconnect();
  }, []);

  const n = imgs ? imgs.length : 0;
  const auto = n > 1 && !hold && !paused && !reduce;
  useEffect(() => {
    if (!auto) return undefined;
    const id = setInterval(() => setI((x) => (x + 1) % n), INTERVAL);
    return () => clearInterval(id);
  }, [auto, n]);

  const go = (d) => setI((x) => (x + d + n) % n);
  const onKey = (e) => { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
  };
  const fit = (src) => {
    const r = ratios[src];
    return r && Math.abs(Math.log(r / stageRatio)) > 0.45 ? 'contain' : 'cover';
  };

  return (
    <section className="hero-slider" data-device={device} aria-roledescription="carousel" aria-label={t('brand')}>
      <div
        ref={stage}
        className="hs-stage"
        tabIndex={0}
        onKeyDown={onKey}
        onMouseEnter={() => setHold(true)}
        onMouseLeave={() => setHold(false)}
        onFocus={() => setHold(true)}
        onBlur={() => setHold(false)}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={onTouchEnd}
      >
        {n === 0 && (
          <div className="hs-empty">
            <img src="/logo.png" alt="" width="150" height="150" />
          </div>
        )}
        {imgs && imgs.map((im, k) => (
          <figure key={im.src} className={`hs-slide fit-${fit(im.src)}${k === i ? ' on' : ''}`} aria-hidden={k !== i} aria-roledescription="slide" aria-label={`${k + 1} / ${n}`}>
            <img className="hs-bg" src={im.src} alt="" loading={k === 0 ? 'eager' : 'lazy'} />
            <img
              className="hs-fg"
              src={im.src}
              alt={pretty(im.name)}
              loading={k === 0 ? 'eager' : 'lazy'}
              fetchpriority={k === 0 ? 'high' : undefined}
              onLoad={(e) => setRatios((r) => ({ ...r, [im.src]: e.target.naturalWidth / e.target.naturalHeight }))}
            />
          </figure>
        ))}
        <div className="hs-shade" aria-hidden="true" />
        {n > 1 && (
          <>
            {device !== 'mobile' && (
              <>
                <button type="button" className="hs-arrow prev" onClick={() => go(-1)} aria-label={tx(UI.prev, lang)}>‹</button>
                <button type="button" className="hs-arrow next" onClick={() => go(1)} aria-label={tx(UI.next, lang)}>›</button>
              </>
            )}
            <div className="hs-dots">
              {imgs.map((im, k) => (
                <button key={im.src} type="button" className={k === i ? 'on' : ''} aria-label={tx(UI.go_slide, lang).replace('{n}', k + 1)} aria-current={k === i} onClick={() => setI(k)} />
              ))}
              {!reduce && (
                <button type="button" className="hs-pp" onClick={() => setPaused((p) => !p)} aria-label={tx(paused ? UI.play : UI.pause, lang)}>
                  {paused ? '▶' : '❚❚'}
                </button>
              )}
            </div>
          </>
        )}
        <p className="sr-only" aria-live="polite">{n > 0 ? `${i + 1} / ${n}` : ''}</p>
        <div className="hs-band">{children}</div>
      </div>
    </section>
  );
}
