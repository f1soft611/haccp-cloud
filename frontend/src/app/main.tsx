import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AppProviders } from './providers/AppProviders.tsx';
import { shouldEnableMocking } from './runtime/mockMode.ts';

// 목 모드면 MSW 를 시작하고, 아니면 PWA 서비스워커를 등록 (둘 다 scope / 라 동시에 쓸 수 없음)
async function enableMocking() {
  const enableMockApi = shouldEnableMocking({
    isDev: import.meta.env.DEV,
    explicitMockFlag: import.meta.env.VITE_ENABLE_MSW,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  });

  if (!enableMockApi) {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js');
    }
    return;
  }

  const { worker } = await import('../mocks/browser.ts');
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
