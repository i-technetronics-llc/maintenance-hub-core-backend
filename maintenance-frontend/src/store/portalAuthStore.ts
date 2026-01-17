import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  department?: string;
  company: {
    id: string;
    name: string;
  } | null;
  location: {
    id: string;
    name: string;
  } | null;
}

interface PortalAuthState {
  customer: Customer | null;
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (customer: Customer, token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const usePortalAuthStore = create<PortalAuthState>()(
  persist(
    (set) => ({
      customer: null,
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (customer, token) => set({ customer, token, isAuthenticated: true }),

      logout: () => set({ customer: null, token: null, isAuthenticated: false }),

      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
    }),
    {
      name: 'portal-auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
