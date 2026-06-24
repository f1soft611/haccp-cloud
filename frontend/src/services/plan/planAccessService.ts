import { apiClient } from '../api/apiClient';

export type FeatureAccessMap = Record<string, boolean>;

export type CurrentPlanAccess = {
  tenantId?: number;
  tenantCode?: string;
  planCode?: string;
  features: FeatureAccessMap;
};

export type PlanSummary = {
  planCode: string;
  planName: string;
  useAt: 'Y' | 'N';
  featureCount: number;
  menuCount: number;
};

type RawCurrentPlanAccess = {
  tenantId?: number;
  tenantCode?: string;
  planCode?: string;
  features?: Record<string, unknown>;
};

function normalizeFeatures(
  features?: Record<string, unknown>,
): FeatureAccessMap {
  if (!features) {
    return {};
  }

  return Object.entries(features).reduce<FeatureAccessMap>(
    (acc, [key, value]) => {
      acc[key] = value === true;
      return acc;
    },
    {},
  );
}

export async function getCurrentPlanAccess(): Promise<CurrentPlanAccess> {
  const { data } = await apiClient.get<RawCurrentPlanAccess>(
    '/platform-admin/plan-access/me',
  );

  return {
    tenantId: data.tenantId,
    tenantCode: data.tenantCode,
    planCode: data.planCode,
    features: normalizeFeatures(data.features),
  };
}

export async function listPlanSummaries(): Promise<PlanSummary[]> {
  const { data } = await apiClient.get<Array<Partial<PlanSummary>>>(
    '/platform-admin/plan-access/plans',
  );

  return (data ?? []).map((item) => ({
    planCode: String(item.planCode ?? '').trim(),
    planName: String(item.planName ?? '').trim(),
    useAt: item.useAt === 'N' ? 'N' : 'Y',
    featureCount: Number(item.featureCount ?? 0),
    menuCount: Number(item.menuCount ?? 0),
  }));
}

export async function getPlanFeatures(
  planCode: string,
): Promise<FeatureAccessMap> {
  const { data } = await apiClient.get<{
    planCode?: string;
    features?: Record<string, unknown>;
  }>(`/platform-admin/plan-access/plans/${planCode}/features`);

  return normalizeFeatures(data.features);
}

export async function getPlanMenuCodes(planCode: string): Promise<string[]> {
  const { data } = await apiClient.get<{
    planCode?: string;
    menuCodes?: unknown[];
  }>(`/platform-admin/plan-access/plans/${planCode}/menus`);

  return Array.from(
    new Set(
      (data.menuCodes ?? [])
        .map((value) => String(value ?? '').trim())
        .filter((value) => value.length > 0),
    ),
  );
}

export async function savePlanMenuCodes(payload: {
  planCode: string;
  menuCodes: string[];
}): Promise<string[]> {
  const normalizedPlanCode = payload.planCode.trim().toUpperCase();
  const normalizedMenuCodes = Array.from(
    new Set(
      payload.menuCodes
        .map((value) => String(value ?? '').trim())
        .filter((value) => value.length > 0),
    ),
  );

  const { data } = await apiClient.put<{
    planCode?: string;
    menuCodes?: unknown[];
  }>(`/platform-admin/plan-access/plans/${normalizedPlanCode}/menus`, {
    menuCodes: normalizedMenuCodes,
  });

  return Array.from(
    new Set(
      (data.menuCodes ?? [])
        .map((value) => String(value ?? '').trim())
        .filter((value) => value.length > 0),
    ),
  );
}

export async function getTenantPlanMenuCodes(
  tenantCode: string,
): Promise<string[]> {
  const normalizedTenantCode = tenantCode.trim().toUpperCase();
  const { data } = await apiClient.get<{
    tenantCode?: string;
    menuCodes?: unknown[];
  }>('/platform-admin/plan-access/tenant-plan-menus', {
    params: { tenantCode: normalizedTenantCode },
  });

  return Array.from(
    new Set(
      (data.menuCodes ?? [])
        .map((value) => String(value ?? '').trim())
        .filter((value) => value.length > 0),
    ),
  );
}
