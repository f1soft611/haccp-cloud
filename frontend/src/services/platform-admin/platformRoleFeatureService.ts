import type { PlanFeatureItem } from './planAccessService';
import { apiClient } from '../api/apiClient';

function normalizeFeatureCode(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase();
}

function normalizeFeatureType(
  featureCode: string,
  rawType?: unknown,
): 'BOOLEAN' | 'LIMIT' {
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

function normalizeLimitValue(rawValue: unknown): number | null {
  if (rawValue == null || rawValue === '') {
    return null;
  }
  const numeric = Number(rawValue);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeRoleFeatureItem(rawItem: {
  featureCode?: unknown;
  featureName?: unknown;
  featureType?: unknown;
  enabled?: unknown;
  useAt?: unknown;
  limitValue?: unknown;
  featureValue?: unknown;
}): PlanFeatureItem {
  const featureCode = normalizeFeatureCode(rawItem.featureCode);
  const featureType = normalizeFeatureType(featureCode, rawItem.featureType);
  const featureName = String(rawItem.featureName ?? '').trim() || featureCode;
  const enabled =
    rawItem.enabled === true ||
    rawItem.useAt === 'Y' ||
    String(rawItem.enabled ?? '')
      .trim()
      .toUpperCase() === 'Y';

  return {
    featureCode,
    featureName,
    featureType,
    enabled,
    limitValue:
      featureType === 'LIMIT'
        ? normalizeLimitValue(rawItem.limitValue ?? rawItem.featureValue)
        : null,
  };
}

function normalizeRoleFeatureItems(data: {
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
      .map((item) => normalizeRoleFeatureItem(item))
      .filter((item) => item.featureCode.length > 0);
  }

  return Object.entries(features).map(([featureCode, value]) => {
    const normalizedCode = normalizeFeatureCode(featureCode);
    const featureType = normalizeFeatureType(normalizedCode);
    return {
      featureCode: normalizedCode,
      featureName: normalizedCode,
      featureType,
      enabled: featureType === 'LIMIT' ? value != null : value === true,
      limitValue: featureType === 'LIMIT' ? normalizeLimitValue(value) : null,
    };
  });
}

export async function getPlatformRoleFeatures(
  roleCode: string,
  tenantCode?: string,
): Promise<PlanFeatureItem[]> {
  const normalizedRoleCode = roleCode.trim().toUpperCase();
  const { data } = await apiClient.get<{
    roleCode?: string;
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
  }>('/v1/platform-admin/role-features', {
    params: {
      roleCode: normalizedRoleCode,
      tenantCode: tenantCode?.trim().toUpperCase(),
    },
  });

  return normalizeRoleFeatureItems(data);
}

export async function savePlatformRoleFeatures(payload: {
  roleCode: string;
  tenantCode?: string;
  features: PlanFeatureItem[];
}): Promise<PlanFeatureItem[]> {
  const roleCode = payload.roleCode.trim().toUpperCase();
  const features = payload.features
    .map((item) => normalizeRoleFeatureItem(item))
    .filter((item) => item.featureCode.length > 0)
    .map((item) => ({
      featureCode: item.featureCode,
      featureName: item.featureName,
      featureType: item.featureType,
      enabled: item.enabled,
      limitValue: item.featureType === 'LIMIT' ? item.limitValue : null,
    }));

  const { data } = await apiClient.put<{
    roleCode?: string;
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
  }>(
    `/v1/platform-admin/role-features/${roleCode}`,
    {
      features,
    },
    {
      params: {
        tenantCode: payload.tenantCode?.trim().toUpperCase(),
      },
    },
  );

  return normalizeRoleFeatureItems(data);
}
