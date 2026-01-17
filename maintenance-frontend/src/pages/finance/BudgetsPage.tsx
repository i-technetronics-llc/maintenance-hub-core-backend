import { useState, useEffect } from 'react';
import { financeApi, Budget, BudgetPeriod, Team, teamApi, ExpenseCategory } from '../../services/api';

interface BudgetFormData {
  name: string;
  description?: string;
  period: BudgetPeriod;
  startDate: string;
  endDate: string;
  allocatedAmount: number;
  categories: {
    category: ExpenseCategory;
    allocatedAmount: number;
  }[];
  teamId?: string;
}

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [periodFilter, setPeriodFilter] = useState<BudgetPeriod | 'all'>('all');
  const [formData, setFormData] = useState<BudgetFormData>({
    name: '',
    description: '',
    period: 'monthly',
    startDate: '',
    endDate: '',
    allocatedAmount: 0,
    categories: [{ category: 'labor', allocatedAmount: 0 }],
    teamId: '',
  });

  useEffect(() => {
    loadBudgets();
    loadTeams();
  }, [currentPage, periodFilter]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const response = await financeApi.budgets.getAll({
        period: periodFilter !== 'all' ? periodFilter : undefined,
      });
      setBudgets(response || []);
      setTotalPages(Math.ceil((response?.length || 0) / 10));
    } catch (error) {
      console.error('Failed to load budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const response = await teamApi.getAll();
      setTeams(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  const handleCreateBudget = () => {
    setEditingBudget(null);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setFormData({
      name: '',
      description: '',
      period: 'monthly',
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      allocatedAmount: 0,
      categories: [
        { category: 'labor', allocatedAmount: 0 },
        { category: 'parts', allocatedAmount: 0 },
        { category: 'equipment', allocatedAmount: 0 },
      ],
      teamId: '',
    });
    setShowModal(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      description: budget.description || '',
      period: budget.period,
      startDate: budget.startDate.split('T')[0],
      endDate: budget.endDate.split('T')[0],
      allocatedAmount: budget.allocatedAmount,
      categories: budget.categories.map((cat) => ({
        category: cat.category,
        allocatedAmount: cat.allocatedAmount,
      })),
      teamId: budget.teamId || '',
    });
    setShowModal(true);
  };

  const handleDeleteBudget = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) return;
    try {
      await financeApi.budgets.delete(id);
      loadBudgets();
    } catch (error) {
      console.error('Failed to delete budget:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const budgetData = {
        ...formData,
        categories: formData.categories.map((cat) => ({
          ...cat,
          id: '',
          budgetId: editingBudget?.id || '',
          spentAmount: 0,
        })),
      };
      if (editingBudget) {
        await financeApi.budgets.update(editingBudget.id, budgetData);
      } else {
        await financeApi.budgets.create(budgetData);
      }
      setShowModal(false);
      loadBudgets();
    } catch (error) {
      console.error('Failed to save budget:', error);
    }
  };

  const addCategory = () => {
    setFormData({
      ...formData,
      categories: [...formData.categories, { category: 'other', allocatedAmount: 0 }],
    });
  };

  const removeCategory = (index: number) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((_, i) => i !== index),
    });
  };

  const updateCategory = (index: number, field: string, value: ExpenseCategory | number) => {
    const newCategories = [...formData.categories];
    newCategories[index] = { ...newCategories[index], [field]: value };
    setFormData({ ...formData, categories: newCategories });
  };

  const calculateTotalAllocated = () => {
    return formData.categories.reduce((sum, cat) => sum + cat.allocatedAmount, 0);
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

  const getUtilizationColor = (spent: number, total: number) => {
    const percentage = total > 0 ? (spent / total) * 100 : 0;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getCategoryLabel = (category: ExpenseCategory): string => {
    const labels: Record<ExpenseCategory, string> = {
      labor: 'Labor',
      parts: 'Parts',
      equipment: 'Equipment',
      travel: 'Travel',
      utilities: 'Utilities',
      contractor: 'Contractor',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const handlePeriodChange = (newPeriod: BudgetPeriod) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (newPeriod) {
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    setFormData({
      ...formData,
      period: newPeriod,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-500 mt-1">Manage maintenance budgets and allocations</p>
        </div>
        <button
          onClick={handleCreateBudget}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Budget
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={periodFilter}
            onChange={(e) => {
              setPeriodFilter(e.target.value as BudgetPeriod | 'all');
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Periods</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {/* Budget Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((budget) => (
            <div
              key={budget.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{budget.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{budget.period}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEditBudget(budget)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteBudget(budget.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Spent / Allocated</span>
                  <span className="font-medium">
                    {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.allocatedAmount)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getUtilizationColor(budget.spentAmount, budget.allocatedAmount)}`}
                    style={{
                      width: `${Math.min(budget.allocatedAmount > 0 ? (budget.spentAmount / budget.allocatedAmount) * 100 : 0, 100)}%`,
                    }}
                  ></div>
                </div>
                <div className="text-right text-xs text-gray-500 mt-1">
                  {budget.allocatedAmount > 0 ? ((budget.spentAmount / budget.allocatedAmount) * 100).toFixed(1) : 0}% used
                </div>
              </div>

              <div className="text-sm text-gray-500 mb-4">
                {formatDate(budget.startDate)} - {formatDate(budget.endDate)}
              </div>

              {/* Category Breakdown */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase">Categories</p>
                {budget.categories.slice(0, 3).map((cat, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">{getCategoryLabel(cat.category)}</span>
                    <span className="text-gray-900">
                      {formatCurrency(cat.spentAmount)} / {formatCurrency(cat.allocatedAmount)}
                    </span>
                  </div>
                ))}
                {budget.categories.length > 3 && (
                  <p className="text-xs text-gray-400">+{budget.categories.length - 3} more</p>
                )}
              </div>

              {budget.team && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Team: <span className="font-medium text-gray-700">{budget.team.name}</span>
                  </p>
                </div>
              )}
            </div>
          ))}

          {budgets.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No budgets found. Create your first budget to get started.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-4">
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

      {/* Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowModal(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingBudget ? 'Edit Budget' : 'Create Budget'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Budget Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Q1 Maintenance Budget"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Period *</label>
                    <select
                      value={formData.period}
                      onChange={(e) => handlePeriodChange(e.target.value as BudgetPeriod)}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget *</label>
                    <input
                      type="number"
                      value={formData.allocatedAmount}
                      onChange={(e) => setFormData({ ...formData, allocatedAmount: parseFloat(e.target.value) || 0 })}
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team (Optional)</label>
                    <select
                      value={formData.teamId}
                      onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Team (Organization-wide)</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Budget description..."
                  />
                </div>

                {/* Budget Categories */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Budget Categories</label>
                    <button
                      type="button"
                      onClick={addCategory}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + Add Category
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.categories.map((cat, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="flex-1">
                          <select
                            value={cat.category}
                            onChange={(e) => updateCategory(index, 'category', e.target.value as ExpenseCategory)}
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
                        <div className="w-40">
                          <input
                            type="number"
                            placeholder="Amount"
                            value={cat.allocatedAmount}
                            onChange={(e) => updateCategory(index, 'allocatedAmount', parseFloat(e.target.value) || 0)}
                            step="0.01"
                            min="0"
                            required
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        {formData.categories.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCategory(index)}
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
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-gray-500">Total Allocated:</span>
                    <span className={`font-medium ${calculateTotalAllocated() > formData.allocatedAmount ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatCurrency(calculateTotalAllocated())}
                      {calculateTotalAllocated() > formData.allocatedAmount && ' (exceeds budget)'}
                    </span>
                  </div>
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
                    {editingBudget ? 'Update Budget' : 'Create Budget'}
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
