import PublicShell from '../components/PublicShell';
import { SITE } from '../config';

export default function PaymentInfo() {
  return (
    <PublicShell showLang={false}>
      <div lang="ta">
        <h1>பணம் செலுத்துதல்</h1>
        <div className="bank">
          <p><strong>பதிவு கட்டணம்:</strong> ரூ. {SITE.fee}/-</p>
          <p>இந்தியன் வங்கி, கணக்கு எண்: <strong>{SITE.bank.account}</strong>, சிட்லபாக்கம் கிளை.</p>
        </div>
        <p className="hint">
          மேற்கண்ட கணக்கிற்கு NEFT / IMPS / UPI மூலம் பணம் செலுத்திய பின், இந்தப் பக்கத்தை மூடிவிட்டு
          விண்ணப்பப் படிவம் இருந்த தாவலுக்குத் திரும்பி, பரிவர்த்தனை விவரங்களை (எண், தேதி, நேரம், தொகை, வங்கி) நிரப்பவும்.
        </p>
        <div className="row no-print">
          <button type="button" className="btn secondary" onClick={() => window.print()}>அச்சிடு</button>
          <button type="button" className="btn" onClick={() => window.close()}>இந்தப் பக்கத்தை மூடு</button>
        </div>
      </div>
    </PublicShell>
  );
}
