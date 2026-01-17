import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface StockTransaction {
  id: string;
  inventoryId: string;
  inventoryName?: string;
  type: 'receipt' | 'issue' | 'adjustment' | 'transfer' | 'return';
  quantity: number;
  previousQuantity?: number;
  newQuantity?: number;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  unitCost?: number;
  totalCost?: number;
}

export const InventoryTransactionsPage = () => {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory/transactions');
      const data = response.data?.data || response.data || [];

      const mappedTransactions: StockTransaction[] = (Array.isArray(data) ? data : []).map((txn: any) => ({
        id: txn.id,
        inventoryId: txn.inventoryId || txn.inventory?.id,
        inventoryName: txn.inventory?.name || txn.inventoryName || '-',
        type: txn.type || txn.transactionType || 'adjustment',
        quantity: txn.quantity || 0,
        previousQuantity: txn.previousQuantity,
        newQuantity: txn.newQuantity,
        referenceType: txn.referenceType,
        referenceId: txn.referenceId,
        notes: txn.notes || txn.reason || '',
        createdBy: txn.createdBy || txn.userId,
        createdByName: txn.user?.firstName ? `${txn.user.firstName} ${txn.user.lastName}` : txn.createdByName || '-',
        createdAt: txn.createdAt,
        unitCost: txn.unitCost,
        totalCost: txn.totalCost || (txn.quantity * (txn.unitCost || 0)),
      }));

      setTransactions(mappedTransactions);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'receipt':
        return 'bg-green-100 text-green-800';
      case 'issue':
        return 'bg-red-100 text-red-800';
      case 'adjustment':
        return 'bg-yellow-100 text-yellow-800';
      case 'transfer':
        return 'bg-blue-100 text-blue-800';
      case 'return':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'receipt':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'issue':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
      case 'transfer':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
    }
  };

  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.inventoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || txn.type === filterType;
    const matchesDateFrom = !dateFrom || new Date(txn.createdAt) >= new Date(dateFrom);
    const matchesDateTo = !dateTo || new Date(txn.createdAt) <= new Date(dateTo + 'T23:59:59');
    return matchesSearch && matchesType && matchesDateFrom && matchesDateTo;
  });

  const stats = {
    totalTransactions: transactions.length,
    receipts: transactions.filter((t) => t.type === 'receipt').reduce((sum, t) => sum + t.quantity, 0),
    issues: transactions.filter((t) => t.type === 'issue').reduce((sum, t) => sum + Math.abs(t.quantity), 0),
    adjustments: transactions.filter((t) => t.type === 'adjustment').length,
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
              <h1 className="text-2xl font-bold text-gray-900">Stock Transactions</h1>
              <p className="text-sm text-gray-500">View inventory movement history</p>
            </div>
            <button
              onClick={loadTransactions}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Items Received</p>
            <p className="text-2xl font-bold text-green-600">+{stats.receipts}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Items Issued</p>
            <p className="text-2xl font-bold text-red-600">-{stats.issues}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Adjustments</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.adjustments}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search by item name or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="receipt">Receipt</option>
              <option value="issue">Issue</option>
              <option value="adjustment">Adjustment</option>
              <option value="transfer">Transfer</option>
              <option value="return">Return</option>
            </select>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">From:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">To:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(txn.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getTypeColor(
                            txn.type
                          )}`}
                        >
                          {getTypeIcon(txn.type)}
                          {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{txn.inventoryName}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`font-medium ${
                            txn.type === 'receipt' || txn.type === 'return'
                              ? 'text-green-600'
                              : txn.type === 'issue'
                              ? 'text-red-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {txn.type === 'receipt' || txn.type === 'return' ? '+' : txn.type === 'issue' ? '-' : ''}
                          {Math.abs(txn.quantity)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {txn.previousQuantity !== undefined && txn.newQuantity !== undefined ? (
                          <span>
                            {txn.previousQuantity} &rarr; {txn.newQuantity}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{txn.notes || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{txn.createdByName}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InventoryTransactionsPage;
