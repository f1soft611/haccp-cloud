import { create } from 'zustand';

export type UserRole = 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'USER';
export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

type AuthState = {
  isAuthenticated: boolean;
  tenantCode: string;
  userId: string;
  role: UserRole;
  accessToken: string;
  refreshToken: string;
  loginHistoryId?: number;
  onboardingRequired: boolean;
  onboardingStatus: OnboardingStatus;
  login: (payload: {
    tenantCode: string;
    userId: string;
    role: UserRole;
    accessToken?: string;
    refreshToken?: string;
    loginHistoryId?: number;
    onboardingRequired?: boolean;
    onboardingStatus?: OnboardingStatus;
  }) => void;
  updateAccessToken: (accessToken: string) => void;
  markOnboardingCompleted: () => void;
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

    return JSON.parse(raw) as Partial<AuthState>;
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
  userId: '',
  role: 'USER' as UserRole,
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
    userId,
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
      tenantCode,
      userId,
      role,
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
  logout: () => {
    clearPersistedState();
    set(initialState);
  },
}));
