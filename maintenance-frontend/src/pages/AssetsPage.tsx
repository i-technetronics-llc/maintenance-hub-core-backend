import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useOrganizationStore } from '../store/organizationStore';

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  criticality?: number;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installedDate?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  organization?: { id: string; name: string };
  location?: { locationName: string };
  createdAt?: string;
  updatedAt?: string;
}

interface Organization {
  id: string;
  name: string;
}

const ASSET_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'under_maintenance', label: 'Under Maintenance' },
  { value: 'decommissioned', label: 'Decommissioned' },
];

const ASSET_TYPES = [
  'HVAC',
  'Electrical',
  'Plumbing',
  'Manufacturing',
  'Safety',
  'IT Equipment',
  'Furniture',
  'Vehicle',
  'Other',
];

// Toast component for notifications
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
        {type === 'error' ? (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export default function AssetsPage() {
  const navigate = useNavigate();
  const { selectedOrganization } = useOrganizationStore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newAsset, setNewAsset] = useState({
    name: '',
    assetCode: '',
    type: '',
    description: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    status: 'active',
    organizationId: '',
  });

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState('');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    assetCode: '',
    type: '',
    description: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    status: 'active',
    organizationId: '',
  });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);

  // Detail drawer state
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchAssets();
    fetchOrganizations();
  }, [selectedOrganization]);

  const fetchAssets = async () => {
    try {
      const params: Record<string, string> = {};
      if (selectedOrganization?.id) {
        params.organizationId = selectedOrganization.id;
      }
      const response = await api.get('/assets', { params });
      const data = response.data?.data || response.data || [];
      setAssets(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching assets:', error);
      setAssets([]);
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

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    try {
      const payload = {
        name: newAsset.name,
        type: newAsset.type,
        organizationId: newAsset.organizationId || (selectedOrganization?.id || ''),
        ...(newAsset.assetCode && { assetCode: newAsset.assetCode }),
        ...(newAsset.manufacturer && { manufacturer: newAsset.manufacturer }),
        ...(newAsset.model && { model: newAsset.model }),
        ...(newAsset.serialNumber && { serialNumber: newAsset.serialNumber }),
        ...(newAsset.status && { status: newAsset.status }),
      };

      await api.post('/assets', payload);
      setShowCreateModal(false);
      setNewAsset({
        name: '',
        assetCode: '',
        type: '',
        description: '',
        manufacturer: '',
        model: '',
        serialNumber: '',
        status: 'active',
        organizationId: '',
      });
      fetchAssets();
    } catch (error: any) {
      console.error('Error creating asset:', error);
      setCreateError(error.response?.data?.message || 'Failed to create asset');
    } finally {
      setCreating(false);
    }
  };

  const openCreateModal = () => {
    setNewAsset({
      name: '',
      assetCode: '',
      type: '',
      description: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      status: 'active',
      organizationId: selectedOrganization?.id || '',
    });
    setCreateError('');
    setShowCreateModal(true);
  };

  // Edit asset handlers
  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setEditFormData({
      name: asset.name || '',
      assetCode: asset.assetCode || '',
      type: asset.type || '',
      description: asset.description || '',
      manufacturer: asset.manufacturer || '',
      model: asset.model || '',
      serialNumber: asset.serialNumber || '',
      status: asset.status || 'active',
      organizationId: asset.organization?.id || '',
    });
    setEditError('');
    setShowEditModal(true);
  };

  const handleEditAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset) return;

    setEditing(true);
    setEditError('');

    try {
      const payload = {
        name: editFormData.name,
        type: editFormData.type,
        ...(editFormData.assetCode && { assetCode: editFormData.assetCode }),
        ...(editFormData.description && { description: editFormData.description }),
        ...(editFormData.manufacturer && { manufacturer: editFormData.manufacturer }),
        ...(editFormData.model && { model: editFormData.model }),
        ...(editFormData.serialNumber && { serialNumber: editFormData.serialNumber }),
        ...(editFormData.status && { status: editFormData.status }),
      };

      await api.patch(`/assets/${editingAsset.id}`, payload);
      setShowEditModal(false);
      setEditingAsset(null);
      setToast({ message: 'Asset updated successfully', type: 'success' });
      fetchAssets();
    } catch (error: any) {
      console.error('Error updating asset:', error);
      setEditError(error.response?.data?.message || 'Failed to update asset');
    } finally {
      setEditing(false);
    }
  };

  // Delete asset handlers
  const openDeleteModal = (asset: Asset) => {
    setDeletingAsset(asset);
    setShowDeleteModal(true);
  };

  const handleDeleteAsset = async () => {
    if (!deletingAsset) return;

    setDeleting(true);

    try {
      await api.delete(`/assets/${deletingAsset.id}`);
      setShowDeleteModal(false);
      setDeletingAsset(null);
      setToast({ message: 'Asset deleted successfully', type: 'success' });
      fetchAssets();
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      setToast({ message: error.response?.data?.message || 'Failed to delete asset', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  // View asset detail
  const openDetailDrawer = async (asset: Asset) => {
    setSelectedAsset(asset);
    setShowDetailDrawer(true);
    setLoadingDetail(true);

    try {
      const response = await api.get(`/assets/${asset.id}`);
      setSelectedAsset(response.data?.data || response.data);
    } catch (error) {
      console.error('Error loading asset details:', error);
      // Keep the basic asset data we already have
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRowClick = (asset: Asset) => {
    openDetailDrawer(asset);
  };

  // Get unique values for filters
  const uniqueTypes = useMemo(() => {
    const types = [...new Set(assets.map(a => a.type).filter(Boolean))];
    return types.sort();
  }, [assets]);

  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(assets.map(a => a.status).filter(Boolean))];
    return statuses.sort();
  }, [assets]);

  const uniqueOrganizations = useMemo(() => {
    const orgs = [...new Set(assets.map(a => a.organization?.name).filter(Boolean))];
    return orgs.sort();
  }, [assets]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = !searchTerm ||
        asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.assetCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.model?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = !typeFilter || asset.type === typeFilter;
      const matchesStatus = !statusFilter || asset.status === statusFilter;
      const matchesOrg = !organizationFilter || asset.organization?.name === organizationFilter;

      return matchesSearch && matchesType && matchesStatus && matchesOrg;
    });
  }, [assets, searchTerm, typeFilter, statusFilter, organizationFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setStatusFilter('');
    setOrganizationFilter('');
    setCurrentPage(1);
  };

  const getStatusStyle = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'active' || statusLower === 'operational') {
      return 'bg-green-100 text-green-800';
    } else if (statusLower === 'under_maintenance' || statusLower === 'maintenance') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (statusLower === 'inactive' || statusLower === 'decommissioned') {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500 text-sm">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assets Management</h2>
          <p className="text-gray-600">Track and manage all your assets</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {filteredAssets.length} of {assets.length} assets
          </span>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Asset
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search Input with rounded corners */}
          <div className="lg:col-span-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search by name, code, S/N, manufacturer, model..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status?.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Organization Filter */}
          <div>
            <select
              value={organizationFilter}
              onChange={(e) => { setOrganizationFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Organizations</option>
              {uniqueOrganizations.map(org => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || typeFilter || statusFilter || organizationFilter) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Search: "{searchTerm}"
                <button onClick={() => setSearchTerm('')} className="ml-1.5 hover:text-blue-600">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            {typeFilter && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Type: {typeFilter}
                <button onClick={() => setTypeFilter('')} className="ml-1.5 hover:text-purple-600">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Status: {statusFilter?.replace(/_/g, ' ')}
                <button onClick={() => setStatusFilter('')} className="ml-1.5 hover:text-green-600">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            {organizationFilter && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Org: {organizationFilter}
                <button onClick={() => setOrganizationFilter('')} className="ml-1.5 hover:text-orange-600">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty Expiry</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedAssets.map((asset) => (
                <tr
                  key={asset.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(asset)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-blue-600">{asset.assetCode || '-'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {asset.type || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusStyle(asset.status)}`}>
                      {asset.status?.replace(/_/g, ' ') || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {asset.manufacturer || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {asset.model || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                    {asset.serialNumber || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {asset.organization?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(asset.warrantyExpiry)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      {/* View Button */}
                      <button
                        onClick={() => openDetailDrawer(asset)}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {/* Edit Button */}
                      <button
                        onClick={() => openEditModal(asset)}
                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Delete Button */}
                      <button
                        onClick={() => openDeleteModal(asset)}
                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
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

        {/* Empty State */}
        {paginatedAssets.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assets found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || typeFilter || statusFilter || organizationFilter
                ? 'Try adjusting your search or filter criteria'
                : 'Get started by adding a new asset'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredAssets.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredAssets.length)}</span> of{' '}
                <span className="font-medium">{filteredAssets.length}</span> results
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Asset Slide-in Modal */}
      {showCreateModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowCreateModal(false)}
          />

          {/* Slide-in Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 animate-slide-in-right overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create New Asset</h3>
                <p className="text-sm text-gray-500">Add a new asset to the system</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateAsset} className="flex-1 overflow-y-auto p-6 space-y-5">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {createError}
                </div>
              )}

              {/* Asset Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Asset Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAsset.name}
                  onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., Central Air Conditioning Unit"
                />
              </div>

              {/* Asset Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Asset Code
                </label>
                <input
                  type="text"
                  value={newAsset.assetCode}
                  onChange={(e) => setNewAsset({ ...newAsset, assetCode: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., HVAC-001"
                />
              </div>

              {/* Asset Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Asset Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={newAsset.type}
                  onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Select a type</option>
                  {ASSET_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Manufacturer and Model Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={newAsset.manufacturer}
                    onChange={(e) => setNewAsset({ ...newAsset, manufacturer: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., Carrier"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Model
                  </label>
                  <input
                    type="text"
                    value={newAsset.model}
                    onChange={(e) => setNewAsset({ ...newAsset, model: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., XL-2000"
                  />
                </div>
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={newAsset.serialNumber}
                  onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                  placeholder="e.g., SN-12345678"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <select
                  value={newAsset.status}
                  onChange={(e) => setNewAsset({ ...newAsset, status: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {ASSET_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              {/* Organization */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Organization <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={newAsset.organizationId}
                  onChange={(e) => setNewAsset({ ...newAsset, organizationId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Select an organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                onClick={handleCreateAsset}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Asset'
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit Asset Slide-in Modal */}
      {showEditModal && editingAsset && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowEditModal(false)}
          />

          {/* Slide-in Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 animate-slide-in-right overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Edit Asset</h3>
                <p className="text-sm text-gray-500">Update asset information</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEditAsset} className="flex-1 overflow-y-auto p-6 space-y-5">
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {editError}
                </div>
              )}

              {/* Asset Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Asset Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., Central Air Conditioning Unit"
                />
              </div>

              {/* Asset Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Asset Code
                </label>
                <input
                  type="text"
                  value={editFormData.assetCode}
                  onChange={(e) => setEditFormData({ ...editFormData, assetCode: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., HVAC-001"
                />
              </div>

              {/* Asset Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Asset Type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={editFormData.type}
                  onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Select a type</option>
                  {ASSET_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Enter asset description..."
                />
              </div>

              {/* Manufacturer and Model Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={editFormData.manufacturer}
                    onChange={(e) => setEditFormData({ ...editFormData, manufacturer: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., Carrier"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Model
                  </label>
                  <input
                    type="text"
                    value={editFormData.model}
                    onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="e.g., XL-2000"
                  />
                </div>
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={editFormData.serialNumber}
                  onChange={(e) => setEditFormData({ ...editFormData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                  placeholder="e.g., SN-12345678"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {ASSET_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editing}
                onClick={handleEditAsset}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {editing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingAsset && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Asset</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">{deletingAsset.name}</span>
                {deletingAsset.assetCode && <span className="text-gray-500"> ({deletingAsset.assetCode})</span>}?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingAsset(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAsset}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center"
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Asset Detail Drawer */}
      {showDetailDrawer && selectedAsset && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowDetailDrawer(false)}
          />

          {/* Slide-in Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50 animate-slide-in-right overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{selectedAsset.name}</h3>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getStatusStyle(selectedAsset.status)}`}>
                    {selectedAsset.status?.replace(/_/g, ' ') || '-'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedAsset.assetCode && <span className="font-mono">{selectedAsset.assetCode}</span>}
                  {selectedAsset.assetCode && selectedAsset.type && ' • '}
                  {selectedAsset.type}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    setShowDetailDrawer(false);
                    openEditModal(selectedAsset);
                  }}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setShowDetailDrawer(false);
                    navigate(`/assets/${selectedAsset.id}`);
                  }}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Open Full Page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowDetailDrawer(false)}
                  className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Asset Code</p>
                        <p className="text-sm font-medium text-gray-900 font-mono">{selectedAsset.assetCode || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Type</p>
                        <p className="text-sm font-medium text-gray-900">{selectedAsset.type || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Manufacturer</p>
                        <p className="text-sm font-medium text-gray-900">{selectedAsset.manufacturer || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Model</p>
                        <p className="text-sm font-medium text-gray-900">{selectedAsset.model || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Serial Number</p>
                        <p className="text-sm font-medium text-gray-900 font-mono">{selectedAsset.serialNumber || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Organization</p>
                        <p className="text-sm font-medium text-gray-900">{selectedAsset.organization?.name || '-'}</p>
                      </div>
                    </div>
                    {selectedAsset.description && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
                        <p className="text-sm text-gray-700">{selectedAsset.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Financial & Warranty */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Financial & Warranty
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Purchase Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedAsset.purchaseDate ? new Date(selectedAsset.purchaseDate).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Purchase Price</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedAsset.purchasePrice ? `$${selectedAsset.purchasePrice.toLocaleString()}` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Warranty Expiry</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedAsset.warrantyExpiry ? new Date(selectedAsset.warrantyExpiry).toLocaleDateString() : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Installed Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedAsset.installedDate ? new Date(selectedAsset.installedDate).toLocaleDateString() : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="bg-gray-50 rounded-xl p-5">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Record Information
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Created</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedAsset.createdAt ? new Date(selectedAsset.createdAt).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Last Updated</p>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedAsset.updatedAt ? new Date(selectedAsset.updatedAt).toLocaleString() : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowDetailDrawer(false);
                  openDeleteModal(selectedAsset);
                }}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Delete Asset
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowDetailDrawer(false)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailDrawer(false);
                    navigate(`/assets/${selectedAsset.id}`);
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
                >
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
