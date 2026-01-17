import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useOrganizationStore } from '../store/organizationStore';
import { useAuthStore } from '../store/authStore';

interface Client {
  id: string;
  name: string;
  code?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: { id: string; name: string };
}

interface SLA {
  id: string;
  name: string;
  code?: string;
  category: string;
  isDefault: boolean;
}

interface Site {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  description?: string;
  notes?: string;
  client?: Client;
  clientId?: string;
  organization?: { id: string; name: string };
  assignedUser?: User;
  assignedUserId?: string;
  sla?: SLA;
  slaId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Organization {
  id: string;
  name: string;
}

const SITE_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'under_construction', label: 'Under Construction' },
  { value: 'decommissioned', label: 'Decommissioned' },
];

const SITE_TYPES = [
  { value: 'commercial', label: 'Commercial' },
  { value: 'residential', label: 'Residential' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'retail', label: 'Retail' },
  { value: 'other', label: 'Other' },
];

// Toast component
const Toast = ({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-in-right">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
        type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
      }`}>
        {type === 'success' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-80">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function SitesPage() {
  const { selectedOrganization } = useOrganizationStore();
  const { user, isSuperAdmin } = useAuthStore();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leadTechnicians, setLeadTechnicians] = useState<User[]>([]);
  const [slas, setSLAs] = useState<SLA[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Get organization ID - for non-super-admin, use their company ID
  const getOrganizationId = () => {
    if (isSuperAdmin()) {
      return selectedOrganization?.id || '';
    }
    return user?.company?.id || selectedOrganization?.id || '';
  };

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'commercial',
    status: 'active',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    latitude: '',
    longitude: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
    notes: '',
    clientId: '',
    slaId: '',
    organizationId: '',
  });

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingSite, setDeletingSite] = useState<Site | null>(null);

  // Detail drawer
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningSite, setAssigningSite] = useState<Site | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchSites();
    fetchOrganizations();
    fetchClients();
    fetchLeadTechnicians();
    fetchSLAs();
  }, [selectedOrganization]);

  const fetchSites = async () => {
    try {
      const params: Record<string, string> = {};
      const orgId = getOrganizationId();
      if (orgId) {
        params.organizationId = orgId;
      }
      const response = await api.get('/sites', { params });
      const data = response.data?.data || response.data || [];
      setSites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching sites:', error);
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/organizations');
      const data = response.data?.data || response.data || [];
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const params: Record<string, string> = {};
      const orgId = getOrganizationId();
      if (orgId) {
        params.organizationId = orgId;
      }
      const response = await api.get('/clients', { params });
      const data = response.data?.data || response.data || [];
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchLeadTechnicians = async () => {
    try {
      // Fetch users and filter by "Lead Technical" role
      const response = await api.get('/users');
      const data = response.data?.data || response.data || [];
      const users = Array.isArray(data) ? data : [];
      // Filter users with "Lead Technical" or "Lead Technician" role (case insensitive)
      const leads = users.filter((u: User) =>
        u.role?.name?.toLowerCase().includes('lead') &&
        u.role?.name?.toLowerCase().includes('technic')
      );
      setLeadTechnicians(leads);
    } catch (error) {
      console.error('Error fetching lead technicians:', error);
    }
  };

  const fetchSLAs = async () => {
    try {
      const params: Record<string, string> = {};
      const orgId = getOrganizationId();
      if (orgId) {
        params.organizationId = orgId;
      }
      // Also filter by client if one is selected
      if (formData.clientId) {
        params.clientId = formData.clientId;
      }
      const response = await api.get('/sla', { params });
      const data = response.data?.data || response.data || [];
      setSLAs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching SLAs:', error);
      setSLAs([]);
    }
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      code: '',
      type: 'commercial',
      status: 'active',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      latitude: '',
      longitude: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      description: '',
      notes: '',
      clientId: '',
      slaId: '',
      organizationId: getOrganizationId(),
    });
    setModalError('');
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (site: Site) => {
    setEditingSite(site);
    setFormData({
      name: site.name || '',
      code: site.code || '',
      type: site.type || 'commercial',
      status: site.status || 'active',
      address: site.address || '',
      city: site.city || '',
      state: site.state || '',
      country: site.country || '',
      postalCode: site.postalCode || '',
      latitude: site.latitude?.toString() || '',
      longitude: site.longitude?.toString() || '',
      contactPerson: site.contactPerson || '',
      contactEmail: site.contactEmail || '',
      contactPhone: site.contactPhone || '',
      description: site.description || '',
      notes: site.notes || '',
      clientId: site.clientId || site.client?.id || '',
      slaId: site.slaId || site.sla?.id || '',
      organizationId: site.organization?.id || getOrganizationId(),
    });
    setModalError('');
    setModalMode('edit');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError('');

    try {
      const payload = {
        name: formData.name,
        type: formData.type,
        status: formData.status,
        organizationId: formData.organizationId,
        ...(formData.code && { code: formData.code }),
        ...(formData.address && { address: formData.address }),
        ...(formData.city && { city: formData.city }),
        ...(formData.state && { state: formData.state }),
        ...(formData.country && { country: formData.country }),
        ...(formData.postalCode && { postalCode: formData.postalCode }),
        ...(formData.latitude && { latitude: parseFloat(formData.latitude) }),
        ...(formData.longitude && { longitude: parseFloat(formData.longitude) }),
        ...(formData.contactPerson && { contactPerson: formData.contactPerson }),
        ...(formData.contactEmail && { contactEmail: formData.contactEmail }),
        ...(formData.contactPhone && { contactPhone: formData.contactPhone }),
        ...(formData.description && { description: formData.description }),
        ...(formData.notes && { notes: formData.notes }),
        ...(formData.clientId && { clientId: formData.clientId }),
        ...(formData.slaId && { slaId: formData.slaId }),
      };

      if (modalMode === 'create') {
        await api.post('/sites', payload);
        setToast({ message: 'Site created successfully', type: 'success' });
      } else {
        await api.patch(`/sites/${editingSite?.id}`, payload);
        setToast({ message: 'Site updated successfully', type: 'success' });
      }
      setShowModal(false);
      fetchSites();
    } catch (error: any) {
      console.error('Error saving site:', error);
      setModalError(error.response?.data?.message || 'Failed to save site');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (site: Site) => {
    setDeletingSite(site);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingSite) return;
    setDeleting(true);

    try {
      await api.delete(`/sites/${deletingSite.id}`);
      setShowDeleteModal(false);
      setDeletingSite(null);
      setToast({ message: 'Site deleted successfully', type: 'success' });
      fetchSites();
    } catch (error: any) {
      console.error('Error deleting site:', error);
      setToast({ message: error.response?.data?.message || 'Failed to delete site', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const openDetailDrawer = (site: Site) => {
    setSelectedSite(site);
    setShowDetailDrawer(true);
  };

  // Assign modal functions
  const openAssignModal = (site: Site) => {
    setAssigningSite(site);
    setSelectedUserId(site.assignedUserId || '');
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!assigningSite) return;
    setAssigning(true);

    try {
      await api.patch(`/sites/${assigningSite.id}/assign`, {
        assignedUserId: selectedUserId || null,
      });
      setShowAssignModal(false);
      setAssigningSite(null);
      setToast({ message: 'Site assigned successfully', type: 'success' });
      fetchSites();
    } catch (error: any) {
      console.error('Error assigning site:', error);
      setToast({ message: error.response?.data?.message || 'Failed to assign site', type: 'error' });
    } finally {
      setAssigning(false);
    }
  };

  // Filters
  const filteredSites = useMemo(() => {
    return sites.filter(site => {
      const matchesSearch = !searchTerm ||
        site.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        site.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = !typeFilter || site.type === typeFilter;
      const matchesStatus = !statusFilter || site.status === statusFilter;
      const matchesClient = !clientFilter || site.client?.id === clientFilter;

      return matchesSearch && matchesType && matchesStatus && matchesClient;
    });
  }, [sites, searchTerm, typeFilter, statusFilter, clientFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredSites.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSites = filteredSites.slice(startIndex, startIndex + itemsPerPage);

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'under_construction': return 'bg-yellow-100 text-yellow-800';
      case 'decommissioned': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500 text-sm">Loading sites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Site Management</h2>
          <p className="text-gray-600">Manage your sites and locations</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Site
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name, code, city..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <select
            value={clientFilter}
            onChange={(e) => { setClientFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {SITE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {SITE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedSites.map((site) => (
                <tr key={site.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetailDrawer(site)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{site.code || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{site.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{site.client?.name || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 capitalize">
                      {site.type?.replace('_', ' ') || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusStyle(site.status)}`}>
                      {site.status?.replace('_', ' ') || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {site.assignedUser ? `${site.assignedUser.firstName} ${site.assignedUser.lastName}` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{site.city || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openDetailDrawer(site)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button onClick={() => openEditModal(site)} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => openAssignModal(site)} className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg" title="Assign Lead Technical">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      </button>
                      <button onClick={() => openDeleteModal(site)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {paginatedSites.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-sm font-medium text-gray-900">No sites found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new site</p>
          </div>
        )}

        {filteredSites.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSites.length)} of {filteredSites.length}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Previous</button>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{modalMode === 'create' ? 'Add New Site' : 'Edit Site'}</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-200">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{modalError}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" placeholder="Auto-generated if empty" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                  <select required value={formData.clientId} onChange={(e) => {
                    const newClientId = e.target.value;
                    setFormData({...formData, clientId: newClientId, slaId: ''});
                    // Refetch SLAs for this client
                    if (newClientId) {
                      api.get('/sla/by-client/' + newClientId).then(res => {
                        const data = res.data?.data || res.data || [];
                        setSLAs(Array.isArray(data) ? data : []);
                      }).catch(() => setSLAs([]));
                    }
                  }} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SLA</label>
                  <select value={formData.slaId} onChange={(e) => setFormData({...formData, slaId: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="">Select SLA</option>
                    {slas.filter(s => s.isDefault || s.isDefault === undefined || (formData.clientId && true)).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.isDefault ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm">
                    {SITE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm">
                    {SITE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2 border-t pt-4 mt-2">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Location</h4>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input type="text" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input type="text" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                  <input type="text" value={formData.postalCode} onChange={(e) => setFormData({...formData, postalCode: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                  <input type="number" step="any" value={formData.latitude} onChange={(e) => setFormData({...formData, latitude: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                  <input type="number" step="any" value={formData.longitude} onChange={(e) => setFormData({...formData, longitude: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="col-span-2 border-t pt-4 mt-2">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input type="text" value={formData.contactPerson} onChange={(e) => setFormData({...formData, contactPerson: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input type="email" value={formData.contactEmail} onChange={(e) => setFormData({...formData, contactEmail: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input type="text" value={formData.contactPhone} onChange={(e) => setFormData({...formData, contactPhone: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                {isSuperAdmin() && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                    <select required value={formData.organizationId} onChange={(e) => setFormData({...formData, organizationId: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm">
                      <option value="">Select organization</option>
                      {organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
                    </select>
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
            </form>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} onClick={handleSubmit} className="px-5 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : (modalMode === 'create' ? 'Create Site' : 'Save Changes')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Assign Modal */}
      {showAssignModal && assigningSite && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowAssignModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Assign Lead Technical</h3>
              <p className="text-gray-600 mb-4">Assign a Lead Technical to <strong>{assigningSite.name}</strong></p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Lead Technical</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 text-sm"
                >
                  <option value="">Unassigned</option>
                  {leadTechnicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.firstName} {tech.lastName} ({tech.email})
                    </option>
                  ))}
                </select>
                {leadTechnicians.length === 0 && (
                  <p className="mt-2 text-sm text-amber-600">No Lead Technical users found in the system.</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleAssign} disabled={assigning} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50">
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingSite && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Site</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete <strong>{deletingSite.name}</strong>?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Detail Drawer */}
      {showDetailDrawer && selectedSite && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowDetailDrawer(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedSite.name}</h3>
                <p className="text-sm text-gray-500">{selectedSite.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowDetailDrawer(false); openEditModal(selectedSite); }} className="p-2 hover:bg-green-50 rounded-lg" title="Edit">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => setShowDetailDrawer(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Type:</span> <span className="capitalize">{selectedSite.type?.replace('_', ' ')}</span></div>
                  <div><span className="text-gray-500">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusStyle(selectedSite.status)}`}>{selectedSite.status?.replace('_', ' ')}</span></div>
                  <div><span className="text-gray-500">Client:</span> {selectedSite.client?.name || '-'}</div>
                  <div><span className="text-gray-500">Assigned To:</span> {selectedSite.assignedUser ? `${selectedSite.assignedUser.firstName} ${selectedSite.assignedUser.lastName}` : '-'}</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Location</h4>
                <div className="text-sm text-gray-700">
                  {selectedSite.address && <p>{selectedSite.address}</p>}
                  <p>{[selectedSite.city, selectedSite.state, selectedSite.postalCode].filter(Boolean).join(', ')}</p>
                  {selectedSite.country && <p>{selectedSite.country}</p>}
                  {(selectedSite.latitude || selectedSite.longitude) && (
                    <p className="mt-2 text-gray-500">
                      Coordinates: {selectedSite.latitude}, {selectedSite.longitude}
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Contact Person:</span> {selectedSite.contactPerson || '-'}</div>
                  <div><span className="text-gray-500">Contact Email:</span> {selectedSite.contactEmail || '-'}</div>
                  <div><span className="text-gray-500">Contact Phone:</span> {selectedSite.contactPhone || '-'}</div>
                </div>
              </div>
              {selectedSite.description && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-sm text-gray-700">{selectedSite.description}</p>
                </div>
              )}
              {selectedSite.notes && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-700">{selectedSite.notes}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
