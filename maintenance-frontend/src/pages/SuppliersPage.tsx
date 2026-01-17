import { useState, useEffect } from 'react';
import { inventoryMasterApi, Supplier, companyApi, Company } from '../services/api';
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

export function SuppliersPage() {
  const { isSuperAdmin } = useAuthStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    website: '',
    email: '',
    phone: '',
    fax: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    taxId: '',
    paymentTerms: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    rating: 0,
    isActive: true,
    isPreferred: false,
    companyId: '',
  });

  useEffect(() => {
    fetchSuppliers();
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

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await inventoryMasterApi.suppliers.getAll();
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch suppliers';
      setToast({ message, type: 'error' });
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await inventoryMasterApi.suppliers.update(editingSupplier.id, formData);
        setToast({ message: 'Supplier updated successfully', type: 'success' });
      } else {
        await inventoryMasterApi.suppliers.create(formData);
        setToast({ message: 'Supplier created successfully', type: 'success' });
      }
      setShowDrawer(false);
      resetForm();
      fetchSuppliers();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to save supplier';
      setToast({ message, type: 'error' });
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      code: supplier.code,
      description: supplier.description || '',
      website: supplier.website || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      fax: supplier.fax || '',
      address: supplier.address || '',
      city: supplier.city || '',
      state: supplier.state || '',
      country: supplier.country || '',
      postalCode: supplier.postalCode || '',
      taxId: supplier.taxId || '',
      paymentTerms: supplier.paymentTerms || '',
      contactPerson: supplier.contactPerson || '',
      contactEmail: supplier.contactEmail || '',
      contactPhone: supplier.contactPhone || '',
      rating: supplier.rating || 0,
      isActive: supplier.isActive,
      isPreferred: supplier.isPreferred,
      companyId: (supplier as any).companyId || '',
    });
    setShowDrawer(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await inventoryMasterApi.suppliers.delete(id);
      setToast({ message: 'Supplier deleted successfully', type: 'success' });
      fetchSuppliers();
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to delete supplier';
      setToast({ message, type: 'error' });
    }
  };

  const resetForm = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      website: '',
      email: '',
      phone: '',
      fax: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      taxId: '',
      paymentTerms: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      rating: 0,
      isActive: true,
      isPreferred: false,
      companyId: '',
    });
  };

  const filteredSuppliers = suppliers.filter(
    (sup) =>
      sup.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sup.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalItems = filteredSuppliers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSuppliers = filteredSuppliers.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // View supplier details
  const handleViewSupplier = (supplier: Supplier) => {
    setViewingSupplier(supplier);
    setShowDetailDrawer(true);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
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
          Add Supplier
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="text-sm text-gray-600 ml-4">
            {totalItems} {totalItems === 1 ? 'supplier' : 'suppliers'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : paginatedSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No suppliers found</td>
                </tr>
              ) : (
                paginatedSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleViewSupplier(supplier)}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="font-medium text-gray-900 text-sm">{supplier.name}</div>
                        {supplier.isPreferred && (
                          <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">Preferred</span>
                        )}
                      </div>
                      {supplier.website && (
                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          {supplier.website}
                        </a>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-sm">{supplier.code}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-gray-900 text-sm">{supplier.contactPerson || '-'}</div>
                      <div className="text-xs text-gray-500">{supplier.email || supplier.contactEmail || '-'}</div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {supplier.rating ? renderStars(supplier.rating) : '-'}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEdit(supplier); }}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(supplier.id); }}
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
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
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
                          placeholder="Supplier name"
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
                          placeholder="e.g., SUP-001"
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

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                        <input
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="contact@example.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                        <input
                          type="tel"
                          value={formData.fax}
                          onChange={(e) => setFormData({ ...formData, fax: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Address</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Street address"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <input
                            type="text"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                          <input
                            type="text"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="State/Province"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                          <input
                            type="text"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Country"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                          <input
                            type="text"
                            value={formData.postalCode}
                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Postal/ZIP code"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Business Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                        <input
                          type="text"
                          value={formData.taxId}
                          onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Tax ID number"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                        <input
                          type="text"
                          value={formData.paymentTerms}
                          onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., Net 30"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.5"
                        value={formData.rating}
                        onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Primary Contact */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Primary Contact</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                        <input
                          type="text"
                          value={formData.contactPerson}
                          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Contact person name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                          <input
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="contact@example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                          <input
                            type="tel"
                            value={formData.contactPhone}
                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Status</h3>
                    <div className="space-y-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Active supplier</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isPreferred}
                          onChange={(e) => setFormData({ ...formData, isPreferred: e.target.checked })}
                          className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Preferred supplier</span>
                      </label>
                    </div>
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
                      {editingSupplier ? 'Update Supplier' : 'Create Supplier'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Supplier Detail Drawer */}
      {showDetailDrawer && viewingSupplier && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
            onClick={() => setShowDetailDrawer(false)}
          />

          {/* Detail Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 animate-slide-in-right">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{viewingSupplier.name}</h2>
                  <p className="text-sm text-gray-500">{viewingSupplier.code}</p>
                </div>
                <button
                  onClick={() => setShowDetailDrawer(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Status & Badges */}
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-sm rounded-full ${viewingSupplier.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {viewingSupplier.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {viewingSupplier.isPreferred && (
                      <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-full">Preferred Supplier</span>
                    )}
                  </div>

                  {/* Rating */}
                  {viewingSupplier.rating && viewingSupplier.rating > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Rating</h3>
                      <div className="flex items-center gap-2">
                        {renderStars(viewingSupplier.rating || 0)}
                        <span className="text-gray-600 text-sm">({viewingSupplier.rating}/5)</span>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {viewingSupplier.description && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-600">{viewingSupplier.description}</p>
                    </div>
                  )}

                  {/* Contact Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
                    <dl className="space-y-3">
                      {viewingSupplier.website && (
                        <div className="flex items-start gap-3">
                          <dt className="text-gray-500 min-w-[100px]">Website</dt>
                          <dd>
                            <a href={viewingSupplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              {viewingSupplier.website}
                            </a>
                          </dd>
                        </div>
                      )}
                      {viewingSupplier.email && (
                        <div className="flex items-start gap-3">
                          <dt className="text-gray-500 min-w-[100px]">Email</dt>
                          <dd>
                            <a href={`mailto:${viewingSupplier.email}`} className="text-blue-600 hover:underline">
                              {viewingSupplier.email}
                            </a>
                          </dd>
                        </div>
                      )}
                      {viewingSupplier.phone && (
                        <div className="flex items-start gap-3">
                          <dt className="text-gray-500 min-w-[100px]">Phone</dt>
                          <dd className="text-gray-900">{viewingSupplier.phone}</dd>
                        </div>
                      )}
                      {viewingSupplier.fax && (
                        <div className="flex items-start gap-3">
                          <dt className="text-gray-500 min-w-[100px]">Fax</dt>
                          <dd className="text-gray-900">{viewingSupplier.fax}</dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Address */}
                  {(viewingSupplier.address || viewingSupplier.city || viewingSupplier.country) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Address</h3>
                      <address className="text-gray-600 not-italic">
                        {viewingSupplier.address && <div>{viewingSupplier.address}</div>}
                        <div>
                          {[viewingSupplier.city, viewingSupplier.state, viewingSupplier.postalCode]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                        {viewingSupplier.country && <div>{viewingSupplier.country}</div>}
                      </address>
                    </div>
                  )}

                  {/* Primary Contact */}
                  {(viewingSupplier.contactPerson || viewingSupplier.contactEmail || viewingSupplier.contactPhone) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Primary Contact</h3>
                      <dl className="space-y-2">
                        {viewingSupplier.contactPerson && (
                          <div className="flex items-start gap-3">
                            <dt className="text-gray-500 min-w-[100px]">Name</dt>
                            <dd className="text-gray-900 font-medium">{viewingSupplier.contactPerson}</dd>
                          </div>
                        )}
                        {viewingSupplier.contactEmail && (
                          <div className="flex items-start gap-3">
                            <dt className="text-gray-500 min-w-[100px]">Email</dt>
                            <dd>
                              <a href={`mailto:${viewingSupplier.contactEmail}`} className="text-blue-600 hover:underline">
                                {viewingSupplier.contactEmail}
                              </a>
                            </dd>
                          </div>
                        )}
                        {viewingSupplier.contactPhone && (
                          <div className="flex items-start gap-3">
                            <dt className="text-gray-500 min-w-[100px]">Phone</dt>
                            <dd className="text-gray-900">{viewingSupplier.contactPhone}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {/* Business Information */}
                  {(viewingSupplier.taxId || viewingSupplier.paymentTerms) && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Business Information</h3>
                      <dl className="space-y-2">
                        {viewingSupplier.taxId && (
                          <div className="flex items-start gap-3">
                            <dt className="text-gray-500 min-w-[100px]">Tax ID</dt>
                            <dd className="text-gray-900">{viewingSupplier.taxId}</dd>
                          </div>
                        )}
                        {viewingSupplier.paymentTerms && (
                          <div className="flex items-start gap-3">
                            <dt className="text-gray-500 min-w-[100px]">Payment Terms</dt>
                            <dd className="text-gray-900">{viewingSupplier.paymentTerms}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowDetailDrawer(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetailDrawer(false);
                    handleEdit(viewingSupplier);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Supplier
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
