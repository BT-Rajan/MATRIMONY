import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useI18n } from '../i18n';
import { useDevice } from '../useDevice';
import { HERO_SLIDES, UI, tx } from '../content/site';

const INTERVAL = 7000;
const norm = (n) => n.toLowerCase().replace(/^\d+[-_.\s]+/, '');

// Full-screen hero with the 5 themed slides (HERO_SLIDES). Each slide's picture is the file
// public/hero/<image>.jpg|png|webp (phones/tablets: public/hero/<device>/<image>.*); no file = colour background.
export default function HeroSlider() {
  const { t, lang } = useI18n();
  const device = useDevice();
  const [files, setFiles] = useState({});
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ratios, setRatios] = useState({});
  const [stageRatio, setStageRatio] = useState(16 / 9);
  const stage = useRef(null);
  const touchX = useRef(null);
  const reduce = useMemo(() => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches), []);
  const n = HERO_SLIDES.length;

  useEffect(() => {
    let off = false;
    api.get(`images/hero/${device}`)
      .then((r) => { if (!off) setFiles(Object.fromEntries((r.images || []).map((im) => [norm(im.name), im.src]))); })
      .catch(() => !off && setFiles({}));
    return () => { off = true; };
  }, [device]);

  useEffect(() => {
    if (!stage.current || !window.ResizeObserver) return undefined;
    const ro = new ResizeObserver(([e]) => { const { width, height } = e.contentRect; if (height) setStageRatio(width / height); });
    ro.observe(stage.current);
    return () => ro.disconnect();
  }, []);

  const auto = !hold && !paused && !reduce;
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
        {HERO_SLIDES.map((sl, k) => {
          const src = files[sl.image];
          const on = k === i;
          return (
            <figure
              key={sl.image}
              className={`hs-slide ${src ? `fit-${fit(src)}` : 'no-img'}${on ? ' on' : ''}`}
              style={{ '--tint-a': sl.tint[0], '--tint-b': sl.tint[1] }}
              aria-hidden={!on}
              aria-roledescription="slide"
              aria-label={`${k + 1} / ${n}`}
            >
              {src ? (
                <>
                  <img className="hs-bg" src={src} alt="" loading={k === 0 ? 'eager' : 'lazy'} />
                  <img
                    className="hs-fg"
                    src={src}
                    alt=""
                    loading={k === 0 ? 'eager' : 'lazy'}
                    fetchpriority={k === 0 ? 'high' : undefined}
                    onLoad={(e) => setRatios((r) => ({ ...r, [src]: e.target.naturalWidth / e.target.naturalHeight }))}
                  />
                </>
              ) : (
                <span className="hs-icon" aria-hidden="true">{sl.icon}</span>
              )}
              <div className="hs-shade" aria-hidden="true" />
              <div className="hs-caption">
                <h2>{tx(sl.title, lang)}</h2>
                <p>{tx(sl.text, lang)}</p>
                <Link to={sl.to} className="hs-more" tabIndex={on ? 0 : -1}>{tx(UI.more_short, lang)} <span aria-hidden="true">→</span></Link>
              </div>
            </figure>
          );
        })}
        {device !== 'mobile' && (
          <>
            <button type="button" className="hs-arrow prev" onClick={() => go(-1)} aria-label={tx(UI.prev, lang)}>‹</button>
            <button type="button" className="hs-arrow next" onClick={() => go(1)} aria-label={tx(UI.next, lang)}>›</button>
          </>
        )}
        <div className="hs-dots">
          {HERO_SLIDES.map((sl, k) => (
            <button key={sl.image} type="button" className={k === i ? 'on' : ''} aria-label={tx(sl.title, lang)} aria-current={k === i} onClick={() => setI(k)} />
          ))}
          {!reduce && (
            <button type="button" className="hs-pp" onClick={() => setPaused((p) => !p)} aria-label={tx(paused ? UI.play : UI.pause, lang)}>
              {paused ? '▶' : '❚❚'}
            </button>
          )}
        </div>
        <p className="sr-only" aria-live="polite">{tx(HERO_SLIDES[i].title, lang)} ({i + 1} / {n})</p>
      </div>
    </section>
  );
}
