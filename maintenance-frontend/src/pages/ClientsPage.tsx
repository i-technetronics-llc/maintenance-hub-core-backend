import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useOrganizationStore } from '../store/organizationStore';
import { useAuthStore } from '../store/authStore';

interface Client {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  organization?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

interface Organization {
  id: string;
  name: string;
}

const CLIENT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
];

const CLIENT_TYPES = [
  { value: 'individual', label: 'Individual' },
  { value: 'business', label: 'Business' },
  { value: 'government', label: 'Government' },
  { value: 'non_profit', label: 'Non-Profit' },
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

export default function ClientsPage() {
  const { selectedOrganization } = useOrganizationStore();
  const { user, isSuperAdmin } = useAuthStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'business',
    status: 'active',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    notes: '',
    organizationId: '',
  });

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  // Detail drawer
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
    fetchOrganizations();
  }, [selectedOrganization]);

  const fetchClients = async () => {
    try {
      const params: Record<string, string> = {};
      if (selectedOrganization?.id) {
        params.organizationId = selectedOrganization.id;
      }
      const response = await api.get('/clients', { params });
      const data = response.data?.data || response.data || [];
      setClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
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

  const openCreateModal = () => {
    setFormData({
      name: '',
      code: '',
      type: 'business',
      status: 'active',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      notes: '',
      organizationId: getOrganizationId(),
    });
    setModalError('');
    setModalMode('create');
    setShowModal(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name || '',
      code: client.code || '',
      type: client.type || 'business',
      status: client.status || 'active',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      country: client.country || '',
      postalCode: client.postalCode || '',
      contactPerson: client.contactPerson || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
      notes: client.notes || '',
      organizationId: client.organization?.id || '',
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
        ...(formData.email && { email: formData.email }),
        ...(formData.phone && { phone: formData.phone }),
        ...(formData.address && { address: formData.address }),
        ...(formData.city && { city: formData.city }),
        ...(formData.state && { state: formData.state }),
        ...(formData.country && { country: formData.country }),
        ...(formData.postalCode && { postalCode: formData.postalCode }),
        ...(formData.contactPerson && { contactPerson: formData.contactPerson }),
        ...(formData.contactEmail && { contactEmail: formData.contactEmail }),
        ...(formData.contactPhone && { contactPhone: formData.contactPhone }),
        ...(formData.notes && { notes: formData.notes }),
      };

      if (modalMode === 'create') {
        await api.post('/clients', payload);
        setToast({ message: 'Client created successfully', type: 'success' });
      } else {
        await api.patch(`/clients/${editingClient?.id}`, payload);
        setToast({ message: 'Client updated successfully', type: 'success' });
      }
      setShowModal(false);
      fetchClients();
    } catch (error: any) {
      console.error('Error saving client:', error);
      setModalError(error.response?.data?.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (client: Client) => {
    setDeletingClient(client);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingClient) return;
    setDeleting(true);

    try {
      await api.delete(`/clients/${deletingClient.id}`);
      setShowDeleteModal(false);
      setDeletingClient(null);
      setToast({ message: 'Client deleted successfully', type: 'success' });
      fetchClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      setToast({ message: error.response?.data?.message || 'Failed to delete client', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const openDetailDrawer = (client: Client) => {
    setSelectedClient(client);
    setShowDetailDrawer(true);
  };

  // Filters
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = !searchTerm ||
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = !typeFilter || client.type === typeFilter;
      const matchesStatus = !statusFilter || client.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [clients, searchTerm, typeFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500 text-sm">Loading clients...</p>
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
          <h2 className="text-2xl font-bold text-gray-900">Client Management</h2>
          <p className="text-gray-600">Manage your clients and their information</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name, code, email..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {CLIENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {CLIENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetailDrawer(client)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{client.code || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 capitalize">
                      {client.type?.replace('_', ' ') || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusStyle(client.status)}`}>
                      {client.status || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.contactPerson || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.email || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{client.phone || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openDetailDrawer(client)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button onClick={() => openEditModal(client)} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => openDeleteModal(client)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
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

        {paginatedClients.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-sm font-medium text-gray-900">No clients found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by adding a new client</p>
          </div>
        )}

        {filteredClients.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredClients.length)} of {filteredClients.length}
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
                <h3 className="text-lg font-semibold text-gray-900">{modalMode === 'create' ? 'Add New Client' : 'Edit Client'}</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm">
                    {CLIENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm">
                    {CLIENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea rows={3} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>
            </form>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} onClick={handleSubmit} className="px-5 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Saving...' : (modalMode === 'create' ? 'Create Client' : 'Save Changes')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingClient && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Client</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete <strong>{deletingClient.name}</strong>?</p>
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
      {showDetailDrawer && selectedClient && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowDetailDrawer(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedClient.name}</h3>
                <p className="text-sm text-gray-500">{selectedClient.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowDetailDrawer(false); openEditModal(selectedClient); }} className="p-2 hover:bg-green-50 rounded-lg" title="Edit">
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
                  <div><span className="text-gray-500">Type:</span> <span className="capitalize">{selectedClient.type?.replace('_', ' ')}</span></div>
                  <div><span className="text-gray-500">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusStyle(selectedClient.status)}`}>{selectedClient.status}</span></div>
                  <div><span className="text-gray-500">Email:</span> {selectedClient.email || '-'}</div>
                  <div><span className="text-gray-500">Phone:</span> {selectedClient.phone || '-'}</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Address</h4>
                <div className="text-sm text-gray-700">
                  {selectedClient.address && <p>{selectedClient.address}</p>}
                  <p>{[selectedClient.city, selectedClient.state, selectedClient.postalCode].filter(Boolean).join(', ')}</p>
                  {selectedClient.country && <p>{selectedClient.country}</p>}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Contact Person:</span> {selectedClient.contactPerson || '-'}</div>
                  <div><span className="text-gray-500">Contact Email:</span> {selectedClient.contactEmail || '-'}</div>
                  <div><span className="text-gray-500">Contact Phone:</span> {selectedClient.contactPhone || '-'}</div>
                </div>
              </div>
              {selectedClient.notes && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Notes</h4>
                  <p className="text-sm text-gray-700">{selectedClient.notes}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
