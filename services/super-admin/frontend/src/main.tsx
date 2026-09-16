import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import arEG from 'antd/locale/ar_EG';
import { useTranslation } from 'react-i18next';
import App from './App';
import { decorationTheme } from './theme';
import './i18n';
import './index.css';

// Bilingual (English + Arabic) throughout, including layout direction:
// Ant Design's own locale + RTL switch, driven by i18next's current
// language. Arabic flips the whole layout to rtl, not just the text.
function Root() {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [isRtl, i18n.language]);

  return (
    <ConfigProvider theme={decorationTheme} direction={isRtl ? 'rtl' : 'ltr'} locale={isRtl ? arEG : enUS}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
