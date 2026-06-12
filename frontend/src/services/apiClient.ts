import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../shared/store/authStore';

export const apiClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.MODE === 'test' ? 'http://localhost:3000/api' : '/api'),
  timeout: 15000,
});

const refreshClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.MODE === 'test' ? 'http://localhost:3000/api' : '/api'),
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
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      const requestUrl = originalRequest.url ?? '';
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/refresh');

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
      } else {
        useAuthStore.getState().logout();
      }
    } else if (status === 401) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  },
);
