import { apiClient } from './apiClient';

export type DashboardMetrics = {
  totalDocuments: number;
  draftTemplates: number;
  updatedToday: number;
};

export async function getDashboardMetrics(
  tenantCode: string,
): Promise<DashboardMetrics> {
  const { data } = await apiClient.get<DashboardMetrics>('/dashboard', {
    headers: { 'x-tenant-code': tenantCode },
  });
  return data;
}
