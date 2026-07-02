import type { FeatureAccessMap } from './planAccessService';

export const FEATURE_CODES = {
  PLATFORM_TENANT_MANAGEMENT: 'FEATURE_PLATFORM_TENANT_MGMT',
  PLATFORM_MENU_MANAGEMENT: 'FEATURE_PLATFORM_MENU_MGMT',
  PLATFORM_ROLE_MANAGEMENT: 'FEATURE_PLATFORM_ROLE_MGMT',
  TENANT_USER_MANAGEMENT: 'FEATURE_TENANT_USER_MGMT',
  DOCUMENT_WORKFLOW: 'FEATURE_DOC_WORKFLOW',
  AUDIT_LOG: 'FEATURE_AUDIT_LOG',
  API_EXPORT: 'FEATURE_API_EXPORT',
} as const;

const PATH_FEATURE_CODE_MAP: Record<string, string> = {
  '/platform/tenants': FEATURE_CODES.PLATFORM_TENANT_MANAGEMENT,
  '/platform/login-history': FEATURE_CODES.AUDIT_LOG,
  '/platform/menus': FEATURE_CODES.PLATFORM_MENU_MANAGEMENT,
  '/org/roles': FEATURE_CODES.PLATFORM_ROLE_MANAGEMENT,
  '/roles': FEATURE_CODES.PLATFORM_ROLE_MANAGEMENT,
  '/platform/roles': FEATURE_CODES.PLATFORM_ROLE_MANAGEMENT,
  '/platform/role-menus': FEATURE_CODES.PLATFORM_ROLE_MANAGEMENT,
  '/users': FEATURE_CODES.TENANT_USER_MANAGEMENT,
  '/departments': FEATURE_CODES.TENANT_USER_MANAGEMENT,
  '/org/users': FEATURE_CODES.TENANT_USER_MANAGEMENT,
  '/org/departments': FEATURE_CODES.TENANT_USER_MANAGEMENT,
  '/documents': FEATURE_CODES.DOCUMENT_WORKFLOW,
  '/document-history': FEATURE_CODES.DOCUMENT_WORKFLOW,
};

const BUTTON_FEATURE_CODE_MAP: Record<string, string> = {
  'platform-menu-create': FEATURE_CODES.PLATFORM_MENU_MANAGEMENT,
  'platform-menu-edit': FEATURE_CODES.PLATFORM_MENU_MANAGEMENT,
  'platform-menu-delete': FEATURE_CODES.PLATFORM_MENU_MANAGEMENT,
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
