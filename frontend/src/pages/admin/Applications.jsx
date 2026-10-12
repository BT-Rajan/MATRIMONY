import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useI18n } from '../../i18n';
import { useAuth } from '../../auth';
import BulkAssign from '../../components/BulkAssign';
import StatusBadge from '../../components/StatusBadge';
import { fmtDateTime } from '../../date';

const SORTS = ['created_at', 'reg_no', 'name', 'status'];

function Chip({ active, label, count, onClick }) {
  return (
    <button type="button" className={`chip${active ? ' on' : ''}`} aria-pressed={active} onClick={onClick}>
      {label} <span className="chip-n">{count ?? '–'}</span>
    </button>
  );
}

export default function Applications() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const status = sp.get('status') || '';
  const gender = sp.get('gender') || '';
  const assigned = sp.get('assigned') || '';
  const q = sp.get('q') || '';
  const sort = SORTS.includes(sp.get('sort')) ? sp.get('sort') : 'created_at';
  const dir = sp.get('dir') === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, Number(sp.get('page')) || 1);

  const [qi, setQi] = useState(q);
  const [gi, setGi] = useState(gender);
  const [si, setSi] = useState(sort);
  const [di, setDi] = useState(dir);
  const [tick, setTick] = useState(0);
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setData(null);
    setErr('');
    const qs = new URLSearchParams({ status, gender, assigned, q, sort, dir, page: String(page) }).toString();
    api.get(`applications?${qs}`).then(setData).catch((e) => setErr(e.code));
  }, [status, gender, assigned, q, sort, dir, page, tick]);

  useEffect(() => {
    api.get('stats').then(setStats).catch(() => setStats(null));
  }, [tick]);

  useEffect(() => { setQi(q); setGi(gender); setSi(sort); setDi(dir); }, [q, gender, sort, dir]);

  // Only non-default values go in the URL, so a clean list has a clean address.
  const go = (next) => {
    const merged = { status, gender, assigned, q, sort, dir, page: String(page), ...next };
    const p = {};
    for (const [k, v] of Object.entries(merged)) {
      if (!v) continue;
      if (k === 'page' && v === '1') continue;
      if (k === 'sort' && v === 'created_at') continue;
      if (k === 'dir' && v === 'desc') continue;
      p[k] = v;
    }
    setSp(p);
  };

  const search = (e) => {
    e.preventDefault();
    go({ q: qi.trim(), gender: gi, sort: si, dir: di, page: '1' });
  };
  const clearAll = () => { setQi(''); setGi(''); setSi('created_at'); setDi('desc'); setSp({}); };
  const hasFilters = !!(status || gender || assigned || q);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.per)) : 1;

  return (
    <>
      <div className="page-head"><h1>{t('nav_apps')}</h1></div>
      {user?.role === 'admin' && <BulkAssign onDone={() => setTick((n) => n + 1)} />}

      <div className="chips" role="group" aria-label={t('a_status')}>
        <Chip active={!status && !assigned} label={t('all')} count={stats?.total} onClick={() => go({ status: '', assigned: '', page: '1' })} />
        {['pending', 'accepted', 'rejected'].map((s) => (
          <Chip key={s} active={status === s} label={t('st_' + s)} count={stats?.[s]} onClick={() => go({ status: s, assigned: '', page: '1' })} />
        ))}
        <Chip active={assigned === 'me'} label={t('a_mine')} count={stats?.mine} onClick={() => go({ assigned: assigned === 'me' ? '' : 'me', status: '', page: '1' })} />
        <Chip active={assigned === 'unassigned'} label={t('a_unassigned')} count={stats?.unassigned} onClick={() => go({ assigned: assigned === 'unassigned' ? '' : 'unassigned', status: '', page: '1' })} />
      </div>

      <form className="toolbar wide" onSubmit={search} role="search">
        <div className="field">
          <label htmlFor="q">{t('search')}</label>
          <input id="q" type="text" value={qi} onChange={(e) => setQi(e.target.value)} placeholder={t('a_search_ph')} maxLength={60} />
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
          <label htmlFor="sort">{t('l_sort')}</label>
          <select id="sort" value={si} onChange={(e) => setSi(e.target.value)}>
            {SORTS.map((s) => <option key={s} value={s}>{t('a_sort_' + s)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="dir">{t('l_dir')}</label>
          <select id="dir" value={di} onChange={(e) => setDi(e.target.value)}>
            <option value="desc">{t('l_desc')}</option>
            <option value="asc">{t('l_asc')}</option>
          </select>
        </div>
        <button className="btn" type="submit">{t('search')}</button>
      </form>
      {hasFilters && <p className="mt-6"><button type="button" className="btn secondary small" onClick={clearAll}>{t('a_clear')}</button></p>}

      {err && <div className="alert bad" role="alert">{t('e_' + err)}</div>}
      {!data && !err && <p role="status">{t('loading')}</p>}
      {data && (data.items.length === 0 ? <p>{t('a_none')}</p> : (
        <>
          <p className="hint" role="status">{t('a_showing', { n: String(data.items.length), total: String(data.total) })}</p>
          <div className="table-scroll">
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
                    <td data-label={t('a_phone')}><a href={`tel:${a.phone}`}>{a.phone}</a></td>
                    <td data-label={t('a_date')}>{fmtDateTime(a.created_at)}</td>
                    <td data-label={t('a_status')}><StatusBadge status={a.status} /></td>
                    <td data-label={t('a_assignee')}>{a.assigned_to_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav className="pager" aria-label="Pagination">
            <button type="button" className="btn secondary small" disabled={page <= 1} onClick={() => go({ page: String(page - 1) })}>{t('prev')}</button>
            <span>{t('page_of', { p: page, n: pages })}</span>
            <button type="button" className="btn secondary small" disabled={page >= pages} onClick={() => go({ page: String(page + 1) })}>{t('next')}</button>
          </nav>
        </>
      ))}
    </>
  );
}
