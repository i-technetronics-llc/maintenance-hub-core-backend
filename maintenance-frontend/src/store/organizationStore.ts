import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Company } from '../services/api';

interface OrganizationState {
  selectedOrganization: Company | null;
  organizations: Company[];
  isLoading: boolean;
  setSelectedOrganization: (org: Company | null) => void;
  setOrganizations: (orgs: Company[]) => void;
  setIsLoading: (loading: boolean) => void;
  clearOrganization: () => void;
  getSelectedOrganizationId: () => string | null;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      selectedOrganization: null,
      organizations: [],
      isLoading: false,

      setSelectedOrganization: (org) => set({ selectedOrganization: org }),

      setOrganizations: (orgs) => set({ organizations: orgs }),

      setIsLoading: (loading) => set({ isLoading: loading }),

      clearOrganization: () => set({ selectedOrganization: null, organizations: [] }),

      getSelectedOrganizationId: () => {
        const { selectedOrganization } = get();
        return selectedOrganization?.id || null;
      },
    }),
    {
      name: 'organization-storage',
      partialize: (state) => ({
        selectedOrganization: state.selectedOrganization,
      }),
    }
  )
);
