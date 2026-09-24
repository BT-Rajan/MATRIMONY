import { useI18n } from '../i18n';

export default function LangToggle() {
  const { lang, setLang, t } = useI18n();
  const next = lang === 'ta' ? 'en' : 'ta';
  return (
    <button type="button" className="btn secondary small" onClick={() => setLang(next)} lang={next} aria-label={`Switch language: ${t('lang_switch')}`}>
      {t('lang_switch')}
    </button>
  );
}
