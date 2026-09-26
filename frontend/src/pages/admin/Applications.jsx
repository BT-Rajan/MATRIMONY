import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useI18n } from '../../i18n';
import StatusBadge from '../../components/StatusBadge';
import { fmtDateTime } from '../../date';

export default function Applications() {
  const { t } = useI18n();
  const [sp, setSp] = useSearchParams();
  const status = sp.get('status') || '';
  const q = sp.get('q') || '';
  const page = Math.max(1, Number(sp.get('page')) || 1);
  const [qi, setQi] = useState(q);
  const [si, setSi] = useState(status);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setData(null);
    setErr('');
    const qs = new URLSearchParams({ status, q, page: String(page) }).toString();
    api.get(`applications?${qs}`).then(setData).catch((e) => setErr(e.code));
  }, [status, q, page]);

  useEffect(() => { setQi(q); setSi(status); }, [q, status]);

  const go = (next) => {
    const p = {};
    for (const [k, v] of Object.entries(next)) if (v && v !== '1') p[k] = v;
    setSp(p);
  };
  const search = (e) => { e.preventDefault(); go({ status: si, q: qi.trim(), page: '1' }); };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.per)) : 1;

  return (
    <>
      <h1>{t('nav_apps')}</h1>
      <form className="toolbar" onSubmit={search} role="search">
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
                <th scope="col">{t('a_reg')}</th><th scope="col">{t('a_name')}</th><th scope="col">{t('a_phone')}</th>
                <th scope="col">{t('a_date')}</th><th scope="col">{t('a_status')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a.id}>
                  <td data-label={t('a_reg')}><Link to={`/admin/applications/${a.id}`}>{a.reg_no}</Link></td>
                  <td data-label={t('a_name')}>{a.full_name}</td>
                  <td data-label={t('a_phone')}>{a.phone}</td>
                  <td data-label={t('a_date')}>{fmtDateTime(a.created_at)}</td>
                  <td data-label={t('a_status')}><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <nav className="pager" aria-label="Pagination">
            <button type="button" className="btn secondary small" disabled={page <= 1} onClick={() => go({ status, q, page: String(page - 1) })}>{t('prev')}</button>
            <span>{t('page_of', { p: page, n: pages })}</span>
            <button type="button" className="btn secondary small" disabled={page >= pages} onClick={() => go({ status, q, page: String(page + 1) })}>{t('next')}</button>
          </nav>
        </>
      ))}
    </>
  );
}
