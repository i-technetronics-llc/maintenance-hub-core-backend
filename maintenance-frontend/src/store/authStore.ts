import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
    permissions: string[];
  };
  company: {
    id: string;
    name: string;
    type: string;
  } | null;
  isSuperAdmin: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  isSuperAdmin: () => boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      /**
       * Check if user has a specific permission
       * Super-admin and users with '*' permission have access to everything
       */
      hasPermission: (permission: string): boolean => {
        const { user } = get();
        if (!user) return false;

        // Super-admin has all permissions
        if (user.isSuperAdmin) return true;

        // Check for wildcard permission
        if (user.role.permissions.includes('*')) return true;

        // Check for specific permission
        return user.role.permissions.includes(permission);
      },

      /**
       * Check if user is super-admin
       */
      isSuperAdmin: (): boolean => {
        const { user } = get();
        return user?.isSuperAdmin || false;
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
