import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../auth';
import { useI18n } from '../../i18n';
import { fmtDateTime } from '../../date';

const BLANK = { name: '', username: '', role: 'manager', is_active: true, password: '' };

export default function Users() {
  const { t } = useI18n();
  const { user: me } = useAuth();
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(null); // null = closed
  const [errs, setErrs] = useState({});
  const [top, setTop] = useState('');
  const [busy, setBusy] = useState(false);
  const nameRef = useRef(null);

  const load = useCallback(() => api.get('users').then((r) => setItems(r.items)).catch((e) => setTop(e.code)), []);
  useEffect(() => { load(); }, [load]);
  const isOpen = !!form;
  useEffect(() => { if (isOpen) nameRef.current?.focus(); }, [isOpen]);

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

  if (me.role !== 'admin') return <Navigate to="/admin" replace />;

  const fe = (k) => errs[k] && <p className="err" id={`${k}-err`}>{t('e_' + errs[k])}</p>;
  const ia = (k) => ({ 'aria-invalid': errs[k] ? 'true' : undefined, 'aria-describedby': errs[k] ? `${k}-err` : undefined });

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
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

      {!items ? <p role="status">{t('loading')}</p> : (
        <table className="tbl">
          <thead>
            <tr>
              <th scope="col">{t('u_name')}</th><th scope="col">{t('username')}</th><th scope="col">{t('u_role')}</th>
              <th scope="col">{t('u_status')}</th><th scope="col">{t('u_last')}</th><th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td data-label={t('u_name')}>{u.name}</td>
                <td data-label={t('username')}>{u.username}</td>
                <td data-label={t('u_role')}>{t('role_' + u.role)}</td>
                <td data-label={t('u_status')}>{Number(u.is_active) ? t('u_active') : t('u_inactive')}</td>
                <td data-label={t('u_last')}>{u.last_login_at ? fmtDateTime(u.last_login_at) : t('u_never')}</td>
                <td>
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className="btn secondary small" onClick={() => open(u)}>{t('edit')}</button>
                    {u.id !== me.id && <button type="button" className="btn bad small" onClick={() => remove(u)}>{t('delete')}</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
