import { create } from 'zustand';
import { normalizePlatformTenantCode } from '../tenant/platformTenant';

// 기존 -> export type UserRole = 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER' | 'USER';
// 변경 -> 업체 사용자 role 은 TENANT_USER 하나만 사용
export type UserRole = 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER';
export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

// 기존 -> const USER_ROLES = ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'TENANT_USER', 'USER'] as const;
// 변경 -> 'USER' 제거
const USER_ROLES = ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'TENANT_USER'] as const;

function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === 'string' &&
    USER_ROLES.includes(value as (typeof USER_ROLES)[number])
  );
}

function normalizeUserRole(value: unknown): UserRole {
  if (isUserRole(value)) {
    return value;
  }
  // 기존 -> return 'USER';
  // 변경 -> 예전 저장값 'USER' 와 알 수 없는 값은 TENANT_USER 로 처리
  return 'TENANT_USER';
}

type AuthState = {
  isAuthenticated: boolean;
  tenantCode: string;
  planCode?: string;
  userId: string;
  displayName: string;
  email?: string;
  departmentName?: string;
  profileImage?: string;
  signatureImage?: string;
  stampImage?: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
  loginHistoryId?: number;
  onboardingRequired: boolean;
  onboardingStatus: OnboardingStatus;
  login: (payload: {
    tenantCode: string;
    planCode?: string;
    userId: string;
    displayName?: string;
    email?: string;
    departmentName?: string;
    profileImage?: string;
    signatureImage?: string;
    stampImage?: string;
    role: UserRole;
    accessToken?: string;
    refreshToken?: string;
    loginHistoryId?: number;
    onboardingRequired?: boolean;
    onboardingStatus?: OnboardingStatus;
  }) => void;
  updateUserImages: (payload: {
    profileImage?: string;
    signatureImage?: string;
    stampImage?: string;
  }) => void;
  updateAccessToken: (accessToken: string) => void;
  markOnboardingCompleted: () => void;
  reset: () => void;
  logout: () => void;
};

const AUTH_STORAGE_KEY = 'haccp.auth';

function loadPersistedState(): Partial<AuthState> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as Partial<AuthState>;
    const hasState =
      parsed.isAuthenticated === true &&
      (Boolean(parsed.userId) ||
        Boolean(parsed.accessToken) ||
        Boolean(parsed.tenantCode));

    if (!hasState) {
      clearPersistedState();
      return {};
    }

    return {
      ...parsed,
      tenantCode: normalizePlatformTenantCode(parsed.tenantCode),
      role: normalizeUserRole(parsed.role),
    };
  } catch {
    return {};
  }
}

function persistState(state: Partial<AuthState>): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

function clearPersistedState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
}

const initialState = {
  isAuthenticated: false,
  tenantCode: '',
  planCode: undefined,
  userId: '',
  displayName: '',
  email: undefined,
  departmentName: undefined,
  profileImage: undefined,
  signatureImage: undefined,
  stampImage: undefined,
  // 기존 -> role: 'USER' as UserRole,
  // 변경 -> 기본 role TENANT_USER
  role: 'TENANT_USER' as UserRole,
  accessToken: '',
  refreshToken: '',
  loginHistoryId: undefined,
  onboardingRequired: false,
  onboardingStatus: 'COMPLETED' as OnboardingStatus,
};

function resolveOnboardingStatus(
  onboardingRequired: boolean | undefined,
  onboardingStatus?: OnboardingStatus,
): OnboardingStatus {
  if (onboardingStatus) {
    return onboardingStatus;
  }

  return onboardingRequired ? 'NOT_STARTED' : 'COMPLETED';
}

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  ...loadPersistedState(),
  login: ({
    tenantCode,
    planCode,
    userId,
    displayName,
    email,
    departmentName,
    profileImage,
    signatureImage,
    stampImage,
    role,
    accessToken,
    refreshToken,
    loginHistoryId,
    onboardingRequired,
    onboardingStatus,
  }) => {
    if (onboardingRequired === undefined) {
      console.warn(
        'Login response missing onboardingRequired. Falling back to onboardingStatus.',
      );
    }

    const nextState = {
      isAuthenticated: true,
      tenantCode: normalizePlatformTenantCode(tenantCode),
      planCode: planCode?.trim().toUpperCase() || undefined,
      userId,
      displayName: (displayName ?? '').trim(),
      email: (email ?? '').trim() || undefined,
      departmentName: (departmentName ?? '').trim() || undefined,
      profileImage: (profileImage ?? '').trim() || undefined,
      signatureImage: (signatureImage ?? '').trim() || undefined,
      stampImage: (stampImage ?? '').trim() || undefined,
      role: normalizeUserRole(role),
      accessToken: accessToken ?? '',
      refreshToken: refreshToken ?? '',
      loginHistoryId,
      onboardingRequired: onboardingRequired ?? false,
      onboardingStatus: resolveOnboardingStatus(
        onboardingRequired,
        onboardingStatus,
      ),
    };

    set(nextState);
    persistState(nextState);
  },
  updateUserImages: ({ profileImage, signatureImage, stampImage }) => {
    set((state) => {
      const nextState = {
        ...state,
        profileImage: (profileImage ?? '').trim() || undefined,
        signatureImage: (signatureImage ?? '').trim() || undefined,
        stampImage: (stampImage ?? '').trim() || undefined,
      };

      persistState(nextState);
      return nextState;
    });
  },
  updateAccessToken: (accessToken) => {
    set((state) => {
      const nextState = {
        ...state,
        accessToken,
      };

      persistState(nextState);
      return nextState;
    });
  },
  markOnboardingCompleted: () =>
    set((state) => {
      const nextState = {
        ...state,
        onboardingRequired: false,
        onboardingStatus: 'COMPLETED' as OnboardingStatus,
      };

      persistState(nextState);
      return nextState;
    }),
  reset: () => {
    clearPersistedState();
    set({ ...initialState });
  },
  logout: () => {
    clearPersistedState();
    set({ ...initialState });
  },
}));
