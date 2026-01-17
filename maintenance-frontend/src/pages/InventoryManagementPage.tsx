import { useState, useEffect, useRef } from 'react';
import { inventoryApi, Inventory, companyApi, Company, inventoryMasterApi, InventoryLocation, Manufacturer, Supplier } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useOrganizationStore } from '../store/organizationStore';

interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning';
  message: string;
}

const CATEGORIES = [
  { value: 'spare_parts', label: 'Spare Parts' },
  { value: 'consumables', label: 'Consumables' },
  { value: 'tools', label: 'Tools' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'safety', label: 'Safety' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'mechanical', label: 'Mechanical' },
  { value: 'other', label: 'Other' },
];

const STATUSES = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
  { value: 'low_stock', label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'out_of_stock', label: 'Out of Stock', color: 'bg-red-100 text-red-700' },
  { value: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-700' },
  { value: 'discontinued', label: 'Discontinued', color: 'bg-gray-100 text-gray-700' },
];

export const InventoryManagementPage = () => {
  const { isSuperAdmin } = useAuthStore();
  const { selectedOrganization } = useOrganizationStore();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Dropdown data state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  // Dropdown search/filter state
  const [supplierSearch, setSupplierSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [manufacturerSearch, setManufacturerSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showManufacturerDropdown, setShowManufacturerDropdown] = useState(false);

  // Edit modal dropdown state
  const [editSupplierSearch, setEditSupplierSearch] = useState('');
  const [editLocationSearch, setEditLocationSearch] = useState('');
  const [editManufacturerSearch, setEditManufacturerSearch] = useState('');
  const [showEditSupplierDropdown, setShowEditSupplierDropdown] = useState(false);
  const [showEditLocationDropdown, setShowEditLocationDropdown] = useState(false);
  const [showEditManufacturerDropdown, setShowEditManufacturerDropdown] = useState(false);

  // Refs for click outside detection
  const supplierRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const manufacturerRef = useRef<HTMLDivElement>(null);
  const editSupplierRef = useRef<HTMLDivElement>(null);
  const editLocationRef = useRef<HTMLDivElement>(null);
  const editManufacturerRef = useRef<HTMLDivElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Create modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState<Partial<Inventory> & { companyId?: string }>({
    name: '',
    sku: '',
    description: '',
    category: 'other',
    quantity: 0,
    minQuantity: 10,
    maxQuantity: 100,
    unit: 'pieces',
    unitPrice: 0,
    location: '',
    supplier: '',
    manufacturer: '',
    partNumber: '',
    companyId: '',
  });

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Inventory>>({});

  // View modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<Inventory | null>(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Inventory | null>(null);

  // Column ordering state - include company column for super admin
  const [columnOrder, setColumnOrder] = useState(
    isSuperAdmin()
      ? ['sku', 'name', 'company', 'category', 'quantity', 'status', 'location', 'actions']
      : ['sku', 'name', 'category', 'quantity', 'status', 'location', 'actions']
  );

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    fetchData();
    if (isSuperAdmin()) {
      fetchCompanies();
    }
    // Fetch dropdown data
    fetchDropdownData();
  }, [currentPage, itemsPerPage, searchTerm, categoryFilter, statusFilter, companyFilter, selectedOrganization]);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierRef.current && !supplierRef.current.contains(event.target as Node)) {
        setShowSupplierDropdown(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
      if (manufacturerRef.current && !manufacturerRef.current.contains(event.target as Node)) {
        setShowManufacturerDropdown(false);
      }
      if (editSupplierRef.current && !editSupplierRef.current.contains(event.target as Node)) {
        setShowEditSupplierDropdown(false);
      }
      if (editLocationRef.current && !editLocationRef.current.contains(event.target as Node)) {
        setShowEditLocationDropdown(false);
      }
      if (editManufacturerRef.current && !editManufacturerRef.current.contains(event.target as Node)) {
        setShowEditManufacturerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [suppliersData, locationsData, manufacturersData] = await Promise.all([
        inventoryMasterApi.suppliers.getAll(),
        inventoryMasterApi.locations.getAll(),
        inventoryMasterApi.manufacturers.getAll(),
      ]);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
      setManufacturers(Array.isArray(manufacturersData) ? manufacturersData : []);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companyApi.getAll();
      const data = response?.data;
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching companies:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      // Use selected organization for super admin, or fall back to company filter
      const orgId = selectedOrganization?.id || companyFilter || undefined;

      const response = await inventoryApi.getAll({
        search: searchTerm,
        category: categoryFilter,
        status: statusFilter,
        companyId: orgId,
        page: currentPage,
        limit: itemsPerPage,
      });
      setInventory(response.data || []);
      setTotalItems(response.meta?.total || 0);
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      showToast('error', err.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  // Toast notification function
  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Create handlers
  const handleOpenCreateModal = () => {
    setCreateFormData({
      name: '',
      sku: '',
      description: '',
      category: 'other',
      quantity: 0,
      minQuantity: 10,
      maxQuantity: 100,
      unit: 'pieces',
      unitPrice: 0,
      location: '',
      supplier: '',
      manufacturer: '',
      partNumber: '',
      companyId: '',
    });
    // Reset search states for dropdowns
    setSupplierSearch('');
    setLocationSearch('');
    setManufacturerSearch('');
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateFormData({});
  };

  const handleCreateInventory = async () => {
    if (!createFormData.name?.trim()) {
      showToast('error', 'Item name is required');
      return;
    }

    setSaving(true);
    try {
      await inventoryApi.create(createFormData);
      showToast('success', `Inventory item "${createFormData.name}" created successfully`);
      handleCloseCreateModal();
      await fetchData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to create inventory item');
    } finally {
      setSaving(false);
    }
  };

  // Edit handlers
  const handleEditItem = (item: Inventory) => {
    setEditingItem(item);
    setEditFormData({
      name: item.name,
      sku: item.sku,
      description: item.description,
      category: item.category,
      quantity: item.quantity,
      minQuantity: item.minQuantity,
      maxQuantity: item.maxQuantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      location: item.location,
      supplier: item.supplier,
      manufacturer: item.manufacturer,
      partNumber: item.partNumber,
      notes: item.notes,
    });
    // Set search states to current values for dropdowns
    setEditSupplierSearch(item.supplier || '');
    setEditLocationSearch(item.location || '');
    setEditManufacturerSearch(item.manufacturer || '');
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
    setEditFormData({});
  };

  const handleUpdateInventory = async () => {
    if (!editFormData.name?.trim()) {
      showToast('error', 'Item name is required');
      return;
    }

    if (!editingItem) return;

    setSaving(true);
    try {
      await inventoryApi.update(editingItem.id, editFormData);
      showToast('success', `Inventory item "${editFormData.name}" updated successfully`);
      handleCloseEditModal();
      await fetchData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update inventory item');
    } finally {
      setSaving(false);
    }
  };

  // View handlers
  const handleViewItem = (item: Inventory) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setViewingItem(null);
  };

  // Delete handlers
  const handleDeleteItem = (item: Inventory) => {
    setItemToDelete(item);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      await inventoryApi.delete(itemToDelete.id);
      showToast('success', `Inventory item "${itemToDelete.name}" deleted successfully`);
      setShowDeleteConfirm(false);
      setItemToDelete(null);
      await fetchData();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to delete inventory item');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  // Column helpers
  const moveColumn = (fromIndex: number, toIndex: number) => {
    const newOrder = [...columnOrder];
    const [removed] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, removed);
    setColumnOrder(newOrder);
  };

  const getColumnLabel = (col: string) => {
    const labels: { [key: string]: string } = {
      sku: 'SKU',
      name: 'Name',
      company: 'Company',
      category: 'Category',
      quantity: 'Quantity',
      status: 'Status',
      location: 'Location',
      actions: 'Actions',
    };
    return labels[col] || col;
  };

  const getStatusBadge = (status: string) => {
    const statusObj = STATUSES.find(s => s.value === status);
    return statusObj || { value: status, label: status, color: 'bg-gray-100 text-gray-700' };
  };

  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.label || category;
  };

  // Filtered dropdown items
  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(supplierSearch.toLowerCase())
  );
  const filteredLocations = locations.filter(l =>
    l.name.toLowerCase().includes(locationSearch.toLowerCase())
  );
  const filteredManufacturers = manufacturers.filter(m =>
    m.name.toLowerCase().includes(manufacturerSearch.toLowerCase())
  );

  // Edit modal filtered dropdown items
  const editFilteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(editSupplierSearch.toLowerCase())
  );
  const editFilteredLocations = locations.filter(l =>
    l.name.toLowerCase().includes(editLocationSearch.toLowerCase())
  );
  const editFilteredManufacturers = manufacturers.filter(m =>
    m.name.toLowerCase().includes(editManufacturerSearch.toLowerCase())
  );

  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="p-6 w-full">
      {/* Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header Section */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search inventory..."
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              {/* Organization Filter - Super Admin Only */}
              {isSuperAdmin() && companies.length > 0 && (
                <select
                  value={companyFilter}
                  onChange={(e) => {
                    setCompanyFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All Organizations</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              )}

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {STATUSES.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>

              <span className="text-sm text-gray-600">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
              <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
              >
                + Add Inventory
              </button>
            </div>
          </div>
        </div>

        {/* Table View */}
        {inventory.length > 0 ? (
          <div>
            {/* Table Toolbar */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-end gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    {columnOrder.map((col, index) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
                      >
                        <div className="flex items-center gap-2">
                          <span>{getColumnLabel(col)}</span>
                          {index > 0 && (
                            <button
                              onClick={() => moveColumn(index, index - 1)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Move left"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                          )}
                          {index < columnOrder.length - 1 && (
                            <button
                              onClick={() => moveColumn(index, index + 1)}
                              className="text-gray-400 hover:text-gray-600"
                              title="Move right"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {inventory.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-gray-200 hover:bg-gray-50"
                    >
                      {columnOrder.map((col) => (
                        <td key={col} className="px-4 py-3 text-sm">
                          {col === 'sku' && (
                            <span className="font-mono text-gray-600">{item.sku}</span>
                          )}
                          {col === 'name' && (
                            <span className="font-medium text-gray-900">{item.name}</span>
                          )}
                          {col === 'company' && (
                            <span className="text-gray-600">{(item as any).company?.name || '-'}</span>
                          )}
                          {col === 'category' && (
                            <span className="inline-block px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                              {getCategoryLabel(item.category)}
                            </span>
                          )}
                          {col === 'quantity' && (
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${item.quantity <= item.minQuantity ? 'text-red-600' : 'text-gray-900'}`}>
                                {item.quantity}
                              </span>
                              {item.unit && <span className="text-gray-500 text-xs">{item.unit}</span>}
                            </div>
                          )}
                          {col === 'status' && (
                            <span className={`inline-block px-2 py-1 text-xs rounded ${getStatusBadge(item.status).color}`}>
                              {getStatusBadge(item.status).label}
                            </span>
                          )}
                          {col === 'location' && (
                            <span className="text-gray-600">{item.location || '-'}</span>
                          )}
                          {col === 'actions' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleViewItem(item)}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="View Details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                                title="Edit Item"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item)}
                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Delete Item"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No inventory items found</h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchTerm || categoryFilter || statusFilter ? 'No items match your filters' : 'Get started by adding your first inventory item'}
            </p>
            {!searchTerm && !categoryFilter && !statusFilter && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
              >
                + Add Inventory Item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Create Modal - Slide from Right */}
      {isCreateModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={handleCloseCreateModal}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg animate-slide-in-right">
            <div className="h-full bg-white shadow-lg flex flex-col">
              <div className="px-5 py-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Add New Inventory</h2>
                  <p className="text-sm text-gray-600 mt-1">Add a new item to your inventory</p>
                </div>
                <button
                  onClick={handleCloseCreateModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6">
                <div className="space-y-4">
                  {/* Company Selection for Super Admin */}
                  {isSuperAdmin() && companies.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={createFormData.companyId || ''}
                        onChange={(e) => setCreateFormData({ ...createFormData, companyId: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select a company</option>
                        {companies.map(company => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={createFormData.name || ''}
                        onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                        placeholder="Item name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                      <input
                        type="text"
                        value={createFormData.sku || ''}
                        onChange={(e) => setCreateFormData({ ...createFormData, sku: e.target.value })}
                        placeholder="Auto-generated if empty"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={createFormData.description || ''}
                      onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                      placeholder="Item description"
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={createFormData.category || 'other'}
                        onChange={(e) => setCreateFormData({ ...createFormData, category: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <input
                        type="text"
                        value={createFormData.unit || ''}
                        onChange={(e) => setCreateFormData({ ...createFormData, unit: e.target.value })}
                        placeholder="e.g., pieces, kg, liters"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={createFormData.quantity || 0}
                        onChange={(e) => setCreateFormData({ ...createFormData, quantity: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Qty</label>
                      <input
                        type="number"
                        value={createFormData.minQuantity || 0}
                        onChange={(e) => setCreateFormData({ ...createFormData, minQuantity: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Qty</label>
                      <input
                        type="number"
                        value={createFormData.maxQuantity || 0}
                        onChange={(e) => setCreateFormData({ ...createFormData, maxQuantity: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                      <input
                        type="number"
                        value={createFormData.unitPrice || 0}
                        onChange={(e) => setCreateFormData({ ...createFormData, unitPrice: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div ref={locationRef} className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={locationSearch || createFormData.location || ''}
                          onChange={(e) => {
                            setLocationSearch(e.target.value);
                            setShowLocationDropdown(true);
                          }}
                          onFocus={() => setShowLocationDropdown(true)}
                          placeholder="Search location..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {showLocationDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                          {filteredLocations.length > 0 ? (
                            filteredLocations.map((loc) => (
                              <button
                                key={loc.id}
                                type="button"
                                onClick={() => {
                                  setCreateFormData({ ...createFormData, location: loc.name });
                                  setLocationSearch(loc.name);
                                  setShowLocationDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${createFormData.location === loc.name ? 'bg-blue-100' : ''}`}
                              >
                                {loc.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No locations found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div ref={supplierRef} className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={supplierSearch || createFormData.supplier || ''}
                          onChange={(e) => {
                            setSupplierSearch(e.target.value);
                            setShowSupplierDropdown(true);
                          }}
                          onFocus={() => setShowSupplierDropdown(true)}
                          placeholder="Search supplier..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {showSupplierDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                          {filteredSuppliers.length > 0 ? (
                            filteredSuppliers.map((sup) => (
                              <button
                                key={sup.id}
                                type="button"
                                onClick={() => {
                                  setCreateFormData({ ...createFormData, supplier: sup.name });
                                  setSupplierSearch(sup.name);
                                  setShowSupplierDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${createFormData.supplier === sup.name ? 'bg-blue-100' : ''}`}
                              >
                                {sup.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No suppliers found</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div ref={manufacturerRef} className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={manufacturerSearch || createFormData.manufacturer || ''}
                          onChange={(e) => {
                            setManufacturerSearch(e.target.value);
                            setShowManufacturerDropdown(true);
                          }}
                          onFocus={() => setShowManufacturerDropdown(true)}
                          placeholder="Search manufacturer..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {showManufacturerDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                          {filteredManufacturers.length > 0 ? (
                            filteredManufacturers.map((mfr) => (
                              <button
                                key={mfr.id}
                                type="button"
                                onClick={() => {
                                  setCreateFormData({ ...createFormData, manufacturer: mfr.name });
                                  setManufacturerSearch(mfr.name);
                                  setShowManufacturerDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${createFormData.manufacturer === mfr.name ? 'bg-blue-100' : ''}`}
                              >
                                {mfr.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No manufacturers found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                    <input
                      type="text"
                      value={createFormData.partNumber || ''}
                      onChange={(e) => setCreateFormData({ ...createFormData, partNumber: e.target.value })}
                      placeholder="Manufacturer part number"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-gray-200 bg-white flex items-center justify-end gap-2 flex-shrink-0">
                <button
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateInventory}
                  disabled={saving || !createFormData.name?.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal - Slide from Right */}
      {isEditModalOpen && editingItem && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={handleCloseEditModal}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg animate-slide-in-right">
            <div className="h-full bg-white shadow-lg flex flex-col">
              <div className="px-5 py-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Edit Inventory Item</h2>
                  <p className="text-sm text-gray-600 mt-1">Update item information</p>
                </div>
                <button
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editFormData.name || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                      <input
                        type="text"
                        value={editFormData.sku || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editFormData.description || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={editFormData.category || 'other'}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <input
                        type="text"
                        value={editFormData.unit || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        type="number"
                        value={editFormData.quantity || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, quantity: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Qty</label>
                      <input
                        type="number"
                        value={editFormData.minQuantity || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, minQuantity: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Qty</label>
                      <input
                        type="number"
                        value={editFormData.maxQuantity || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, maxQuantity: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price</label>
                      <input
                        type="number"
                        value={editFormData.unitPrice || 0}
                        onChange={(e) => setEditFormData({ ...editFormData, unitPrice: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div ref={editLocationRef} className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={editLocationSearch || editFormData.location || ''}
                          onChange={(e) => {
                            setEditLocationSearch(e.target.value);
                            setShowEditLocationDropdown(true);
                          }}
                          onFocus={() => setShowEditLocationDropdown(true)}
                          placeholder="Search location..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {showEditLocationDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                          {editFilteredLocations.length > 0 ? (
                            editFilteredLocations.map((loc) => (
                              <button
                                key={loc.id}
                                type="button"
                                onClick={() => {
                                  setEditFormData({ ...editFormData, location: loc.name });
                                  setEditLocationSearch(loc.name);
                                  setShowEditLocationDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${editFormData.location === loc.name ? 'bg-blue-100' : ''}`}
                              >
                                {loc.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No locations found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div ref={editSupplierRef} className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={editSupplierSearch || editFormData.supplier || ''}
                          onChange={(e) => {
                            setEditSupplierSearch(e.target.value);
                            setShowEditSupplierDropdown(true);
                          }}
                          onFocus={() => setShowEditSupplierDropdown(true)}
                          placeholder="Search supplier..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {showEditSupplierDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                          {editFilteredSuppliers.length > 0 ? (
                            editFilteredSuppliers.map((sup) => (
                              <button
                                key={sup.id}
                                type="button"
                                onClick={() => {
                                  setEditFormData({ ...editFormData, supplier: sup.name });
                                  setEditSupplierSearch(sup.name);
                                  setShowEditSupplierDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${editFormData.supplier === sup.name ? 'bg-blue-100' : ''}`}
                              >
                                {sup.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No suppliers found</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div ref={editManufacturerRef} className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={editManufacturerSearch || editFormData.manufacturer || ''}
                          onChange={(e) => {
                            setEditManufacturerSearch(e.target.value);
                            setShowEditManufacturerDropdown(true);
                          }}
                          onFocus={() => setShowEditManufacturerDropdown(true)}
                          placeholder="Search manufacturer..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {showEditManufacturerDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto">
                          {editFilteredManufacturers.length > 0 ? (
                            editFilteredManufacturers.map((mfr) => (
                              <button
                                key={mfr.id}
                                type="button"
                                onClick={() => {
                                  setEditFormData({ ...editFormData, manufacturer: mfr.name });
                                  setEditManufacturerSearch(mfr.name);
                                  setShowEditManufacturerDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${editFormData.manufacturer === mfr.name ? 'bg-blue-100' : ''}`}
                              >
                                {mfr.name}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-gray-500">No manufacturers found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Part Number</label>
                    <input
                      type="text"
                      value={editFormData.partNumber || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, partNumber: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={editFormData.notes || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="px-5 py-3 border-t border-gray-200 bg-white flex items-center justify-end gap-2 flex-shrink-0">
                <button
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateInventory}
                  disabled={saving || !editFormData.name?.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Updating...' : 'Update Item'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* View Modal - Slide from Right */}
      {isViewModalOpen && viewingItem && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            onClick={handleCloseViewModal}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg animate-slide-in-right">
            <div className="h-full bg-white shadow-lg flex flex-col">
              <div className="px-5 py-4 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Inventory Details</h2>
                  <p className="text-sm text-gray-600 mt-1">{viewingItem.sku}</p>
                </div>
                <button
                  onClick={handleCloseViewModal}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{viewingItem.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{viewingItem.description || 'No description'}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`inline-block px-3 py-1 text-sm rounded ${getStatusBadge(viewingItem.status).color}`}>
                      {getStatusBadge(viewingItem.status).label}
                    </span>
                    <span className="inline-block px-3 py-1 text-sm rounded bg-blue-100 text-blue-700">
                      {getCategoryLabel(viewingItem.category)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-500">Current Quantity</p>
                      <p className="text-2xl font-bold text-gray-900">{viewingItem.quantity} <span className="text-sm font-normal">{viewingItem.unit}</span></p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded">
                      <p className="text-sm text-gray-500">Unit Price</p>
                      <p className="text-2xl font-bold text-gray-900">${viewingItem.unitPrice?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Stock Levels</h4>
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Min</p>
                        <p className="font-medium">{viewingItem.minQuantity}</p>
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 rounded">
                        <div
                          className={`h-full rounded ${viewingItem.quantity <= viewingItem.minQuantity ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, (viewingItem.quantity / viewingItem.maxQuantity) * 100)}%` }}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Max</p>
                        <p className="font-medium">{viewingItem.maxQuantity}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Details</h4>
                    <dl className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm text-gray-500">Location</dt>
                        <dd className="font-medium">{viewingItem.location || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Supplier</dt>
                        <dd className="font-medium">{viewingItem.supplier || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Manufacturer</dt>
                        <dd className="font-medium">{viewingItem.manufacturer || '-'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Part Number</dt>
                        <dd className="font-medium">{viewingItem.partNumber || '-'}</dd>
                      </div>
                    </dl>
                  </div>

                  {viewingItem.notes && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                      <p className="text-sm text-gray-600">{viewingItem.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-gray-200 bg-white flex items-center justify-end gap-2 flex-shrink-0">
                <button
                  onClick={handleCloseViewModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleCloseViewModal();
                    handleEditItem(viewingItem);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                >
                  Edit Item
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Toast */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed top-4 right-4 z-50 min-w-[400px] max-w-md animate-slide-in-right">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-red-900">Confirm Deletion</h3>
                <p className="text-sm text-red-800 mt-1">
                  Are you sure you want to delete <span className="font-semibold">"{itemToDelete.name}"</span>? This action cannot be undone.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Yes, Delete
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <button
                onClick={handleCancelDelete}
                className="flex-shrink-0 text-red-400 hover:text-red-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded shadow-lg flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in-right ${
              toast.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : toast.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
            }`}
          >
            {toast.type === 'success' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {toast.type === 'warning' && (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-current hover:opacity-70"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
