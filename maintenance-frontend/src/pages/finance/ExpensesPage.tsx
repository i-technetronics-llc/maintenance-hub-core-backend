import { useState, useEffect } from 'react';
import { financeApi, Expense, ExpenseCategory, Supplier, inventoryMasterApi } from '../../services/api';

interface ExpenseFormData {
  description: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  workOrderId?: string;
  assetId?: string;
  supplierId?: string;
  receipt?: string;
  notes?: string;
  isReimbursable: boolean;
}

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: 0,
    category: 'other',
    expenseDate: new Date().toISOString().split('T')[0],
    supplierId: '',
    receipt: '',
    notes: '',
    isReimbursable: false,
  });

  const limit = 10;
  const totalPages = Math.ceil(totalExpenses / limit);

  useEffect(() => {
    loadExpenses();
    loadSuppliers();
  }, [currentPage, categoryFilter]);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const response = await financeApi.expenses.getAll({
        page: currentPage,
        limit,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        search: searchQuery || undefined,
      });
      setExpenses(response.data || []);
      setTotalExpenses(response.total || 0);
    } catch (error) {
      console.error('Failed to load expenses:', error);
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
    loadExpenses();
  };

  const handleCreateExpense = () => {
    setEditingExpense(null);
    setFormData({
      description: '',
      amount: 0,
      category: 'other',
      expenseDate: new Date().toISOString().split('T')[0],
      supplierId: '',
      receipt: '',
      notes: '',
      isReimbursable: false,
    });
    setShowModal(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      expenseDate: expense.expenseDate.split('T')[0],
      workOrderId: expense.workOrderId,
      assetId: expense.assetId,
      supplierId: expense.supplierId || '',
      receipt: expense.receipt || '',
      notes: expense.notes || '',
      isReimbursable: expense.isReimbursable,
    });
    setShowModal(true);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await financeApi.expenses.delete(id);
      loadExpenses();
    } catch (error) {
      console.error('Failed to delete expense:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await financeApi.expenses.update(editingExpense.id, formData);
      } else {
        await financeApi.expenses.create(formData);
      }
      setShowModal(false);
      loadExpenses();
    } catch (error) {
      console.error('Failed to save expense:', error);
    }
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

  const getCategoryColor = (category: ExpenseCategory) => {
    const colors: Record<ExpenseCategory, string> = {
      labor: 'bg-blue-100 text-blue-800',
      parts: 'bg-green-100 text-green-800',
      equipment: 'bg-purple-100 text-purple-800',
      travel: 'bg-yellow-100 text-yellow-800',
      utilities: 'bg-orange-100 text-orange-800',
      contractor: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category];
  };

  const getCategoryLabel = (category: ExpenseCategory) => {
    const labels: Record<ExpenseCategory, string> = {
      labor: 'Labor',
      parts: 'Parts',
      equipment: 'Equipment',
      travel: 'Travel',
      utilities: 'Utilities',
      contractor: 'Contractor',
      other: 'Other',
    };
    return labels[category];
  };

  const calculateSummary = () => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500 mt-1">Track and manage operational expenses</p>
        </div>
        <button
          onClick={handleCreateExpense}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(calculateSummary())}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(
              expenses
                .filter((e) => new Date(e.expenseDate).getMonth() === new Date().getMonth())
                .reduce((sum, e) => sum + e.amount, 0)
            )}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Reimbursable</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {formatCurrency(expenses.filter((e) => e.isReimbursable).reduce((sum, e) => sum + e.amount, 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-sm font-medium text-gray-500">Total Records</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalExpenses}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search expenses..."
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
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value as ExpenseCategory | 'all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="labor">Labor</option>
            <option value="parts">Parts</option>
            <option value="equipment">Equipment</option>
            <option value="travel">Travel</option>
            <option value="utilities">Utilities</option>
            <option value="contractor">Contractor</option>
            <option value="other">Other</option>
          </select>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Expenses Table */}
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {formatDate(expense.expenseDate)}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        {expense.receipt && (
                          <p className="text-xs text-gray-500">Receipt: {expense.receipt}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(
                          expense.category
                        )}`}
                      >
                        {getCategoryLabel(expense.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {expense.supplier?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <span className="font-medium text-gray-900">{formatCurrency(expense.amount)}</span>
                        {expense.isReimbursable && (
                          <span className="ml-2 text-xs text-blue-600">(Reimbursable)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
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
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No expenses found
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

      {/* Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingExpense ? 'Edit Expense' : 'Add Expense'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Replacement motor for pump"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formData.expenseDate}
                      onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="labor">Labor</option>
                      <option value="parts">Parts</option>
                      <option value="equipment">Equipment</option>
                      <option value="travel">Travel</option>
                      <option value="utilities">Utilities</option>
                      <option value="contractor">Contractor</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Reference</label>
                  <input
                    type="text"
                    value={formData.receipt}
                    onChange={(e) => setFormData({ ...formData, receipt: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., REC-001234"
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

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isReimbursable"
                    checked={formData.isReimbursable}
                    onChange={(e) => setFormData({ ...formData, isReimbursable: e.target.checked })}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="isReimbursable" className="ml-2 text-sm text-gray-700">
                    This expense is reimbursable
                  </label>
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
                    {editingExpense ? 'Update Expense' : 'Add Expense'}
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
