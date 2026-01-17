import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface InventoryItem {
  id: string;
  partNumber: string;
  name: string;
  description: string;
  category: string;
  categoryName?: string;
  location: string;
  locationName?: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  unitCost: number;
  supplier: string;
  supplierName?: string;
  lastRestocked: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  sku?: string;
  reorderPoint?: number;
  organizationId?: string;
}

export const InventoryPage = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [, setSelectedItem] = useState<InventoryItem | null>(null);

  const categories = ['Electrical', 'Mechanical', 'Filters', 'Lubricants', 'Safety', 'Tools'];

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory');
      const data = response.data?.data || response.data || [];

      // Map API response to InventoryItem interface
      const mappedItems: InventoryItem[] = (Array.isArray(data) ? data : []).map((item: any) => {
        const quantity = item.quantity ?? item.currentStock ?? 0;
        const minQuantity = item.minQuantity ?? item.reorderPoint ?? 0;
        const maxQuantity = item.maxQuantity ?? item.maxStock ?? 100;

        // Determine status based on quantity
        let status: 'in_stock' | 'low_stock' | 'out_of_stock' = 'in_stock';
        if (quantity === 0) {
          status = 'out_of_stock';
        } else if (quantity <= minQuantity) {
          status = 'low_stock';
        }

        return {
          id: item.id,
          partNumber: item.partNumber || item.sku || '-',
          name: item.name,
          description: item.description || '',
          category: item.category?.name || item.categoryName || item.category || '-',
          categoryName: item.category?.name || item.categoryName,
          location: item.location?.name || item.locationName || item.location || '-',
          locationName: item.location?.name || item.locationName,
          quantity,
          minQuantity,
          maxQuantity,
          unitCost: item.unitCost || item.unitPrice || 0,
          supplier: item.supplier?.name || item.supplierName || item.supplier || '-',
          supplierName: item.supplier?.name || item.supplierName,
          lastRestocked: item.lastRestocked || item.updatedAt || item.createdAt || '',
          status,
          sku: item.sku,
          reorderPoint: item.reorderPoint,
          organizationId: item.organizationId,
        };
      });

      setItems(mappedItems);
    } catch (error) {
      console.error('Failed to load inventory:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    totalItems: items.length,
    totalValue: items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
    lowStock: items.filter(i => i.status === 'low_stock').length,
    outOfStock: items.filter(i => i.status === 'out_of_stock').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
              <p className="text-sm text-gray-500">Manage parts and supplies</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Item
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by name or part number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.partNumber}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.category}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{item.location}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{item.quantity}</p>
                        <p className="text-xs text-gray-500">Min: {item.minQuantity}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">${item.unitCost.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button className="text-green-600 hover:text-green-800 text-sm">
                          Restock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Modal Placeholder */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Add Inventory Item</h3>
            <p className="text-gray-500 mb-4">Form fields would go here</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
