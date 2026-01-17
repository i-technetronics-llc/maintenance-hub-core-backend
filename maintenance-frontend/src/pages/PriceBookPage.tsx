import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { priceBookApi, inventoryApi, inventoryMasterApi, companyApi, PriceBook, PriceBookItem, Inventory, Service, Company } from '../services/api';
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

export function PriceBookPage() {
  const { organizationId } = useParams<{ organizationId?: string }>();
  useNavigate(); // Available for future navigation
  const { isSuperAdmin } = useAuthStore();

  const [priceBooks, setPriceBooks] = useState<PriceBook[]>([]);
  const [selectedPriceBook, setSelectedPriceBook] = useState<PriceBook | null>(null);
  const [priceBookItems, setPriceBookItems] = useState<PriceBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [inventoryList, setInventoryList] = useState<Inventory[]>([]);
  const [servicesList, setServicesList] = useState<Service[]>([]);

  // Modals
  const [showPriceBookDrawer, setShowPriceBookDrawer] = useState(false);
  const [showItemDrawer, setShowItemDrawer] = useState(false);
  const [editingPriceBook, setEditingPriceBook] = useState<PriceBook | null>(null);
  const [editingItem, setEditingItem] = useState<PriceBookItem | null>(null);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPriceBook, setDeletingPriceBook] = useState<PriceBook | null>(null);
  const [showDeleteItemModal, setShowDeleteItemModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<PriceBookItem | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form data for price book
  const [priceBookFormData, setPriceBookFormData] = useState({
    name: '',
    description: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    isDefault: false,
    isActive: true,
    organizationId: organizationId || '',
  });

  // Form data for price book item
  const [itemFormData, setItemFormData] = useState({
    itemType: 'inventory' as 'inventory' | 'service',
    itemId: '',
    name: '',
    description: '',
    sku: '',
    unitPrice: '',
    unit: '',
    effectiveDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    isActive: true,
  });

  useEffect(() => {
    fetchPriceBooks();
    fetchInventoryItems();
    fetchServices();
    if (isSuperAdmin()) {
      fetchCompanies();
    }
  }, [organizationId]);

  const fetchCompanies = async () => {
    try {
      const response = await companyApi.getAll({ limit: 100 });
      const data = response?.data || response || [];
      setCompanies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await inventoryApi.getAll({ limit: 500 });
      const data = response?.data || response || [];
      setInventoryList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const data = await inventoryMasterApi.services.getAll({ isActive: true });
      setServicesList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchPriceBooks = async () => {
    try {
      setLoading(true);
      const params = organizationId ? { organizationId } : {};
      const data = await priceBookApi.getAll(params);
      setPriceBooks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to fetch price books', type: 'error' });
      setPriceBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPriceBookItems = async (priceBookId: string) => {
    try {
      setItemsLoading(true);
      const data = await priceBookApi.items.getAll(priceBookId);
      setPriceBookItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to fetch price book items', type: 'error' });
      setPriceBookItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleSelectPriceBook = (priceBook: PriceBook) => {
    setSelectedPriceBook(priceBook);
    fetchPriceBookItems(priceBook.id);
  };

  const handleSubmitPriceBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPriceBook) {
        await priceBookApi.update(editingPriceBook.id, priceBookFormData);
        setToast({ message: 'Price book updated successfully', type: 'success' });
      } else {
        await priceBookApi.create(priceBookFormData);
        setToast({ message: 'Price book created successfully', type: 'success' });
      }
      setShowPriceBookDrawer(false);
      resetPriceBookForm();
      fetchPriceBooks();
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to save price book', type: 'error' });
    }
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPriceBook) return;

    try {
      const payload = {
        ...itemFormData,
        unitPrice: parseFloat(itemFormData.unitPrice) || 0,
      };

      if (editingItem) {
        await priceBookApi.items.update(selectedPriceBook.id, editingItem.id, payload);
        setToast({ message: 'Item updated successfully', type: 'success' });
      } else {
        await priceBookApi.items.create(selectedPriceBook.id, payload);
        setToast({ message: 'Item added successfully', type: 'success' });
      }
      setShowItemDrawer(false);
      resetItemForm();
      fetchPriceBookItems(selectedPriceBook.id);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to save item', type: 'error' });
    }
  };

  const handleEditPriceBook = (priceBook: PriceBook) => {
    setEditingPriceBook(priceBook);
    setPriceBookFormData({
      name: priceBook.name,
      description: priceBook.description || '',
      effectiveDate: priceBook.effectiveDate.split('T')[0],
      expiryDate: priceBook.expiryDate?.split('T')[0] || '',
      isDefault: priceBook.isDefault,
      isActive: priceBook.isActive,
      organizationId: priceBook.organizationId,
    });
    setShowPriceBookDrawer(true);
  };

  const handleEditItem = (item: PriceBookItem) => {
    setEditingItem(item);
    setItemFormData({
      itemType: item.itemType,
      itemId: item.itemId,
      name: item.name,
      description: item.description || '',
      sku: item.sku || '',
      unitPrice: item.unitPrice.toString(),
      unit: item.unit || '',
      effectiveDate: item.effectiveDate.split('T')[0],
      expiryDate: item.expiryDate?.split('T')[0] || '',
      isActive: item.isActive,
    });
    setShowItemDrawer(true);
  };

  const handleDeletePriceBook = async () => {
    if (!deletingPriceBook) return;
    try {
      await priceBookApi.delete(deletingPriceBook.id);
      setToast({ message: 'Price book deleted successfully', type: 'success' });
      setShowDeleteModal(false);
      setDeletingPriceBook(null);
      if (selectedPriceBook?.id === deletingPriceBook.id) {
        setSelectedPriceBook(null);
        setPriceBookItems([]);
      }
      fetchPriceBooks();
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to delete price book', type: 'error' });
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem || !selectedPriceBook) return;
    try {
      await priceBookApi.items.delete(selectedPriceBook.id, deletingItem.id);
      setToast({ message: 'Item deleted successfully', type: 'success' });
      setShowDeleteItemModal(false);
      setDeletingItem(null);
      fetchPriceBookItems(selectedPriceBook.id);
    } catch (err: any) {
      setToast({ message: err.response?.data?.message || 'Failed to delete item', type: 'error' });
    }
  };

  const resetPriceBookForm = () => {
    setEditingPriceBook(null);
    setPriceBookFormData({
      name: '',
      description: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      isDefault: false,
      isActive: true,
      organizationId: organizationId || '',
    });
  };

  const resetItemForm = () => {
    setEditingItem(null);
    setItemFormData({
      itemType: 'inventory',
      itemId: '',
      name: '',
      description: '',
      sku: '',
      unitPrice: '',
      unit: '',
      effectiveDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      isActive: true,
    });
  };

  const handleItemTypeChange = (itemType: 'inventory' | 'service') => {
    setItemFormData({ ...itemFormData, itemType, itemId: '', name: '', sku: '' });
  };

  const handleInventorySelect = (inventoryId: string) => {
    const item = inventoryList.find(i => i.id === inventoryId);
    if (item) {
      setItemFormData({
        ...itemFormData,
        itemId: item.id,
        name: item.name,
        description: item.description || '',
        sku: item.sku,
        unitPrice: item.unitPrice?.toString() || '',
        unit: item.unit || '',
      });
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    const service = servicesList.find(s => s.id === serviceId);
    if (service) {
      setItemFormData({
        ...itemFormData,
        itemId: service.id,
        name: service.name,
        description: service.description || '',
        sku: service.code,
        unitPrice: service.unitPrice?.toString() || '',
        unit: service.unit || '',
      });
    }
  };

  const filteredPriceBooks = priceBooks.filter(pb =>
    pb.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pb.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredItems = priceBookItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination for items
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Price Books</h1>
          <p className="text-gray-600 mt-1">Manage pricing for inventory items and services</p>
        </div>
        <button
          onClick={() => {
            resetPriceBookForm();
            setShowPriceBookDrawer(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Price Book
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Price Books List */}
        <div className="col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search price books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : filteredPriceBooks.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No price books found</div>
              ) : (
                filteredPriceBooks.map(priceBook => (
                  <div
                    key={priceBook.id}
                    onClick={() => handleSelectPriceBook(priceBook)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedPriceBook?.id === priceBook.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{priceBook.name}</h3>
                        {priceBook.organization && (
                          <p className="text-sm text-gray-500">{priceBook.organization.name}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Effective: {new Date(priceBook.effectiveDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {priceBook.isDefault && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">Default</span>
                        )}
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          priceBook.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {priceBook.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditPriceBook(priceBook); }}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingPriceBook(priceBook); setShowDeleteModal(true); }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Price Book Items */}
        <div className="col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {selectedPriceBook ? (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{selectedPriceBook.name}</h2>
                    <p className="text-sm text-gray-500">{selectedPriceBook.description || 'No description'}</p>
                  </div>
                  <button
                    onClick={() => {
                      resetItemForm();
                      setShowItemDrawer(true);
                    }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Item
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {itemsLoading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading items...</td>
                        </tr>
                      ) : paginatedItems.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                            No items in this price book. Click "Add Item" to add pricing.
                          </td>
                        </tr>
                      ) : (
                        paginatedItems.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">{item.description}</div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                item.itemType === 'inventory' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {item.itemType === 'inventory' ? 'Inventory' : 'Service'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{item.sku || '-'}</td>
                            <td className="px-4 py-3 text-gray-900 font-medium">
                              ${item.unitPrice.toFixed(2)}
                              {item.unit && <span className="text-gray-500 text-sm"> / {item.unit}</span>}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {item.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditItem(item)}
                                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => { setDeletingItem(item); setShowDeleteItemModal(true); }}
                                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
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
                    <span className="text-sm text-gray-600">
                      Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-4">Select a price book to view and manage items</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Price Book Drawer */}
      {showPriceBookDrawer && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowPriceBookDrawer(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 animate-slide-in-right">
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPriceBook ? 'Edit Price Book' : 'Create Price Book'}
                </h2>
                <button onClick={() => setShowPriceBookDrawer(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitPriceBook} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {isSuperAdmin() && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                      <select
                        value={priceBookFormData.organizationId}
                        onChange={(e) => setPriceBookFormData({ ...priceBookFormData, organizationId: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select organization</option>
                        {companies.map(company => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      required
                      value={priceBookFormData.name}
                      onChange={(e) => setPriceBookFormData({ ...priceBookFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Standard Price List 2024"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={priceBookFormData.description}
                      onChange={(e) => setPriceBookFormData({ ...priceBookFormData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date *</label>
                      <input
                        type="date"
                        required
                        value={priceBookFormData.effectiveDate}
                        onChange={(e) => setPriceBookFormData({ ...priceBookFormData, effectiveDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={priceBookFormData.expiryDate}
                        onChange={(e) => setPriceBookFormData({ ...priceBookFormData, expiryDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={priceBookFormData.isDefault}
                        onChange={(e) => setPriceBookFormData({ ...priceBookFormData, isDefault: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Set as default price book</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={priceBookFormData.isActive}
                        onChange={(e) => setPriceBookFormData({ ...priceBookFormData, isActive: e.target.checked })}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPriceBookDrawer(false)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {editingPriceBook ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Item Drawer */}
      {showItemDrawer && selectedPriceBook && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowItemDrawer(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 animate-slide-in-right">
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Edit Item' : 'Add Item to Price Book'}
                </h2>
                <button onClick={() => setShowItemDrawer(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmitItem} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Item Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleItemTypeChange('inventory')}
                        className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                          itemFormData.itemType === 'inventory'
                            ? 'bg-green-50 border-green-500 text-green-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Inventory Item
                      </button>
                      <button
                        type="button"
                        onClick={() => handleItemTypeChange('service')}
                        className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
                          itemFormData.itemType === 'service'
                            ? 'bg-purple-50 border-purple-500 text-purple-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Service
                      </button>
                    </div>
                  </div>

                  {/* Item Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select {itemFormData.itemType === 'inventory' ? 'Inventory Item' : 'Service'} *
                    </label>
                    {itemFormData.itemType === 'inventory' ? (
                      <select
                        value={itemFormData.itemId}
                        onChange={(e) => handleInventorySelect(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select an inventory item</option>
                        {inventoryList.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.sku}) - ${item.unitPrice || 0}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={itemFormData.itemId}
                        onChange={(e) => handleServiceSelect(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a service</option>
                        {servicesList.map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name} ({service.code}) - ${service.unitPrice || 0}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={itemFormData.name}
                        onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU/Code</label>
                      <input
                        type="text"
                        value={itemFormData.sku}
                        onChange={(e) => setItemFormData({ ...itemFormData, sku: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        readOnly
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={itemFormData.description}
                      onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={itemFormData.unitPrice}
                          onChange={(e) => setItemFormData({ ...itemFormData, unitPrice: e.target.value })}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <input
                        type="text"
                        value={itemFormData.unit}
                        onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., each, hour, kg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date *</label>
                      <input
                        type="date"
                        required
                        value={itemFormData.effectiveDate}
                        onChange={(e) => setItemFormData({ ...itemFormData, effectiveDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        value={itemFormData.expiryDate}
                        onChange={(e) => setItemFormData({ ...itemFormData, expiryDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={itemFormData.isActive}
                      onChange={(e) => setItemFormData({ ...itemFormData, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowItemDrawer(false)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {editingItem ? 'Update' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Delete Price Book Modal */}
      {showDeleteModal && deletingPriceBook && (
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
                  <h3 className="text-lg font-semibold text-gray-900">Delete Price Book</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">{deletingPriceBook.name}</span>? All items in this price book will also be deleted.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeletingPriceBook(null); }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button onClick={handleDeletePriceBook} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Item Modal */}
      {showDeleteItemModal && deletingItem && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowDeleteItemModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Item</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-semibold">{deletingItem.name}</span> from this price book?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowDeleteItemModal(false); setDeletingItem(null); }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button onClick={handleDeleteItem} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
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
