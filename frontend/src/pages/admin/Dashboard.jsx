import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useI18n } from '../../i18n';
import { useAuth } from '../../auth';

export default function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('stats').then(setS).catch((e) => setErr(t('e_' + e.code)));
  }, [t]);

  const cards = [
    ['d_total', 'total', '', 'plain'],
    ['d_accepted', 'accepted', '?status=accepted', 'ok'],
    ['d_rejected', 'rejected', '?status=rejected', 'bad'],
    ['d_pending', 'pending', '?status=pending', 'warn'],
  ];
  const workQueue = user?.role === 'admin'
    ? ['d_unassigned', 'unassigned', '?status=pending&assigned=unassigned', 'warn']
    : ['d_mine', 'mine', '?status=pending&assigned=me', 'warn'];

  return (
    <>
      <h1>{t('nav_dashboard')}</h1>
      {err && <div className="alert bad" role="alert">{err}</div>}
      {!s && !err && <p role="status">{t('loading')}</p>}
      {s && (
        <>
          <div className="stats">
            {cards.map(([label, key, q, cls]) => (
              <Link key={key} to={`/admin.html/applications${q}`} className={`stat ${cls}`}>
                <b>{s[key]}</b>
                <span>{t(label)}</span>
              </Link>
            ))}
          </div>
          <div className="stats" style={{ marginTop: 12 }}>
            {[['d_male', 'male'], ['d_female', 'female']].map(([label, g]) => (
              <Link key={g} to={`/admin.html/applications?gender=${g}`} className="stat plain">
                <b>{s[g]}</b>
                <span>{t(label)}</span>
              </Link>
            ))}
            <Link to={`/admin.html/applications${workQueue[2]}`} className={`stat ${workQueue[3]}`}>
              <b>{s[workQueue[1]]}</b>
              <span>{t(workQueue[0])}</span>
            </Link>
          </div>
        </>
      )}
    </>
  );
}
