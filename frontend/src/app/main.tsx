import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AppProviders } from './providers/AppProviders.tsx';
import { shouldEnableMocking } from './runtime/mockMode.ts';

async function enableMocking() {
  const enableMockApi = shouldEnableMocking({
    isDev: import.meta.env.DEV,
    explicitMockFlag: import.meta.env.VITE_ENABLE_MSW,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  });

  if (!enableMockApi) {
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
