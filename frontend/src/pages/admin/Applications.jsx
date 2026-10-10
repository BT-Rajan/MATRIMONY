import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useI18n } from '../../i18n';
import { useAuth } from '../../auth';
import BulkAssign from '../../components/BulkAssign';
import StatusBadge from '../../components/StatusBadge';
import { fmtDateTime } from '../../date';

export default function Applications() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const status = sp.get('status') || '';
  const gender = sp.get('gender') || '';
  const assigned = sp.get('assigned') || '';
  const q = sp.get('q') || '';
  const page = Math.max(1, Number(sp.get('page')) || 1);
  const [qi, setQi] = useState(q);
  const [si, setSi] = useState(status);
  const [gi, setGi] = useState(gender);
  const [ai, setAi] = useState(assigned);
  const [tick, setTick] = useState(0);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setData(null);
    setErr('');
    const qs = new URLSearchParams({ status, gender, assigned, q, page: String(page) }).toString();
    api.get(`applications?${qs}`).then(setData).catch((e) => setErr(e.code));
  }, [status, gender, assigned, q, page, tick]);

  useEffect(() => { setQi(q); setSi(status); setGi(gender); setAi(assigned); }, [q, status, gender, assigned]);

  const go = (next) => {
    const p = {};
    for (const [k, v] of Object.entries(next)) if (v && v !== '1') p[k] = v;
    setSp(p);
  };
  const search = (e) => { e.preventDefault(); go({ status: si, gender: gi, assigned: ai, q: qi.trim(), page: '1' }); };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.per)) : 1;

  return (
    <>
      <h1>{t('nav_apps')}</h1>
      {user?.role === 'admin' && <BulkAssign onDone={() => setTick((n) => n + 1)} />}
      <form className="toolbar wide" onSubmit={search} role="search">
        <div className="field">
          <label htmlFor="q">{t('search')}</label>
          <input id="q" type="text" value={qi} onChange={(e) => setQi(e.target.value)} placeholder={t('a_search_ph')} maxLength={60} />
        </div>
        <div className="field">
          <label htmlFor="st">{t('a_status')}</label>
          <select id="st" value={si} onChange={(e) => setSi(e.target.value)}>
            <option value="">{t('all')}</option>
            {['pending', 'accepted', 'rejected'].map((s) => <option key={s} value={s}>{t('st_' + s)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="gd">{t('a_gender')}</label>
          <select id="gd" value={gi} onChange={(e) => setGi(e.target.value)}>
            <option value="">{t('all')}</option>
            <option value="male">{t('d_male')}</option>
            <option value="female">{t('d_female')}</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="as">{t('a_assign_filter')}</label>
          <select id="as" value={ai} onChange={(e) => setAi(e.target.value)}>
            <option value="">{t('all')}</option>
            <option value="me">{t('a_mine')}</option>
            <option value="unassigned">{t('a_unassigned')}</option>
          </select>
        </div>
        <button className="btn" type="submit">{t('search')}</button>
      </form>

      {err && <div className="alert bad" role="alert">{t('e_' + err)}</div>}
      {!data && !err && <p role="status">{t('loading')}</p>}
      {data && (data.items.length === 0 ? <p>{t('a_none')}</p> : (
        <>
          <p className="hint">{t('a_total', { n: data.total })}</p>
          <table className="tbl">
            <thead>
              <tr>
                <th scope="col">{t('a_reg')}</th><th scope="col">{t('a_name')}</th><th scope="col">{t('a_gender')}</th><th scope="col">{t('a_phone')}</th>
                <th scope="col">{t('a_date')}</th><th scope="col">{t('a_status')}</th><th scope="col">{t('a_assignee')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a.id}>
                  <td data-label={t('a_reg')}><Link to={`/admin.html/applications/${a.id}`}>{a.reg_no}</Link></td>
                  <td data-label={t('a_name')}>{a.full_name}</td>
                  <td data-label={t('a_gender')}>{a.gender === 'male' ? t('d_male') : t('d_female')}</td>
                  <td data-label={t('a_phone')}>{a.phone}</td>
                  <td data-label={t('a_date')}>{fmtDateTime(a.created_at)}</td>
                  <td data-label={t('a_status')}><StatusBadge status={a.status} /></td>
                  <td data-label={t('a_assignee')}>{a.assigned_to_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <nav className="pager" aria-label="Pagination">
            <button type="button" className="btn secondary small" disabled={page <= 1} onClick={() => go({ status, gender, assigned, q, page: String(page - 1) })}>{t('prev')}</button>
            <span>{t('page_of', { p: page, n: pages })}</span>
            <button type="button" className="btn secondary small" disabled={page >= pages} onClick={() => go({ status, gender, assigned, q, page: String(page + 1) })}>{t('next')}</button>
          </nav>
        </>
      ))}
    </>
  );
}
