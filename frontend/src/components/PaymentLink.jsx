import { useI18n } from '../i18n';

export default function PaymentLink() {
  const { t } = useI18n();
  return (
    <div className="pay-link">
      <a className="btn secondary block" href="#/payment" target="_blank" rel="noopener noreferrer">
        {t('pay_link')} ↗
      </a>
      <p className="hint">{t('pay_link_hint')}</p>
    </div>
  );
}
