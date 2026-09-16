import { Segmented } from 'antd';
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <Segmented
      size="small"
      value={i18n.language}
      onChange={(value) => i18n.changeLanguage(value as string)}
      options={[
        { label: 'EN', value: 'en' },
        { label: 'ع', value: 'ar' },
      ]}
    />
  );
}
