import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { useI18n } from '../../i18n';

const QR_MAX_BYTES = 2 * 1024 * 1024;
const BLANK = { event_date: '', venue_ta: '', venue_en: '', bank_name: '', bank_account: '', bank_ifsc: '', qr_code: '' };

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });
}

export default function Settings() {
  const { t } = useI18n();
  const { user: me } = useAuth();
  const [form, setForm] = useState(null);
  const [errs, setErrs] = useState({});
  const [top, setTop] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api.get('settings').then((s) => setForm({ ...BLANK, ...s, qr_code: s.qr_code || '' })).catch((e) => setTop(e.code));
  }, []);

  if (me.role !== 'admin') return <Navigate to="/admin.html" replace />;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrs((x) => ({ ...x, qr_code: undefined }));
    if (file.size > QR_MAX_BYTES) {
      setErrs((x) => ({ ...x, qr_code: 'too_large' }));
      e.target.value = '';
      return;
    }
    try {
      set('qr_code', await readAsDataUrl(file));
    } catch {
      setErrs((x) => ({ ...x, qr_code: 'invalid' }));
    }
  }

  function removeQr() {
    set('qr_code', '');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit(e) {
    e.preventDefault();
    setErrs({});
    setTop('');
    setMsg('');
    setBusy(true);
    try {
      const saved = await api.put('settings', form);
      setForm({ ...BLANK, ...saved, qr_code: saved.qr_code || '' });
      setMsg(t('s_saved'));
    } catch (x) {
      if (x.errors && Object.keys(x.errors).length) setErrs(x.errors);
      else setTop(x.code);
    } finally {
      setBusy(false);
    }
  }

  if (!form) return <p role="status">{top ? t('e_' + top) : t('loading')}</p>;

  const fe = (k) => errs[k] && <p className="err" id={`${k}-err`}>{t('e_' + errs[k]) || t('e_invalid')}</p>;
  const ia = (k) => ({ 'aria-invalid': errs[k] ? 'true' : undefined, 'aria-describedby': errs[k] ? `${k}-err` : undefined });

  return (
    <>
      <h1>{t('settings_title')}</h1>
      <div role="alert">
        {top && <div className="alert bad">{t('e_' + top)}</div>}
        {msg && <div className="alert good">{msg}</div>}
      </div>

      <form onSubmit={submit} noValidate>
        <fieldset>
          <legend>{t('s_event')}</legend>
          <div className="grid">
            <div className="field">
              <label htmlFor="event_date">{t('s_event_date')}</label>
              <input id="event_date" type="text" maxLength={60} value={form.event_date} placeholder={t('s_event_date_ph')}
                onChange={(e) => set('event_date', e.target.value)} {...ia('event_date')} />
              {fe('event_date')}
            </div>
            <div className="field full">
              <label htmlFor="venue_ta">{t('s_venue_ta')}</label>
              <input id="venue_ta" type="text" maxLength={255} value={form.venue_ta}
                onChange={(e) => set('venue_ta', e.target.value)} {...ia('venue_ta')} />
              {fe('venue_ta')}
            </div>
            <div className="field full">
              <label htmlFor="venue_en">{t('s_venue_en')}</label>
              <input id="venue_en" type="text" maxLength={255} value={form.venue_en}
                onChange={(e) => set('venue_en', e.target.value)} {...ia('venue_en')} />
              {fe('venue_en')}
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>{t('s_payment')}</legend>
          <div className="grid">
            <div className="field full">
              <label htmlFor="bank_name">{t('s_bank_name')}</label>
              <input id="bank_name" type="text" maxLength={150} value={form.bank_name}
                onChange={(e) => set('bank_name', e.target.value)} {...ia('bank_name')} />
              {fe('bank_name')}
            </div>
            <div className="field">
              <label htmlFor="bank_account">{t('s_bank_account')}</label>
              <input id="bank_account" type="text" maxLength={40} value={form.bank_account}
                onChange={(e) => set('bank_account', e.target.value)} {...ia('bank_account')} />
              {fe('bank_account')}
            </div>
            <div className="field">
              <label htmlFor="bank_ifsc">{t('s_bank_ifsc')}</label>
              <input id="bank_ifsc" type="text" maxLength={20} value={form.bank_ifsc} placeholder="e.g. IDIB000S123"
                onChange={(e) => set('bank_ifsc', e.target.value.toUpperCase())} {...ia('bank_ifsc')} />
              {fe('bank_ifsc')}
            </div>
            <div className="field full">
              <label htmlFor="qr_file">{t('s_qr')}</label>
              {form.qr_code && (
                <p>
                  <img src={form.qr_code} alt={t('s_qr_current')} style={{ maxWidth: 160, borderRadius: 8, border: '1px solid var(--line)' }} />
                </p>
              )}
              <input id="qr_file" ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} {...ia('qr_code')} />
              <p className="hint">{t('s_qr_hint')}</p>
              {fe('qr_code')}
              {form.qr_code && <button type="button" className="btn secondary small" onClick={removeQr}>{t('s_qr_remove')}</button>}
            </div>
          </div>
        </fieldset>

        <button type="submit" className="btn" disabled={busy}>{busy ? t('loading') : t('save')}</button>
      </form>
    </>
  );
}
