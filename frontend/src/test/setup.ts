import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '../mocks/server';
import { useAuthStore } from '../shared/store/authStore';

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useAuthStore.getState().logout();
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
