import { useState, useEffect } from 'react';
import { financeApi, PurchaseOrder, PurchaseOrderStatus, Supplier, inventoryMasterApi } from '../../services/api';

interface POFormData {
  supplierId: string;
  expectedDeliveryDate: string;
  items: {
    description: string;
    partNumber?: string;
    quantity: number;
    unitPrice: number;
  }[];
  shippingAddress?: string;
  notes?: string;
}

export function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState<POFormData>({
    supplierId: '',
    expectedDeliveryDate: '',
    items: [{ description: '', partNumber: '', quantity: 1, unitPrice: 0 }],
    shippingAddress: '',
    notes: '',
  });

  useEffect(() => {
    loadPurchaseOrders();
    loadSuppliers();
  }, [currentPage, statusFilter]);

  const loadPurchaseOrders = async () => {
    setLoading(true);
    try {
      const response = await financeApi.purchaseOrders.getAll({
        page: currentPage,
        limit: 10,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      setPurchaseOrders(response.data || []);
      setTotalPages(Math.ceil((response.total || 0) / 10));
    } catch (error) {
      console.error('Failed to load purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await inventoryMasterApi.suppliers.getAll();
      setSuppliers(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadPurchaseOrders();
  };

  const handleCreatePO = () => {
    setEditingPO(null);
    setFormData({
      supplierId: '',
      expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [{ description: '', partNumber: '', quantity: 1, unitPrice: 0 }],
      shippingAddress: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleEditPO = (po: PurchaseOrder) => {
    setEditingPO(po);
    setFormData({
      supplierId: po.supplierId,
      expectedDeliveryDate: po.expectedDeliveryDate ? po.expectedDeliveryDate.split('T')[0] : '',
      items: (po.lineItems || []).map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      shippingAddress: po.shippingAddress || '',
      notes: po.notes || '',
    });
    setShowModal(true);
  };

  const handleDeletePO = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    try {
      await financeApi.purchaseOrders.delete(id);
      loadPurchaseOrders();
    } catch (error) {
      console.error('Failed to delete purchase order:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPO) {
        await financeApi.purchaseOrders.update(editingPO.id, formData);
      } else {
        await financeApi.purchaseOrders.create(formData);
      }
      setShowModal(false);
      loadPurchaseOrders();
    } catch (error) {
      console.error('Failed to save purchase order:', error);
    }
  };

  const handleApprovePO = async (id: string) => {
    try {
      await financeApi.purchaseOrders.updateStatus(id, 'approved');
      loadPurchaseOrders();
    } catch (error) {
      console.error('Failed to approve purchase order:', error);
    }
  };

  const handleReceivePO = async (id: string) => {
    try {
      await financeApi.purchaseOrders.updateStatus(id, 'received');
      loadPurchaseOrders();
    } catch (error) {
      console.error('Failed to receive purchase order:', error);
    }
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', partNumber: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateLineItem = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: PurchaseOrderStatus) => {
    const colors: Record<PurchaseOrderStatus, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      sent: 'bg-purple-100 text-purple-800',
      partial: 'bg-orange-100 text-orange-800',
      received: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500 mt-1">Manage procurement and supplier orders</p>
        </div>
        <button
          onClick={handleCreatePO}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create PO
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search purchase orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <svg
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as PurchaseOrderStatus | 'all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="sent">Sent</option>
            <option value="partial">Partial</option>
            <option value="received">Received</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expected Delivery
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{po.poNumber}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{po.supplier?.name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        {formatCurrency(po.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          po.status
                        )}`}
                      >
                        {po.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {po.expectedDeliveryDate ? formatDate(po.expectedDeliveryDate) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {po.status === 'pending_approval' && (
                          <button
                            onClick={() => handleApprovePO(po.id)}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Approve"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        {(po.status === 'approved' || po.status === 'sent' || po.status === 'partial') && (
                          <button
                            onClick={() => handleReceivePO(po.id)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Mark as Received"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleEditPO(po)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePO(po.id)}
                          className="p-1 text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {purchaseOrders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No purchase orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* PO Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPO ? 'Edit Purchase Order' : 'Create Purchase Order'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Delivery Date *
                    </label>
                    <input
                      type="date"
                      value={formData.expectedDeliveryDate}
                      onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Line Items</label>
                    <button
                      type="button"
                      onClick={addLineItem}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="w-32">
                          <input
                            type="text"
                            placeholder="Part #"
                            value={item.partNumber}
                            onChange={(e) => updateLineItem(index, 'partNumber', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            min="1"
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="w-32">
                          <input
                            type="number"
                            placeholder="Unit Price"
                            value={item.unitPrice}
                            onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="w-28 text-right font-medium text-gray-900 py-2">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </div>
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            className="p-2 text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-end">
                      <div className="w-64">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total:</span>
                          <span>{formatCurrency(calculateTotal())}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                  <textarea
                    value={formData.shippingAddress}
                    onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Delivery address..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingPO ? 'Update PO' : 'Create PO'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
