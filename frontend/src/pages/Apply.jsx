import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicShell from '../components/PublicShell';
import ApplicationForm from '../components/ApplicationForm';
import { TERMS_TA } from '../content/terms';
import { EMPTY } from '../fields';
import { SITE } from '../config';
import { api } from '../api';

const DRAFT = 'kks_draft';

function Gate({ onAccept }) {
  const [ok, setOk] = useState(false);
  return (
    <>
      <p><Link to="/" className="btn secondary small">← முகப்பு</Link></p>
      <h1>மங்கல சந்திப்பு விண்ணப்பம்</h1>

      <div className="notice" role="note">
        <strong>முக்கிய அறிவிப்பு</strong>
        கட்டணம் செலுத்தி, முழுமையாக நிரப்பி சமர்ப்பிக்கப்பட்ட விண்ணப்பங்கள் மட்டுமே ஏற்றுக்கொள்ளப்படும்.
        <span className="sub" lang="en">Only paid and fully submitted applications will be accepted.</span>
      </div>

      <div className="bank">
        <p><strong>பதிவு கட்டணம்:</strong> ரூ. {SITE.fee}/-</p>
        <p>இந்தியன் வங்கி, கணக்கு எண்: <strong>{SITE.bank.account}</strong>, சிட்லபாக்கம் கிளை.</p>
        <p>கட்டணம் செலுத்திய பின் பரிவர்த்தனை எண்ணை (UTR) படிவத்தில் குறிப்பிட வேண்டும்.</p>
      </div>

      <section className="card" aria-labelledby="tt">
        <h2 id="tt">விதிமுறைகள் மற்றும் நிபந்தனைகள்</h2>
        <ol className="terms-list">{TERMS_TA.map((x, i) => <li key={i}>{x}</li>)}</ol>
        <div className="check big">
          <input id="accept" type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
          <label htmlFor="accept">நான் ஏற்றுக்கொள்கிறேன்</label>
        </div>
        <button type="button" className="btn block" disabled={!ok} onClick={onAccept}>தொடரவும்</button>
      </section>
    </>
  );
}

function Done({ reg }) {
  const [copied, setCopied] = useState(false);
  const h = useRef(null);
  useEffect(() => { h.current?.focus(); window.scrollTo(0, 0); }, []);
  const copy = async () => {
    try { await navigator.clipboard.writeText(reg); setCopied(true); } catch { /* ignore */ }
  };
  return (
    <section className="card center" role="status">
      <h1 ref={h} tabIndex={-1}>விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது</h1>
      <p>உங்கள் பதிவு எண்:</p>
      <div className="regno">{reg}</div>
      <p>இந்த எண்ணைக் குறித்து வைத்துக்கொள்ளவும் அல்லது ஸ்கிரீன்ஷாட் எடுத்துக்கொள்ளவும். சங்கத்தைத் தொடர்பு கொள்ளும்போது இந்த எண் அவசியம்.</p>
      <div className="row no-print" style={{ justifyContent: 'center' }}>
        <button type="button" className="btn secondary" onClick={copy}>{copied ? 'நகலெடுக்கப்பட்டது ✓' : 'எண்ணை நகலெடு'}</button>
        <button type="button" className="btn secondary" onClick={() => window.print()}>அச்சிடு</button>
        <Link to="/" className="btn">முகப்புக்குச் செல்</Link>
      </div>
    </section>
  );
}

export default function Apply() {
  const [step, setStep] = useState('gate');
  const [reg, setReg] = useState('');
  const head = useRef(null);

  useEffect(() => {
    if (step === 'form') { window.scrollTo(0, 0); head.current?.focus(); }
  }, [step]);

  async function submit(values) {
    const r = await api.post('applications', { ...values, terms_accepted: true });
    try { sessionStorage.removeItem(DRAFT); } catch { /* ignore */ }
    setReg(r.reg_no);
    setStep('done');
  }

  return (
    <PublicShell showLang={false}>
      <div lang="ta">
        {step === 'gate' && <Gate onAccept={() => setStep('form')} />}
        {step === 'form' && (
          <>
            <p><Link to="/" className="btn secondary small">← முகப்பு</Link></p>
            <h1 ref={head} tabIndex={-1}>விண்ணப்பப் படிவம்</h1>
            <p className="hint">* குறியிட்ட விவரங்கள் அவசியம். கட்டணம் செலுத்திய பின் மட்டுமே சமர்ப்பிக்கவும்.</p>
            <ApplicationForm
              initial={EMPTY}
              lang="ta"
              draftKey={DRAFT}
              onSubmit={submit}
              submitLabel="விண்ணப்பத்தை சமர்ப்பிக்கவும்"
              busyLabel="சமர்ப்பிக்கிறது…"
            />
            <p><Link to="/" className="btn secondary block">முகப்பு</Link></p>
          </>
        )}
        {step === 'done' && <Done reg={reg} />}
      </div>
    </PublicShell>
  );
}
