import PublicShell from '../components/PublicShell';
import { useI18n } from '../i18n';
import { SITE } from '../config';

export default function EventInfo() {
  const { t, lang } = useI18n();
  return (
    <PublicShell>
      <h1>{t('event')}</h1>
      <div className="card">
        <p>
          <strong>{t('when')}:</strong>{' '}
          {SITE.event.date || t('date_tba')}
        </p>
        <p><strong>{t('where')}:</strong> {SITE.event.venue[lang]}</p>
      </div>
    </PublicShell>
  );
}
