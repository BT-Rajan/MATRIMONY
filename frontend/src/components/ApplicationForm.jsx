import { useEffect, useRef, useState } from 'react';
import { ALL_FIELDS, GROUPS, ageYears, maskDMY, validate } from '../fields';
import { STRINGS } from '../strings';

function loadDraft(key, initial) {
  if (!key) return initial;
  try {
    const d = JSON.parse(sessionStorage.getItem(key) || 'null');
    return d && typeof d === 'object' ? { ...initial, ...d } : initial;
  } catch { return initial; }
}

export default function ApplicationForm({ initial, lang, submitLabel, busyLabel, onSubmit, draftKey }) {
  const S = STRINGS[lang];
  const [v, setV] = useState(() => loadDraft(draftKey, initial));
  const [errs, setErrs] = useState({});
  const [top, setTop] = useState('');
  const [busy, setBusy] = useState(false);
  const [hp, setHp] = useState('');
  const topRef = useRef(null);

  useEffect(() => {
    if (!draftKey) return;
    try { sessionStorage.setItem(draftKey, JSON.stringify(v)); } catch { /* ignore */ }
  }, [v, draftKey]);

  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));

  function showErrors(e, message) {
    setErrs(e);
    setTop(message);
    const first = ALL_FIELDS.find((f) => e[f.k]);
    requestAnimationFrame(() => (first ? document.getElementById(first.k) : topRef.current)?.focus());
  }

  async function submit(ev) {
    ev.preventDefault();
    const ce = validate(v);
    if (Object.keys(ce).length) return showErrors(ce, S.f_summary);
    setErrs({});
    setTop('');
    setBusy(true);
    try {
      await onSubmit({ ...v, website: hp });
    } catch (err) {
      const fe = err.errors || {};
      if (Object.keys(fe).length) showErrors(fe, S.f_summary);
      else showErrors({}, S['e_' + err.code] || S.e_server);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate lang={lang}>
      <div ref={topRef} tabIndex={-1} role="alert" aria-live="assertive">
        {top && <div className="alert bad">{top}</div>}
      </div>

      {GROUPS.map((g) => (
        <fieldset key={g.id}>
          <legend>{g[lang]}</legend>
          <div className="grid">
            {g.fields.map((f) => {
              const err = errs[f.k];
              const common = {
                id: f.k, name: f.k, value: v[f.k], 'aria-required': f.req ? 'true' : undefined,
                'aria-invalid': err ? 'true' : undefined, 'aria-describedby': err ? `${f.k}-err` : undefined,
                onChange: (e) => set(f.k, e.target.value), autoComplete: f.auto || 'off',
              };
              let control;
              if (f.type === 'select') {
                control = (
                  <select {...common}>
                    <option value="">—</option>
                    {f.options.map((o) => <option key={o.v} value={o.v}>{o[lang]}</option>)}
                  </select>
                );
              } else if (f.type === 'textarea') {
                control = <textarea {...common} rows={3} maxLength={f.max} />;
              } else if (f.dateField) {
                control = (
                  <input
                    {...common}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={10}
                    placeholder="DD-MM-YYYY"
                    onChange={(e) => set(f.k, maskDMY(e.target.value))}
                  />
                );
              } else {
                control = (
                  <input
                    {...common}
                    type={f.type === 'tel' || f.type === 'email' ? f.type : 'text'}
                    maxLength={f.max}
                    inputMode={f.type === 'tel' ? 'tel' : undefined}
                    placeholder={f.ph}
                  />
                );
              }
              const age = f.k === 'dob' ? ageYears(v.dob) : null;
              return (
                <div className={`field${f.full ? ' full' : ''}`} key={f.k}>
                  <label htmlFor={f.k}>{f[lang]}{f.req ? <span aria-hidden="true"> *</span> : null}</label>
                  {control}
                  {err && <p className="err" id={`${f.k}-err`}>{S['e_' + err] || S.e_invalid}</p>}
                  {!err && age !== null && age < 21 && <p className="hint warn">{S.w_age_18_21}</p>}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="hp" aria-hidden="true">
        <label>Website<input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} /></label>
      </div>

      <button type="submit" className="btn block" disabled={busy}>{busy ? busyLabel : submitLabel}</button>
    </form>
  );
}
