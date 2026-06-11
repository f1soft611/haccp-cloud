import axios from 'axios';
import { useAuthStore } from '../shared/store/authStore';

export const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.MODE === 'test' ? 'http://localhost:3000/api' : '/api'),
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const tenantCode = useAuthStore.getState().tenantCode;

  if (tenantCode && !config.headers['x-tenant-code']) {
    config.headers['x-tenant-code'] = tenantCode;
  }

  return config;
});
