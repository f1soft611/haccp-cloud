import { apiClient } from '../api/apiClient';

export type FeatureAccessMap = Record<string, boolean>;

export type PlanFeatureType = 'BOOLEAN' | 'LIMIT';

export type PlanFeatureItem = {
  featureCode: string;
  featureName: string;
  featureType: PlanFeatureType;
  enabled: boolean;
  limitValue: number | null;
};

export type CurrentPlanAccess = {
  tenantId?: number;
  tenantCode?: string;
  planCode?: string;
  features: FeatureAccessMap;
};

type PlanAccessAuthContext = {
  accessToken?: string;
  tenantCode?: string;
};

export type PlanSummary = {
  planCode: string;
  planName: string;
  planDesc: string;
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

function normalizeFeatureCode(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}

function inferFeatureType(
  featureCode: string,
  rawType?: unknown,
): PlanFeatureType {
  const normalizedRawType = String(rawType ?? '')
    .trim()
    .toUpperCase();
  if (normalizedRawType === 'LIMIT') {
    return 'LIMIT';
  }
  if (normalizedRawType === 'BOOLEAN') {
    return 'BOOLEAN';
  }
  return featureCode.startsWith('LIMIT_') ? 'LIMIT' : 'BOOLEAN';
}

function normalizeFeatureName(featureCode: string, rawName?: unknown): string {
  const name = String(rawName ?? '').trim();
  if (name.length > 0) {
    return name;
  }
  return featureCode;
}

function normalizeLimitValue(rawValue: unknown): number | null {
  if (rawValue == null || rawValue === '') {
    return null;
  }
  const asNumber = Number(rawValue);
  return Number.isFinite(asNumber) ? asNumber : null;
}

function normalizeFeatureItem(rawItem: {
  featureCode?: unknown;
  featureCd?: unknown;
  featureName?: unknown;
  featureNm?: unknown;
  featureType?: unknown;
  featureTy?: unknown;
  enabled?: unknown;
  useAt?: unknown;
  use_at?: unknown;
  limitValue?: unknown;
  limitVal?: unknown;
  featureValue?: unknown;
  feature_value?: unknown;
}): PlanFeatureItem {
  const featureCode = normalizeFeatureCode(
    rawItem.featureCode ?? rawItem.featureCd,
  );
  const featureType = inferFeatureType(
    featureCode,
    rawItem.featureType ?? rawItem.featureTy,
  );
  const enabled =
    rawItem.enabled === true ||
    rawItem.useAt === 'Y' ||
    rawItem.use_at === 'Y' ||
    String(rawItem.enabled ?? '')
      .trim()
      .toUpperCase() === 'Y';

  return {
    featureCode,
    featureName: normalizeFeatureName(
      featureCode,
      rawItem.featureName ?? rawItem.featureNm,
    ),
    featureType,
    enabled,
    limitValue:
      featureType === 'LIMIT'
        ? normalizeLimitValue(
            rawItem.limitValue ??
              rawItem.limitVal ??
              rawItem.featureValue ??
              rawItem.feature_value,
          )
        : null,
  };
}

function normalizeFeatureItems(data: {
  features?:
    | Record<string, unknown>
    | Array<{
        featureCode?: unknown;
        featureName?: unknown;
        featureType?: unknown;
        enabled?: unknown;
        useAt?: unknown;
        limitValue?: unknown;
        featureValue?: unknown;
      }>;
}): PlanFeatureItem[] {
  const features = data.features;
  if (!features) {
    return [];
  }

  if (Array.isArray(features)) {
    return features
      .map((item) => normalizeFeatureItem(item))
      .filter((item) => item.featureCode.length > 0);
  }

  return Object.entries(features).map(([featureCode, value]) => {
    const normalizedCode = normalizeFeatureCode(featureCode);
    const featureType = inferFeatureType(normalizedCode);
    if (featureType === 'LIMIT') {
      return {
        featureCode: normalizedCode,
        featureName: normalizedCode,
        featureType,
        enabled: value != null,
        limitValue: normalizeLimitValue(value),
      };
    }

    return {
      featureCode: normalizedCode,
      featureName: normalizedCode,
      featureType,
      enabled: value === true,
      limitValue: null,
    };
  });
}

export function getCurrentPlanAccess(): Promise<CurrentPlanAccess>;
export function getCurrentPlanAccess(
  authContext: PlanAccessAuthContext,
): Promise<CurrentPlanAccess>;
export async function getCurrentPlanAccess(
  authContext?: PlanAccessAuthContext,
): Promise<CurrentPlanAccess> {
  const headers: Record<string, string> = {};

  const normalizedAccessToken = authContext?.accessToken?.trim();
  if (normalizedAccessToken) {
    headers.Authorization = `Bearer ${normalizedAccessToken}`;
  }

  const normalizedTenantCode = authContext?.tenantCode?.trim();
  if (normalizedTenantCode) {
    headers['x-tenant-code'] = normalizedTenantCode;
  }

  const { data } = await apiClient.get<RawCurrentPlanAccess>(
    '/platform-admin/plan-access/me',
    Object.keys(headers).length > 0 ? { headers } : undefined,
  );

  return {
    tenantId: data.tenantId,
    tenantCode: data.tenantCode,
    planCode: data.planCode,
    features: normalizeFeatures(data.features),
  };
}

export async function listPlanSummaries(): Promise<PlanSummary[]> {
  const { data } = await apiClient.get<
    Array<
      Partial<PlanSummary> & {
        planCd?: string;
        planNm?: string;
        planDesc?: string;
        planDc?: string;
        plan_desc?: string;
        plan_dc?: string;
        useAt?: 'Y' | 'N';
        use_at?: 'Y' | 'N';
        featureCount?: number;
        feature_count?: number;
        menuCount?: number;
        menu_count?: number;
      }
    >
  >('/platform-admin/plan-access/plans');

  return (data ?? []).map((item) => ({
    planCode: String(item.planCode ?? item.planCd ?? '').trim(),
    planName: String(item.planName ?? item.planNm ?? '').trim(),
    planDesc: String(
      item.planDesc ?? item.planDc ?? item.plan_desc ?? item.plan_dc ?? '',
    ).trim(),
    useAt: (item.useAt ?? item.use_at) === 'N' ? 'N' : 'Y',
    featureCount: Number(item.featureCount ?? item.feature_count ?? 0),
    menuCount: Number(item.menuCount ?? item.menu_count ?? 0),
  }));
}

export async function getPlanFeatures(
  planCode: string,
): Promise<PlanFeatureItem[]> {
  const { data } = await apiClient.get<{
    planCode?: string;
    features?:
      | Record<string, unknown>
      | Array<{
          featureCode?: unknown;
          featureName?: unknown;
          featureType?: unknown;
          enabled?: unknown;
          useAt?: unknown;
          limitValue?: unknown;
          featureValue?: unknown;
        }>;
  }>(`/platform-admin/plan-access/plans/${planCode}/features`);

  return normalizeFeatureItems(data);
}

export async function savePlanFeatures(payload: {
  planCode: string;
  features: PlanFeatureItem[];
}): Promise<PlanFeatureItem[]> {
  const normalizedPlanCode = payload.planCode.trim().toUpperCase();
  const normalizedFeatures = payload.features
    .map((item) => normalizeFeatureItem(item))
    .filter((item) => item.featureCode.length > 0)
    .map((item) => ({
      featureCode: item.featureCode,
      featureName: item.featureName,
      featureType: item.featureType,
      enabled: item.enabled,
      limitValue: item.featureType === 'LIMIT' ? item.limitValue : null,
    }));

  const { data } = await apiClient.put<{
    planCode?: string;
    features?:
      | Record<string, unknown>
      | Array<{
          featureCode?: unknown;
          featureName?: unknown;
          featureType?: unknown;
          enabled?: unknown;
          useAt?: unknown;
          limitValue?: unknown;
          featureValue?: unknown;
        }>;
  }>(`/platform-admin/plan-access/plans/${normalizedPlanCode}/features`, {
    features: normalizedFeatures,
  });

  return normalizeFeatureItems(data);
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
