import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useI18n } from '../../i18n';

export default function Dashboard() {
  const { t } = useI18n();
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

  return (
    <>
      <h1>{t('nav_dashboard')}</h1>
      {err && <div className="alert bad" role="alert">{err}</div>}
      {!s && !err && <p role="status">{t('loading')}</p>}
      {s && (
        <>
          <div className="stats">
            {cards.map(([label, key, q, cls]) => (
              <Link key={key} to={`/admin/applications${q}`} className={`stat ${cls}`}>
                <b>{s[key]}</b>
                <span>{t(label)}</span>
              </Link>
            ))}
          </div>
          <div className="stats" style={{ marginTop: 12 }}>
            <div className="stat plain"><b>{s.male}</b><span>{t('d_male')}</span></div>
            <div className="stat plain"><b>{s.female}</b><span>{t('d_female')}</span></div>
          </div>
        </>
      )}
    </>
  );
}
