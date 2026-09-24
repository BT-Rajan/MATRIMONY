import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import PublicShell from '../../components/PublicShell';
import { useAuth } from '../../auth';
import { useI18n } from '../../i18n';

export default function Login() {
  const { t } = useI18n();
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(u.trim(), p);
      nav('/admin', { replace: true });
    } catch (x) {
      setErr(t('e_' + x.code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicShell>
      <div className="card narrow" style={{ margin: '24px auto' }}>
        <h1>{t('login_title')}</h1>
        <form onSubmit={submit}>
          <div role="alert">{err && <div className="alert bad">{err}</div>}</div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label htmlFor="username">{t('username')}</label>
            <input id="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck="false" value={u} onChange={(e) => setU(e.target.value)} required />
          </div>
          <div className="field" style={{ marginBottom: 14 }}>
            <label htmlFor="password">{t('password')}</label>
            <input id="password" type="password" autoComplete="current-password" value={p} onChange={(e) => setP(e.target.value)} required />
          </div>
          <button className="btn block" type="submit" disabled={busy}>{busy ? t('loading') : t('sign_in')}</button>
        </form>
      </div>
    </PublicShell>
  );
}
