import type { UserRole } from '../store/authStore';

export type AuthorityCode = 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER';

const AUTHORITY_CODE_BY_ROLE: Record<UserRole, AuthorityCode> = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  USER: 'TENANT_USER',
};

export function toAuthorityCode(role: UserRole): AuthorityCode {
  return AUTHORITY_CODE_BY_ROLE[role] ?? 'TENANT_USER';
}
