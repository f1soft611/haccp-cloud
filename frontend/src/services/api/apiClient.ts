import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../shared/store/authStore';

export function resolveApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!configuredBaseUrl) {
    return import.meta.env.MODE === 'test'
      ? 'http://localhost:3000/api'
      : '/api';
  }

  const trimmed = configuredBaseUrl.replace(/\/+$/, '');
  if (trimmed.endsWith('/api')) {
    return trimmed;
  }

  return `${trimmed}/api`;
}

const resolvedApiBaseUrl = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: resolvedApiBaseUrl,
  timeout: 15000,
});

const refreshClient = axios.create({
  baseURL: resolvedApiBaseUrl,
  timeout: 15000,
});

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

apiClient.interceptors.request.use((config) => {
  const { tenantCode, accessToken } = useAuthStore.getState();

  if (tenantCode && !config.headers['x-tenant-code']) {
    config.headers['x-tenant-code'] = tenantCode;
  }

  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? '';
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh');
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (status === 401 && isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (status === 401 && originalRequest && !originalRequest._retry) {
      if (!isAuthEndpoint) {
        originalRequest._retry = true;

        const { refreshToken, updateAccessToken } = useAuthStore.getState();

        if (refreshToken) {
          try {
            const refreshResponse = await refreshClient.post<{
              resultCode?: string;
              jToken?: string;
            }>('/auth/refresh', {
              refreshToken,
            });

            const newAccessToken = refreshResponse.data.jToken;
            if (refreshResponse.data.resultCode === '200' && newAccessToken) {
              updateAccessToken(newAccessToken);
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              return apiClient.request(originalRequest);
            }
          } catch {
            useAuthStore.getState().logout();
          }
        } else {
          useAuthStore.getState().logout();
        }
      }
    } else if (status === 401) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);
