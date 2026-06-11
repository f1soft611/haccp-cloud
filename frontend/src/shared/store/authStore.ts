import { create } from 'zustand';

export type UserRole = 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | 'USER';

type AuthState = {
  isAuthenticated: boolean;
  tenantCode: string;
  userId: string;
  role: UserRole;
  login: (payload: {
    tenantCode: string;
    userId: string;
    role: UserRole;
  }) => void;
  logout: () => void;
};

const initialState = {
  isAuthenticated: false,
  tenantCode: '',
  userId: '',
  role: 'USER' as UserRole,
};

export const useAuthStore = create<AuthState>((set) => ({
  ...initialState,
  login: ({ tenantCode, userId, role }) =>
    set({
      isAuthenticated: true,
      tenantCode,
      userId,
      role,
    }),
  logout: () => set(initialState),
}));
