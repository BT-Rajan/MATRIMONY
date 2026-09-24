import { useI18n } from '../i18n';

export default function StatusBadge({ status }) {
  const { t } = useI18n();
  return <span className={`badge ${status}`}>{t('st_' + status)}</span>;
}
