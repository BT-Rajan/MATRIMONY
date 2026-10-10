import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api';
import { useI18n } from '../../i18n';
import { useAuth } from '../../auth';
import { ALL_FIELDS, GENDERS, GROUPS, MARITAL_STATUS, fromRecord } from '../../fields';
import ApplicationForm from '../../components/ApplicationForm';
import StatusBadge from '../../components/StatusBadge';
import { fmtDate, fmtDateTime } from '../../date';

export default function ApplicationView() {
  const { id } = useParams();
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const [a, setA] = useState(null);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState('');
  const [note, setNote] = useState('');
  const [dErr, setDErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [managers, setManagers] = useState(null);
  const [pick, setPick] = useState('');
  const [aErr, setAErr] = useState('');
  const noteRef = useRef(null);

  const load = useCallback(() => api.get(`applications/${id}`).then(setA).catch((e) => setErr(e.code)), [id]);
  useEffect(() => { load(); }, [load]);
  const canAssign = !!a?.can_assign;
  useEffect(() => {
    if (!canAssign) return;
    api.get('assignments').then((r) => setManagers(r.managers)).catch(() => setManagers([]));
  }, [canAssign, a?.assigned_to]);

  if (err) return <div className="alert bad" role="alert">{t('e_' + err)}</div>;
  if (!a) return <p role="status">{t('loading')}</p>;

  const fmt = (f, val) => {
    if (val === null || val === undefined || val === '') return '—';
    if (f.k === 'gender') return GENDERS.find((g) => g.v === val)?.[lang] ?? val;
    if (f.k === 'marital_status') return MARITAL_STATUS.find((m) => m.v === val)?.[lang] ?? val;
    if (f.k === 'payment_amount') return `Rs. ${Number(val)}`;
    if (f.dateField) return fmtDate(val);
    return val;
  };
  const show = (f) => fmt(f, a[f.k]);

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

  async function assign(managerId) {
    setAErr('');
    setMsg('');
    setBusy(true);
    try {
      await api.post(`applications/${id}/assign`, { manager_id: managerId });
      setPick('');
      await load();
    } catch (e) {
      setAErr(t('e_' + e.code));
      if (e.code === 'conflict' || e.code === 'not_pending') load();
    } finally {
      setBusy(false);
    }
  }

  const targets = a.can_reset
    ? ['accepted', 'rejected', 'pending'].filter((s) => s !== a.status)
    : a.can_decide && a.status === 'pending' ? ['accepted', 'rejected'] : [];
  const fieldLabel = (k) => ALL_FIELDS.find((f) => f.k === k)?.[lang] ?? k;
  const fieldByKey = (k) => ALL_FIELDS.find((f) => f.k === k);
  const histText = (h) => {
    if (h.action === 'created') return t('h_created');
    if (h.action === 'edited') return `${t('h_edited')}: ${(h.note || '').split(',').map(fieldLabel).join(', ')}`;
    if (h.action === 'assigned') return `${t('h_assigned')}: ${h.note || ''}`;
    if (h.action === 'unassigned') return `${t('h_unassigned')}: ${h.note || ''}`;
    return `${t('h_decision')}: ${t('st_' + h.from_status)} → ${t('st_' + h.to_status)}${h.note ? ` — ${h.note}` : ''}`;
  };

  return (
    <>
      <p><Link to="/admin.html/applications">← {t('nav_apps')}</Link></p>
      <h1>{a.reg_no} <StatusBadge status={a.status} /></h1>
      {msg && <div className="alert good" role="status">{msg}</div>}

      <section className="card no-print" aria-labelledby="asn">
        <h2 id="asn">{t('v_assignment')}</h2>
        <p>
          {t('v_assigned_to')}: <strong>{a.assigned_to_name || t('v_unassigned')}</strong>
          {a.assigned_to_name && a.assigned_by_name && <> · {t('v_assigned_by')}: {a.assigned_by_name}, {fmtDateTime(a.assigned_at)}</>}
          {a.assigned_to === user?.id && a.status === 'pending' && user.role !== 'admin' && <> <span className="badge pending">{t('a_mine')}</span></>}
        </p>
        {a.can_assign && (
          <>
            <div className="row" style={{ alignItems: 'end' }}>
              <div className="field">
                <label htmlFor="mgr">{t('asg_manager')}</label>
                <select id="mgr" value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">{t('asg_choose')}</option>
                  {(managers || []).filter((m) => m.id !== a.assigned_to).map((m) => <option key={m.id} value={m.id}>{m.name} ({t('asg_load', { n: String(m.pending) })})</option>)}
                </select>
              </div>
              <button type="button" className="btn" disabled={busy || !pick} onClick={() => assign(Number(pick))}>{a.assigned_to ? t('v_reassign') : t('v_assign')}</button>
              {a.assigned_to && <button type="button" className="btn secondary" disabled={busy} onClick={() => assign(null)}>{t('v_unassign')}</button>}
            </div>
            <div role="alert">{aErr && <div className="alert bad">{aErr}</div>}</div>
          </>
        )}
      </section>

      <section className="card no-print" aria-labelledby="dec">
        <h2 id="dec">{t('v_decision')}</h2>
        {a.status !== 'pending' && (
          <p>
            <StatusBadge status={a.status} /> {a.decided_by_name && <>{t('v_decided_by')}: <strong>{a.decided_by_name}</strong>, {fmtDateTime(a.decided_at)}</>}
            {a.decision_note && <><br />{t('v_note')}: {a.decision_note}</>}
          </p>
        )}
        {targets.length === 0 ? (
          <p className="alert info">
            {a.status !== 'pending' ? t('v_locked')
              : a.assigned_to_name ? t('v_only_assignee', { name: a.assigned_to_name }) : t('v_unassigned_info')}
          </p>
        ) : (
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
            <li key={h.id ?? i} style={{ marginBottom: 8 }}>
              <small>{fmtDateTime(h.created_at)}</small> — <strong>{h.user_name || t('v_system')}</strong>: {histText(h)}
              {h.changes && (
                <details style={{ marginTop: 4 }}>
                  <summary>{t('h_details')}</summary>
                  <table className="tbl" style={{ marginTop: 6 }}>
                    <thead><tr><th scope="col">{t('h_field')}</th><th scope="col">{t('h_before')}</th><th scope="col">{t('h_after')}</th></tr></thead>
                    <tbody>
                      {Object.entries(h.changes).map(([k, [from, to]]) => {
                        const f = fieldByKey(k) || { k };
                        return (
                          <tr key={k}>
                            <td data-label={t('h_field')}>{fieldLabel(k)}</td>
                            <td data-label={t('h_before')}>{fmt(f, from)}</td>
                            <td data-label={t('h_after')}>{fmt(f, to)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </details>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
