import { apiClient } from './apiClient';

export async function logout(loginHistoryId?: number): Promise<void> {
  await apiClient.post('/auth/logout', {
    loginHistoryId,
  });
}
