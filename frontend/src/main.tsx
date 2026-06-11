import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/pretendard/400.css';
import '@fontsource/pretendard/600.css';
import '@fontsource/pretendard/700.css';
import '@fontsource/pretendard/800.css';
import './index.css';
import App from './App.tsx';
import { AppProviders } from './app/providers/AppProviders.tsx';

async function enableMocking() {
  const shouldEnableMocking =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW === 'true';

  if (!shouldEnableMocking) {
    return;
  }

  const { worker } = await import('./mocks/browser.ts');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

void enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </StrictMode>,
  );
});
