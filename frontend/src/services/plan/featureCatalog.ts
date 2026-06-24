import type { FeatureAccessMap } from './planAccessService';

export const FEATURE_CODES = {
  USER_MANAGEMENT: 'FEATURE_USER_MGMT',
  DOCUMENT_WORKFLOW: 'FEATURE_DOC_WORKFLOW',
  AUDIT_LOG: 'FEATURE_AUDIT_LOG',
  API_EXPORT: 'FEATURE_API_EXPORT',
} as const;

const PATH_FEATURE_CODE_MAP: Record<string, string> = {
  '/platform/login-history': FEATURE_CODES.AUDIT_LOG,
  '/platform/menus': FEATURE_CODES.USER_MANAGEMENT,
  '/users': FEATURE_CODES.USER_MANAGEMENT,
  '/documents': FEATURE_CODES.DOCUMENT_WORKFLOW,
};

const BUTTON_FEATURE_CODE_MAP: Record<string, string> = {
  'platform-menu-create': FEATURE_CODES.USER_MANAGEMENT,
  'platform-menu-edit': FEATURE_CODES.USER_MANAGEMENT,
  'platform-menu-delete': FEATURE_CODES.USER_MANAGEMENT,
};

export function resolveFeatureCodeByPath(path: string): string | undefined {
  return PATH_FEATURE_CODE_MAP[path];
}

export function resolveFeatureCodeByButton(
  buttonKey: string,
): string | undefined {
  return BUTTON_FEATURE_CODE_MAP[buttonKey];
}

export function isFeatureAllowed(
  features: FeatureAccessMap | undefined,
  featureCode: string | undefined,
): boolean {
  if (!featureCode) {
    return true;
  }

  if (!features) {
    return true;
  }

  if (!(featureCode in features)) {
    return true;
  }

  return features[featureCode] === true;
}
