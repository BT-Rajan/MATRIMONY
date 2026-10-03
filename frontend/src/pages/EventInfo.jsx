import PublicShell from '../components/PublicShell';
import { useI18n } from '../i18n';
import { useSettings } from '../useSettings';

export default function EventInfo() {
  const { t, lang } = useI18n();
  const { settings } = useSettings();
  return (
    <PublicShell>
      <h1>{t('event')}</h1>
      {!settings ? <p role="status">{t('loading')}</p> : (
        <div className="card">
          <p>
            <strong>{t('when')}:</strong>{' '}
            {settings.event_date || t('date_tba')}
          </p>
          <p><strong>{t('where')}:</strong> {lang === 'en' ? settings.venue_en : settings.venue_ta}</p>
        </div>
      )}
    </PublicShell>
  );
}
