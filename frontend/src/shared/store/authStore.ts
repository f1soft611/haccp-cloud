import { create } from 'zustand';

export type UserRole = 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'USER';
export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

type AuthState = {
  isAuthenticated: boolean;
  tenantCode: string;
  userId: string;
  role: UserRole;
  onboardingRequired: boolean;
  onboardingStatus: OnboardingStatus;
  login: (payload: {
    tenantCode: string;
    userId: string;
    role: UserRole;
    onboardingRequired?: boolean;
    onboardingStatus?: OnboardingStatus;
  }) => void;
  markOnboardingCompleted: () => void;
  logout: () => void;
};

const initialState = {
  isAuthenticated: false,
  tenantCode: '',
  userId: '',
  role: 'USER' as UserRole,
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
  login: ({
    tenantCode,
    userId,
    role,
    onboardingRequired,
    onboardingStatus,
  }) => {
    if (onboardingRequired === undefined) {
      console.warn(
        'Login response missing onboardingRequired. Falling back to onboardingStatus.',
      );
    }

    set({
      isAuthenticated: true,
      tenantCode,
      userId,
      role,
      onboardingRequired: onboardingRequired ?? false,
      onboardingStatus: resolveOnboardingStatus(
        onboardingRequired,
        onboardingStatus,
      ),
    });
  },
  markOnboardingCompleted: () =>
    set({ onboardingRequired: false, onboardingStatus: 'COMPLETED' }),
  logout: () => set(initialState),
}));
