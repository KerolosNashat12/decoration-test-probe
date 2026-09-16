import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import App from './App';
import { decorationTheme } from './theme';
import './index.css';

// RTL support is here for later — most tenants and admins will read Arabic.
// Flip direction="rtl" (and add an Arabic locale) once the UI copy is
// translated; left as ltr for now so the initial build is easy to read.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider theme={decorationTheme} direction="ltr">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </StrictMode>,
);
