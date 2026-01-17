import { useState, useEffect } from 'react';
import { inventoryMasterApi, InventoryLocation, companyApi, Company } from '../services/api';
import { useAuthStore } from '../store/authStore';

// Floating Toast Component
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

export function LocationsPage() {
  const { isSuperAdmin } = useAuthStore();
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingLocation, setEditingLocation] = useState<InventoryLocation | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingLocation, setDeletingLocation] = useState<InventoryLocation | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    address: '',
    building: '',
    floor: '',
    room: '',
    zone: '',
    aisle: '',
    rack: '',
    bin: '',
    isActive: true,
    companyId: '',
  });

  useEffect(() => {
    fetchLocations();
    if (isSuperAdmin()) {
      fetchCompanies();
    }
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await companyApi.getAll();
      const data = response?.data;
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const data = await inventoryMasterApi.locations.getAll();
      setLocations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch locations';
      setToast({ message, type: 'error' });
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLocation) {
        await inventoryMasterApi.locations.update(editingLocation.id, formData);
        setToast({ message: 'Location updated successfully', type: 'success' });
      } else {
        await inventoryMasterApi.locations.create(formData);
        setToast({ message: 'Location created successfully', type: 'success' });
      }
      setShowDrawer(false);
      resetForm();
      fetchLocations();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to save location';
      setToast({ message, type: 'error' });
    }
  };

  const handleEdit = (location: InventoryLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      code: location.code,
      description: location.description || '',
      address: location.address || '',
      building: location.building || '',
      floor: location.floor || '',
      room: location.room || '',
      zone: location.zone || '',
      aisle: location.aisle || '',
      rack: location.rack || '',
      bin: location.bin || '',
      isActive: location.isActive,
      companyId: (location as any).companyId || '',
    });
    setShowDrawer(true);
  };

  const handleDeleteClick = (location: InventoryLocation) => {
    setDeletingLocation(location);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingLocation) return;
    try {
      await inventoryMasterApi.locations.delete(deletingLocation.id);
      setToast({ message: 'Location deleted successfully', type: 'success' });
      setShowDeleteModal(false);
      setDeletingLocation(null);
      fetchLocations();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete location';
      setToast({ message, type: 'error' });
    }
  };

  const resetForm = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      address: '',
      building: '',
      floor: '',
      room: '',
      zone: '',
      aisle: '',
      rack: '',
      bin: '',
      isActive: true,
      companyId: '',
    });
  };

  const filteredLocations = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalItems = filteredLocations.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLocations = filteredLocations.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Floating Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Locations</h1>
        <button
          onClick={() => {
            resetForm();
            setShowDrawer(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Location
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <input
            type="text"
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-sm text-gray-600 ml-4">
            {totalItems} {totalItems === 1 ? 'location' : 'locations'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                {isSuperAdmin() && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Building</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={isSuperAdmin() ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : paginatedLocations.length === 0 ? (
                <tr>
                  <td colSpan={isSuperAdmin() ? 7 : 6} className="px-4 py-8 text-center text-gray-500">No locations found</td>
                </tr>
              ) : (
                paginatedLocations.map((location) => (
                  <tr key={location.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{location.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{location.code}</td>
                    {isSuperAdmin() && (
                      <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                        {(location as any).company?.name || '-'}
                      </td>
                    )}
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{location.building || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{location.zone || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${location.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {location.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(location)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(location)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalItems > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Rows per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600 ml-4">
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <span className="px-3 py-1 text-sm text-gray-600">
                Page {currentPage} of {totalPages || 1}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-in Drawer */}
      {showDrawer && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setShowDrawer(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 animate-slide-in-right">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingLocation ? 'Edit Location' : 'Add New Location'}
                </h2>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Organization Selection - Super Admin Only */}
                  {isSuperAdmin() && companies.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Organization</h3>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Company <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.companyId}
                          onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select a company</option>
                          {companies.map(company => (
                            <option key={company.id} value={company.id}>{company.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter location name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.code}
                          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., LOC-001"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter description (optional)"
                      />
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Address Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Street address"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                        <input
                          type="text"
                          value={formData.building}
                          onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Building name/number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Details */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Location Details</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                        <input
                          type="text"
                          value={formData.floor}
                          onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                        <input
                          type="text"
                          value={formData.room}
                          onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., 101"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                        <input
                          type="text"
                          value={formData.zone}
                          onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., A"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Storage Details */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Storage Details</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Aisle</label>
                        <input
                          type="text"
                          value={formData.aisle}
                          onChange={(e) => setFormData({ ...formData, aisle: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., A1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rack</label>
                        <input
                          type="text"
                          value={formData.rack}
                          onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., R1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bin</label>
                        <input
                          type="text"
                          value={formData.bin}
                          onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., B1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Status</h3>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Active location</span>
                    </label>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowDrawer(false)}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {editingLocation ? 'Update Location' : 'Create Location'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingLocation && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Location</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">{deletingLocation.name}</span>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletingLocation(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
