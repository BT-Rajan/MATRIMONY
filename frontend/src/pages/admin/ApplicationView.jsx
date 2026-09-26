import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useI18n } from '../../i18n';
import { ALL_FIELDS, GENDERS, GROUPS, fromRecord } from '../../fields';
import ApplicationForm from '../../components/ApplicationForm';
import StatusBadge from '../../components/StatusBadge';
import { fmtDate, fmtDateTime } from '../../date';

export default function ApplicationView() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const [a, setA] = useState(null);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState('');
  const [note, setNote] = useState('');
  const [dErr, setDErr] = useState('');
  const [busy, setBusy] = useState(false);
  const noteRef = useRef(null);

  const load = useCallback(() => api.get(`applications/${id}`).then(setA).catch((e) => setErr(e.code)), [id]);
  useEffect(() => { load(); }, [load]);

  if (err) return <div className="alert bad" role="alert">{t('e_' + err)}</div>;
  if (!a) return <p role="status">{t('loading')}</p>;

  const show = (f) => {
    const val = a[f.k];
    if (val === null || val === '') return '—';
    if (f.k === 'gender') return GENDERS.find((g) => g.v === val)?.[lang] ?? val;
    if (f.dateField) return fmtDate(val);
    return val;
  };

  async function save(values) {
    await api.put(`applications/${id}`, values);
    await load();
    setEditing(false);
    setMsg(t('v_saved'));
  }

  async function decide(to) {
    setDErr('');
    setMsg('');
    if (to === 'rejected' && note.trim().length < 3) {
      setDErr(t('e_required'));
      noteRef.current?.focus();
      return;
    }
    if (!window.confirm(`${t('v_confirm')} (${t('st_' + to)})`)) return;
    setBusy(true);
    try {
      await api.post(`applications/${id}/decision`, { status: to, note });
      setNote('');
      await load();
    } catch (e) {
      setDErr(t('e_' + e.code));
      if (e.code === 'conflict' || e.code === 'locked') load();
    } finally {
      setBusy(false);
    }
  }

  const targets = a.can_reset ? ['accepted', 'rejected', 'pending'].filter((s) => s !== a.status) : a.status === 'pending' ? ['accepted', 'rejected'] : [];
  const fieldLabel = (k) => ALL_FIELDS.find((f) => f.k === k)?.[lang] ?? k;
  const histText = (h) => {
    if (h.action === 'created') return t('h_created');
    if (h.action === 'edited') return `${t('h_edited')}: ${(h.note || '').split(',').map(fieldLabel).join(', ')}`;
    return `${t('h_decision')}: ${t('st_' + h.from_status)} → ${t('st_' + h.to_status)}${h.note ? ` — ${h.note}` : ''}`;
  };

  return (
    <>
      <p><Link to="/admin/applications">← {t('nav_apps')}</Link></p>
      <h1>{a.reg_no} <StatusBadge status={a.status} /></h1>
      {msg && <div className="alert good" role="status">{msg}</div>}

      <section className="card no-print" aria-labelledby="dec">
        <h2 id="dec">{t('v_decision')}</h2>
        {a.status !== 'pending' && (
          <p>
            <StatusBadge status={a.status} /> {a.decided_by_name && <>{t('v_decided_by')}: <strong>{a.decided_by_name}</strong>, {fmtDateTime(a.decided_at)}</>}
            {a.decision_note && <><br />{t('v_note')}: {a.decision_note}</>}
          </p>
        )}
        {targets.length === 0 ? <p className="alert info">{t('v_locked')}</p> : (
          <>
            <div className="field" style={{ marginBottom: 12 }}>
              <label htmlFor="note">{t('v_note')}</label>
              <textarea id="note" ref={noteRef} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} aria-invalid={dErr ? 'true' : undefined} aria-describedby="nh" />
              <p className="hint" id="nh">{t('v_note_hint')}</p>
            </div>
            <div role="alert">{dErr && <div className="alert bad">{dErr}</div>}</div>
            <div className="row">
              {targets.includes('accepted') && <button type="button" className="btn ok" disabled={busy} onClick={() => decide('accepted')}>{t('v_accept')}</button>}
              {targets.includes('rejected') && <button type="button" className="btn bad" disabled={busy} onClick={() => decide('rejected')}>{t('v_reject')}</button>}
              {targets.includes('pending') && <button type="button" className="btn secondary" disabled={busy} onClick={() => decide('pending')}>{t('v_reset')}</button>}
            </div>
          </>
        )}
      </section>

      {editing ? (
        <section className="card" aria-labelledby="ed">
          <h2 id="ed">{t('v_edit')}</h2>
          <ApplicationForm initial={fromRecord(a)} lang={lang} onSubmit={save} submitLabel={t('save')} busyLabel={t('loading')} />
          <button type="button" className="btn secondary block" style={{ marginTop: 10 }} onClick={() => setEditing(false)}>{t('cancel')}</button>
        </section>
      ) : (
        <>
          {a.can_edit && <div className="no-print" style={{ marginBottom: 8 }}><button type="button" className="btn secondary" onClick={() => { setMsg(''); setEditing(true); }}>{t('v_edit')}</button></div>}
          {GROUPS.map((g) => (
            <section className="card" key={g.id}>
              <h2>{g[lang]}</h2>
              <dl className="dl">
                {g.fields.map((f) => (
                  <div key={f.k} className={f.full ? 'full' : undefined}><dt>{f[lang]}</dt><dd>{show(f)}</dd></div>
                ))}
              </dl>
            </section>
          ))}
          <section className="card">
            <dl className="dl">
              <div><dt>{t('v_regno')}</dt><dd>{a.reg_no}</dd></div>
              <div><dt>{t('v_paid')}</dt><dd>Rs. {Number(a.payment_amount)}</dd></div>
              <div><dt>{t('v_submitted')}</dt><dd>{fmtDateTime(a.created_at)}</dd></div>
              <div><dt>{t('v_terms')}</dt><dd>{fmtDateTime(a.terms_accepted_at)}</dd></div>
            </dl>
          </section>
        </>
      )}

      <section className="card" aria-labelledby="hist">
        <h2 id="hist">{t('v_history')}</h2>
        <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
          {a.history.map((h, i) => (
            <li key={i}><small>{fmtDateTime(h.created_at)}</small> — <strong>{h.user_name || t('v_system')}</strong>: {histText(h)}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
