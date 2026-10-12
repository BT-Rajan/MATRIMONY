import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ApplicationForm from './ApplicationForm';
import { TERMS_TA } from '../content/terms';
import { EMPTY } from '../fields';
import { api } from '../api';

const DRAFT = 'kks_draft';

// Terms -> application form -> registration number, all inside the Mangala Santhippu page (#apply).
// Form logic is unchanged from the former /apply.html page; the form itself is Tamil only.
export default function ApplySection() {
  const [step, setStep] = useState('gate');
  const [reg, setReg] = useState('');
  const [copied, setCopied] = useState(false);
  const root = useRef(null);
  const head = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    root.current?.scrollIntoView({ behavior: 'auto', block: 'start' });
    head.current?.focus({ preventScroll: true });
  }, [step]);

  async function submit(values) {
    const r = await api.post('applications', { ...values, terms_accepted: true });
    try { sessionStorage.removeItem(DRAFT); } catch { /* ignore */ }
    setReg(r.reg_no);
    setStep('done');
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(reg); setCopied(true); } catch { /* ignore */ }
  };

  return (
    <section id="apply" ref={root} className="apply-sec" lang="ta" aria-labelledby="apply-h">
      {step === 'gate' && (
        <>
          <h2 id="apply-h" ref={head} tabIndex={-1}>மங்கல சந்திப்பு விண்ணப்பம்</h2>
          <div className="card" aria-labelledby="tt">
            <h3 id="tt">விதிமுறைகள் மற்றும் நிபந்தனைகள்</h3>
            <ol className="terms-list">{TERMS_TA.map((x, i) => <li key={i}>{x}</li>)}</ol>
            <button type="button" className="btn block" onClick={() => setStep('form')}>படித்தேன், தொடரவும்</button>
          </div>
        </>
      )}
      {step === 'form' && (
        <>
          <h2 id="apply-h" ref={head} tabIndex={-1}>விண்ணப்பப் படிவம்</h2>
          <p className="hint">* குறியிட்ட விவரங்கள் அவசியம். கட்டணம் செலுத்திய பின் மட்டுமே சமர்ப்பிக்கவும்.</p>
          <ApplicationForm
            initial={EMPTY}
            lang="ta"
            draftKey={DRAFT}
            onSubmit={submit}
            submitLabel="விண்ணப்பத்தை சமர்ப்பிக்கவும்"
            busyLabel="சமர்ப்பிக்கிறது…"
          />
        </>
      )}
      {step === 'done' && (
        <div className="card center" role="status">
          <h2 id="apply-h" ref={head} tabIndex={-1}>விண்ணப்பம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது</h2>
          <p>உங்கள் பதிவு எண்:</p>
          <div className="regno">{reg}</div>
          <p>இந்த எண்ணைக் குறித்து வைத்துக்கொள்ளவும் அல்லது ஸ்கிரீன்ஷாட் எடுத்துக்கொள்ளவும். சங்கத்தைத் தொடர்பு கொள்ளும்போது இந்த எண் அவசியம்.</p>
          <div className="row no-print" style={{ justifyContent: 'center' }}>
            <button type="button" className="btn secondary" onClick={copy}>{copied ? 'நகலெடுக்கப்பட்டது ✓' : 'எண்ணை நகலெடு'}</button>
            <button type="button" className="btn secondary" onClick={() => window.print()}>அச்சிடு</button>
            <Link to="/" className="btn">முகப்புக்குச் செல்</Link>
          </div>
        </div>
      )}
    </section>
  );
}
