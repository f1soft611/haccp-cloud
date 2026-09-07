import { create } from 'zustand';
import { normalizePlatformTenantCode } from '../tenant/platformTenant';

export type UserRole = 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'USER';
export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

const USER_ROLES = ['PLATFORM_ADMIN', 'TENANT_ADMIN', 'USER'] as const;

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
  return 'USER';
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
  mustChangePassword: boolean;
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
    mustChangePassword?: boolean;
  }) => void;
  updateUserImages: (payload: {
    profileImage?: string;
    signatureImage?: string;
    stampImage?: string;
  }) => void;
  updateAccessToken: (accessToken: string) => void;
  markOnboardingCompleted: () => void;
  clearMustChangePassword: () => void;
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
  role: 'USER' as UserRole,
  accessToken: '',
  refreshToken: '',
  loginHistoryId: undefined,
  onboardingRequired: false,
  onboardingStatus: 'COMPLETED' as OnboardingStatus,
  mustChangePassword: false,
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
    mustChangePassword,
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
      mustChangePassword: mustChangePassword ?? false,
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
  clearMustChangePassword: () =>
      set((state) => {
        const nextState = {
          ...state,
          mustChangePassword: false,
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
