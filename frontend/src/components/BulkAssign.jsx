import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useI18n } from '../i18n';

// Admin-only panel: hand the N oldest unassigned pending applications to one manager.
export default function BulkAssign({ onDone }) {
  const { t } = useI18n();
  const [sum, setSum] = useState(null);
  const [mid, setMid] = useState('');
  const [count, setCount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = useCallback(() => api.get('assignments').then(setSum).catch(() => setSum({ unassigned: 0, managers: [] })), []);
  useEffect(() => { load(); }, [load]);

  if (!sum) return null;
  const n = Number(count);
  const valid = mid !== '' && Number.isInteger(n) && n >= 1;

  async function submit(e) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setMsg(null);
    const name = sum.managers.find((m) => String(m.id) === mid)?.name ?? '';
    try {
      const r = await api.post('applications/assign', { manager_id: Number(mid), count: n });
      setMsg({ cls: 'good', text: t(r.assigned < r.requested ? 'asg_partial' : 'asg_done', { n: String(r.assigned), name }) });
      setCount('');
      await load();
      onDone?.();
    } catch (er) {
      setMsg({ cls: 'bad', text: t('e_' + er.code) });
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card no-print" aria-labelledby="asg">
      <h2 id="asg">{t('asg_title')}</h2>
      <p className="hint">{t('asg_available', { n: String(sum.unassigned) })} — {t('asg_hint')}</p>
      <form className="toolbar" style={{ gridTemplateColumns: undefined }} onSubmit={submit}>
        <div className="field">
          <label htmlFor="asg-m">{t('asg_manager')}</label>
          <select id="asg-m" value={mid} onChange={(e) => setMid(e.target.value)}>
            <option value="">{t('asg_choose')}</option>
            {sum.managers.map((m) => <option key={m.id} value={m.id}>{m.name} ({t('asg_load', { n: String(m.pending) })})</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="asg-n">{t('asg_count')}</label>
          <input id="asg-n" type="number" inputMode="numeric" min="1" max={Math.max(1, sum.unassigned)} value={count} onChange={(e) => setCount(e.target.value)} />
        </div>
        <button className="btn" type="submit" disabled={busy || !valid || sum.unassigned === 0}>{t('asg_go')}</button>
      </form>
      <div role="status">{msg && <div className={`alert ${msg.cls}`}>{msg.text}</div>}</div>
    </section>
  );
}
