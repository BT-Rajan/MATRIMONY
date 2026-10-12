import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { useI18n } from '../../i18n';
import { fmtDateTime } from '../../date';

const BLANK = { name: '', username: '', role: 'manager', is_active: true, password: '' };

function Chip({ active, label, count, onClick }) {
  return (
    <button type="button" className={`chip${active ? ' on' : ''}`} aria-pressed={active} onClick={onClick}>
      {label} <span className="chip-n">{count ?? '–'}</span>
    </button>
  );
}

export default function Users() {
  const { t } = useI18n();
  const { user: me } = useAuth();
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(null); // null = closed
  const [errs, setErrs] = useState({});
  const [top, setTop] = useState('');
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');   // '' | 'admin' | 'manager'
  const [status, setStatus] = useState(''); // '' | 'active' | 'inactive'
  const nameRef = useRef(null);

  const load = useCallback(() => api.get('users').then((r) => setItems(r.items)).catch((e) => setTop(e.code)), []);
  useEffect(() => { load(); }, [load]);
  const isOpen = !!form;
  useEffect(() => { if (isOpen) nameRef.current?.focus(); }, [isOpen]);

  // Admins first, then managers, each alphabetical. The list is small, so filtering runs here.
  const sorted = useMemo(() => {
    if (!items) return null;
    const rank = (u) => (u.role === 'admin' ? 0 : 1);
    return [...items].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  }, [items]);

  const counts = useMemo(() => {
    const c = { all: 0, admin: 0, manager: 0, active: 0, inactive: 0 };
    for (const u of sorted ?? []) {
      c.all++;
      c[u.role]++;
      c[Number(u.is_active) ? 'active' : 'inactive']++;
    }
    return c;
  }, [sorted]);

  const visible = useMemo(() => {
    if (!sorted) return null;
    const needle = q.trim().toLowerCase();
    return sorted.filter((u) => {
      if (role && u.role !== role) return false;
      if (status && (status === 'active') !== !!Number(u.is_active)) return false;
      if (needle && !u.name.toLowerCase().includes(needle) && !u.username.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [sorted, q, role, status]);

  const hasFilters = !!(q.trim() || role || status);
  const clearFilters = () => { setQ(''); setRole(''); setStatus(''); };

  const open = (u) => {
    setErrs({});
    setTop('');
    setForm(u ? { id: u.id, name: u.name, username: u.username, role: u.role, is_active: !!Number(u.is_active), password: '' } : { ...BLANK });
  };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setErrs({});
    setTop('');
    setBusy(true);
    try {
      const { id, ...data } = form;
      if (id) await api.put(`users/${id}`, data);
      else await api.post('users', data);
      setForm(null);
      await load();
    } catch (x) {
      if (x.errors && Object.keys(x.errors).length) setErrs(x.errors);
      else setTop(x.code);
    } finally {
      setBusy(false);
    }
  }

  async function remove(u) {
    if (!window.confirm(`${t('u_delete_confirm')} ${u.name}`)) return;
    setTop('');
    try {
      await api.del(`users/${u.id}`);
      await load();
    } catch (x) {
      setTop(x.code);
    }
  }

  if (me.role !== 'admin') return <Navigate to="/admin.html" replace />;

  const fe = (k) => errs[k] && <p className="err" id={`${k}-err`}>{t('e_' + errs[k])}</p>;
  const ia = (k) => ({ 'aria-invalid': errs[k] ? 'true' : undefined, 'aria-describedby': errs[k] ? `${k}-err` : undefined });

  return (
    <>
      <div className="page-head">
        <h1>{t('users_title')}</h1>
        {!form && <button type="button" className="btn" onClick={() => open(null)}>+ {t('u_new')}</button>}
      </div>
      <div role="alert">{top && <div className="alert bad">{t('e_' + top)}</div>}</div>

      {form && (
        <section className="card" aria-labelledby="uf">
          <h2 id="uf">{form.id ? t('u_edit') : t('u_new')}</h2>
          <form onSubmit={submit} noValidate>
            <div className="grid">
              <div className="field">
                <label htmlFor="name">{t('u_name')}</label>
                <input id="name" ref={nameRef} type="text" value={form.name} maxLength={120} onChange={(e) => set('name', e.target.value)} {...ia('name')} />
                {fe('name')}
              </div>
              <div className="field">
                <label htmlFor="uname">{t('username')}</label>
                <input id="uname" type="text" value={form.username} maxLength={30} disabled={!!form.id} autoCapitalize="none" spellCheck="false" autoComplete="off"
                  onChange={(e) => set('username', e.target.value)} aria-invalid={errs.username ? 'true' : undefined} aria-describedby={errs.username ? 'username-err' : undefined} />
                {fe('username')}
              </div>
              <div className="field">
                <label htmlFor="role">{t('u_role')}</label>
                <select id="role" value={form.role} onChange={(e) => set('role', e.target.value)} {...ia('role')}>
                  <option value="manager">{t('role_manager')}</option>
                  <option value="admin">{t('role_admin')}</option>
                </select>
                {fe('role')}
              </div>
              <div className="field">
                <label htmlFor="pw">{t('password')}</label>
                <input id="pw" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)}
                  aria-invalid={errs.password ? 'true' : undefined} aria-describedby={errs.password ? 'password-err pwh' : 'pwh'} />
                <p className="hint" id="pwh">{form.id ? t('u_pass_edit') : t('u_pass_new')}</p>
                {fe('password')}
              </div>
            </div>
            <div className="check">
              <input id="active" type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} />
              <label htmlFor="active">{t('u_active')}</label>
            </div>
            <div className="row">
              <button type="submit" className="btn" disabled={busy}>{busy ? t('loading') : t('save')}</button>
              <button type="button" className="btn secondary" onClick={() => setForm(null)}>{t('cancel')}</button>
            </div>
          </form>
        </section>
      )}

      {!visible ? <p role="status">{t('loading')}</p> : (
        <>
          <div className="chips" role="group" aria-label={t('u_role')}>
            <Chip active={!role} label={t('all')} count={counts.all} onClick={() => setRole('')} />
            <Chip active={role === 'admin'} label={t('role_admin')} count={counts.admin} onClick={() => setRole(role === 'admin' ? '' : 'admin')} />
            <Chip active={role === 'manager'} label={t('role_manager')} count={counts.manager} onClick={() => setRole(role === 'manager' ? '' : 'manager')} />
          </div>

          <form className="toolbar" role="search" onSubmit={(e) => e.preventDefault()}>
            <div className="field">
              <label htmlFor="uq">{t('search')}</label>
              <input id="uq" type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('u_search_ph')} maxLength={60} />
            </div>
            <div className="field">
              <label htmlFor="ustatus">{t('u_status')}</label>
              <select id="ustatus" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">{t('u_all_status')}</option>
                <option value="active">{t('u_active')} ({counts.active})</option>
                <option value="inactive">{t('u_inactive')} ({counts.inactive})</option>
              </select>
            </div>
            {hasFilters && <button type="button" className="btn secondary" onClick={clearFilters}>{t('a_clear')}</button>}
          </form>

          {visible.length === 0 ? <p>{t('l_none')}</p> : (
            <>
              <p className="hint" role="status">{t('u_shown', { n: String(visible.length) })}</p>
              <div className="table-scroll">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th scope="col">{t('u_name')}</th><th scope="col">{t('username')}</th><th scope="col">{t('u_role')}</th>
                      <th scope="col">{t('u_status')}</th><th scope="col">{t('u_last')}</th><th scope="col"><span className="sr-only">{t('l_actions')}</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((u) => {
                      const isMe = u.id === me.id;
                      const active = !!Number(u.is_active);
                      return (
                        <tr key={u.id}>
                          <td data-label={t('u_name')}>{u.name}{isMe && <span className="you-tag">({t('u_you')})</span>}</td>
                          <td data-label={t('username')}>{u.username}</td>
                          <td data-label={t('u_role')}><span className={`badge ${u.role}`}>{t('role_' + u.role)}</span></td>
                          <td data-label={t('u_status')}><span className={`badge ${active ? 'active' : 'inactive'}`}>{active ? t('u_active') : t('u_inactive')}</span></td>
                          <td data-label={t('u_last')}>{u.last_login_at ? fmtDateTime(u.last_login_at) : <span className="muted">{t('u_never')}</span>}</td>
                          <td>
                            <div className="row end">
                              <button type="button" className="btn secondary small" onClick={() => open(u)}>{t('edit')}</button>
                              {!isMe && <button type="button" className="btn danger small" onClick={() => remove(u)}>{t('delete')}</button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
