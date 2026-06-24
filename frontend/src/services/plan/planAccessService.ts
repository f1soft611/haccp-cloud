import { apiClient } from '../api/apiClient';

export type FeatureAccessMap = Record<string, boolean>;

export type CurrentPlanAccess = {
  tenantId?: number;
  tenantCode?: string;
  planCode?: string;
  features: FeatureAccessMap;
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
