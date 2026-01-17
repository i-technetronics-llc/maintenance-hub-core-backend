import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useOrganizationStore } from '../store/organizationStore';

interface SLASubItem {
  name: string;
  description?: string;
  targetValue?: number;
  metricUnit?: string;
  isRequired: boolean;
}

interface SLA {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category: string;
  status: string;
  targetValue?: number;
  metricUnit: string;
  warningThreshold?: number;
  criticalThreshold?: number;
  penaltyPercentage?: number;
  escalationDays?: number;
  responseTimeHours?: number;
  resolutionTimeHours?: number;
  subItems?: SLASubItem[];
  priorityResponseTimes?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
  clientId?: string;
  client?: { id: string; name: string };
  organizationId?: string;
  organization?: { id: string; name: string };
  effectiveFrom?: string;
  effectiveTo?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  name: string;
}

const SLA_CATEGORIES = [
  { value: 'power_availability', label: 'Power Availability' },
  { value: 'ppm_completion', label: 'PPM Completion' },
  { value: 'cmc_completion', label: 'CMC Completion' },
  { value: 'grid_performance', label: 'Grid Performance' },
  { value: 'grid_fault_maintenance', label: 'Grid Fault Maintenance' },
  { value: 'general_housekeeping', label: 'General Housekeeping' },
  { value: 'response_time', label: 'Response Time' },
  { value: 'resolution_time', label: 'Resolution Time' },
  { value: 'uptime', label: 'Uptime' },
  { value: 'other', label: 'Other' },
];

const SLA_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'draft', label: 'Draft' },
];

const METRIC_UNITS = [
  { value: 'percentage', label: 'Percentage (%)' },
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'minutes', label: 'Minutes' },
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

export const SLAManagementPage = () => {
  const { selectedOrganization } = useOrganizationStore();
  const [slas, setSLAs] = useState<SLA[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
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
  const [editingSLA, setEditingSLA] = useState<SLA | null>(null);

  // Detail drawer
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedSLA, setSelectedSLA] = useState<SLA | null>(null);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingSLA, setDeletingSLA] = useState<SLA | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'other',
    status: 'active',
    targetValue: '',
    metricUnit: 'percentage',
    warningThreshold: '',
    criticalThreshold: '',
    penaltyPercentage: '',
    escalationDays: '',
    responseTimeHours: '',
    resolutionTimeHours: '',
    clientId: '',
    effectiveFrom: '',
    effectiveTo: '',
    isDefault: false,
    subItems: [] as SLASubItem[],
  });

  // Sub-item input
  const [newSubItem, setNewSubItem] = useState({
    name: '',
    description: '',
    targetValue: '',
    metricUnit: 'percentage',
    isRequired: true,
  });

  useEffect(() => {
    loadData();
  }, [selectedOrganization]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedOrganization?.id) {
        params.organizationId = selectedOrganization.id;
      }

      // Load SLAs
      const slasResponse = await api.get('/sla', { params });
      const slasData = slasResponse.data?.data || slasResponse.data || [];
      setSLAs(Array.isArray(slasData) ? slasData : []);

      // Load clients
      try {
        const clientsResponse = await api.get('/clients', { params });
        const clientsData = clientsResponse.data?.data || clientsResponse.data || [];
        setClients(Array.isArray(clientsData) ? clientsData : []);
      } catch {
        setClients([]);
      }
    } catch (error) {
      console.error('Failed to load SLAs:', error);
      setSLAs([]);
    } finally {
      setLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      category: 'other',
      status: 'active',
      targetValue: '',
      metricUnit: 'percentage',
      warningThreshold: '',
      criticalThreshold: '',
      penaltyPercentage: '',
      escalationDays: '',
      responseTimeHours: '',
      resolutionTimeHours: '',
      clientId: '',
      effectiveFrom: '',
      effectiveTo: '',
      isDefault: false,
      subItems: [],
    });
    setNewSubItem({
      name: '',
      description: '',
      targetValue: '',
      metricUnit: 'percentage',
      isRequired: true,
    });
  };

  const openCreateModal = () => {
    resetFormData();
    setModalError('');
    setModalMode('create');
    setEditingSLA(null);
    setShowModal(true);
  };

  const openEditModal = (sla: SLA) => {
    setEditingSLA(sla);
    setFormData({
      name: sla.name || '',
      code: sla.code || '',
      description: sla.description || '',
      category: sla.category || 'other',
      status: sla.status || 'active',
      targetValue: sla.targetValue?.toString() || '',
      metricUnit: sla.metricUnit || 'percentage',
      warningThreshold: sla.warningThreshold?.toString() || '',
      criticalThreshold: sla.criticalThreshold?.toString() || '',
      penaltyPercentage: sla.penaltyPercentage?.toString() || '',
      escalationDays: sla.escalationDays?.toString() || '',
      responseTimeHours: sla.responseTimeHours?.toString() || '',
      resolutionTimeHours: sla.resolutionTimeHours?.toString() || '',
      clientId: sla.clientId || '',
      effectiveFrom: sla.effectiveFrom ? sla.effectiveFrom.split('T')[0] : '',
      effectiveTo: sla.effectiveTo ? sla.effectiveTo.split('T')[0] : '',
      isDefault: sla.isDefault || false,
      subItems: sla.subItems || [],
    });
    setModalError('');
    setModalMode('edit');
    setShowModal(true);
  };

  const handleAddSubItem = () => {
    if (newSubItem.name.trim()) {
      setFormData({
        ...formData,
        subItems: [
          ...formData.subItems,
          {
            name: newSubItem.name.trim(),
            description: newSubItem.description || undefined,
            targetValue: newSubItem.targetValue ? parseFloat(newSubItem.targetValue) : undefined,
            metricUnit: newSubItem.metricUnit,
            isRequired: newSubItem.isRequired,
          },
        ],
      });
      setNewSubItem({
        name: '',
        description: '',
        targetValue: '',
        metricUnit: 'percentage',
        isRequired: true,
      });
    }
  };

  const handleRemoveSubItem = (index: number) => {
    setFormData({
      ...formData,
      subItems: formData.subItems.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError('');

    try {
      const payload: any = {
        name: formData.name,
        category: formData.category,
        status: formData.status,
        metricUnit: formData.metricUnit,
        organizationId: selectedOrganization?.id,
        isDefault: formData.isDefault,
      };

      if (formData.code) payload.code = formData.code;
      if (formData.description) payload.description = formData.description;
      if (formData.targetValue) payload.targetValue = parseFloat(formData.targetValue);
      if (formData.warningThreshold) payload.warningThreshold = parseFloat(formData.warningThreshold);
      if (formData.criticalThreshold) payload.criticalThreshold = parseFloat(formData.criticalThreshold);
      if (formData.penaltyPercentage) payload.penaltyPercentage = parseFloat(formData.penaltyPercentage);
      if (formData.escalationDays) payload.escalationDays = parseInt(formData.escalationDays);
      if (formData.responseTimeHours) payload.responseTimeHours = parseInt(formData.responseTimeHours);
      if (formData.resolutionTimeHours) payload.resolutionTimeHours = parseInt(formData.resolutionTimeHours);
      if (formData.clientId) payload.clientId = formData.clientId;
      if (formData.effectiveFrom) payload.effectiveFrom = formData.effectiveFrom;
      if (formData.effectiveTo) payload.effectiveTo = formData.effectiveTo;
      if (formData.subItems.length > 0) payload.subItems = formData.subItems;

      if (modalMode === 'create') {
        await api.post('/sla', payload);
        setToast({ message: 'SLA created successfully', type: 'success' });
      } else {
        await api.patch(`/sla/${editingSLA?.id}`, payload);
        setToast({ message: 'SLA updated successfully', type: 'success' });
      }

      setShowModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving SLA:', error);
      setModalError(error.response?.data?.message || 'Failed to save SLA');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (sla: SLA) => {
    setDeletingSLA(sla);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingSLA) return;
    setDeleting(true);

    try {
      await api.delete(`/sla/${deletingSLA.id}`);
      setShowDeleteModal(false);
      setDeletingSLA(null);
      setToast({ message: 'SLA deleted successfully', type: 'success' });
      loadData();
    } catch (error: any) {
      console.error('Error deleting SLA:', error);
      setToast({ message: error.response?.data?.message || 'Failed to delete SLA', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const found = SLA_CATEGORIES.find(c => c.value === category);
    return found ? found.label : category;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-600';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getMetricUnitLabel = (unit: string) => {
    switch (unit) {
      case 'percentage':
        return '%';
      case 'hours':
        return 'hrs';
      case 'days':
        return 'days';
      case 'minutes':
        return 'min';
      default:
        return unit;
    }
  };

  // Filtering
  const filteredSLAs = useMemo(() => {
    return slas.filter(sla => {
      const matchesSearch = !searchTerm ||
        sla.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sla.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sla.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || sla.category === categoryFilter;
      const matchesStatus = !statusFilter || sla.status === statusFilter;
      const matchesClient = !clientFilter || sla.clientId === clientFilter || (clientFilter === 'default' && sla.isDefault);
      return matchesSearch && matchesCategory && matchesStatus && matchesClient;
    });
  }, [slas, searchTerm, categoryFilter, statusFilter, clientFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredSLAs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredSLAs.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SLA Management</h1>
              <p className="text-sm text-gray-500">Manage Service Level Agreements for your clients</p>
            </div>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create SLA
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Total SLAs</p>
            <p className="text-2xl font-bold text-gray-900">{slas.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{slas.filter(s => s.status === 'active').length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Default Templates</p>
            <p className="text-2xl font-bold text-blue-600">{slas.filter(s => s.isDefault).length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Client-Specific</p>
            <p className="text-2xl font-bold text-purple-600">{slas.filter(s => s.clientId).length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Search SLAs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {SLA_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {SLA_STATUSES.map(st => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Clients</option>
                <option value="default">Default Templates</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Code</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Category</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Target</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Client</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedData.map((sla) => (
                <tr key={sla.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{sla.code || '-'}</td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{sla.name}</p>
                      {sla.isDefault && (
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Default</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{getCategoryLabel(sla.category)}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {sla.targetValue ? `${sla.targetValue}${getMetricUnitLabel(sla.metricUnit)}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">{sla.client?.name || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(sla.status)}`}>
                      {sla.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedSLA(sla);
                          setShowDetailDrawer(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openEditModal(sla)}
                        className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {!sla.isDefault && (
                        <button
                          onClick={() => openDeleteModal(sla)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSLAs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No SLAs found
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredSLAs.length)} of {filteredSLAs.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'create' ? 'Create New SLA' : 'Edit SLA'}
                </h3>
                <p className="text-sm text-gray-500">
                  {modalMode === 'create' ? 'Define a new Service Level Agreement' : 'Modify the SLA details'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-200">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{modalError}</div>
              )}

              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">SLA Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Power Availability SLA"
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="Auto-generated if empty"
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <select
                      value={formData.clientId}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">None (Template)</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {SLA_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {SLA_STATUSES.map(st => (
                        <option key={st.value} value={st.value}>{st.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the SLA requirements..."
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Target Metrics */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Target Metrics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Value</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.targetValue}
                      onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                      placeholder="e.g., 99.9"
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Metric Unit</label>
                    <select
                      value={formData.metricUnit}
                      onChange={(e) => setFormData({ ...formData, metricUnit: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {METRIC_UNITS.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warning Threshold</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.warningThreshold}
                      onChange={(e) => setFormData({ ...formData, warningThreshold: e.target.value })}
                      placeholder="e.g., 95"
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Critical Threshold</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.criticalThreshold}
                      onChange={(e) => setFormData({ ...formData, criticalThreshold: e.target.value })}
                      placeholder="e.g., 90"
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Response Time (hrs)</label>
                    <input
                      type="number"
                      value={formData.responseTimeHours}
                      onChange={(e) => setFormData({ ...formData, responseTimeHours: e.target.value })}
                      placeholder="e.g., 4"
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Time (hrs)</label>
                    <input
                      type="number"
                      value={formData.resolutionTimeHours}
                      onChange={(e) => setFormData({ ...formData, resolutionTimeHours: e.target.value })}
                      placeholder="e.g., 24"
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Validity Period */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Validity Period</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Effective From</label>
                    <input
                      type="date"
                      value={formData.effectiveFrom}
                      onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Effective To</label>
                    <input
                      type="date"
                      value={formData.effectiveTo}
                      onChange={(e) => setFormData({ ...formData, effectiveTo: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Sub-Items */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">SLA Sub-Items</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-6 gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={newSubItem.name}
                        onChange={(e) => setNewSubItem({ ...newSubItem, name: e.target.value })}
                        placeholder="Sub-item name"
                        className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        value={newSubItem.targetValue}
                        onChange={(e) => setNewSubItem({ ...newSubItem, targetValue: e.target.value })}
                        placeholder="Target"
                        className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <select
                        value={newSubItem.metricUnit}
                        onChange={(e) => setNewSubItem({ ...newSubItem, metricUnit: e.target.value })}
                        className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        {METRIC_UNITS.map(u => (
                          <option key={u.value} value={u.value}>{u.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={newSubItem.isRequired}
                          onChange={(e) => setNewSubItem({ ...newSubItem, isRequired: e.target.checked })}
                          className="rounded"
                        />
                        Required
                      </label>
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={handleAddSubItem}
                        className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  {formData.subItems.length > 0 && (
                    <div className="space-y-2">
                      {formData.subItems.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <span className="flex-1 text-sm text-gray-700">{item.name}</span>
                          {item.targetValue && (
                            <span className="text-sm text-gray-500">
                              {item.targetValue}{getMetricUnitLabel(item.metricUnit || 'percentage')}
                            </span>
                          )}
                          {item.isRequired && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Required</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveSubItem(index)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                onClick={handleSubmit}
                className="px-5 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : modalMode === 'create' ? 'Create SLA' : 'Save Changes'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detail Drawer */}
      {showDetailDrawer && selectedSLA && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowDetailDrawer(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedSLA.name}</h3>
                  <p className="text-sm text-gray-500">{selectedSLA.code}</p>
                </div>
                <button onClick={() => setShowDetailDrawer(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <p className="text-gray-900">{getCategoryLabel(selectedSLA.category)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(selectedSLA.status)}`}>
                    {selectedSLA.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Target</p>
                  <p className="text-gray-900">
                    {selectedSLA.targetValue ? `${selectedSLA.targetValue}${getMetricUnitLabel(selectedSLA.metricUnit)}` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Client</p>
                  <p className="text-gray-900">{selectedSLA.client?.name || 'Template'}</p>
                </div>
                {selectedSLA.responseTimeHours && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Response Time</p>
                    <p className="text-gray-900">{selectedSLA.responseTimeHours} hours</p>
                  </div>
                )}
                {selectedSLA.resolutionTimeHours && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Resolution Time</p>
                    <p className="text-gray-900">{selectedSLA.resolutionTimeHours} hours</p>
                  </div>
                )}
              </div>

              {selectedSLA.description && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                  <p className="text-gray-700">{selectedSLA.description}</p>
                </div>
              )}

              {selectedSLA.subItems && selectedSLA.subItems.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Sub-Items</p>
                  <div className="space-y-2">
                    {selectedSLA.subItems.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <div className="flex items-center gap-2">
                            {item.targetValue && (
                              <span className="text-sm text-gray-600">
                                {item.targetValue}{getMetricUnitLabel(item.metricUnit || 'percentage')}
                              </span>
                            )}
                            {item.isRequired && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Required</span>
                            )}
                          </div>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailDrawer(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  openEditModal(selectedSLA);
                  setShowDetailDrawer(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingSLA && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete SLA</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{deletingSLA.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SLAManagementPage;
