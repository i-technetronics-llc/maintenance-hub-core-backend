import { useState, useEffect } from 'react';
import { subscriptionApi, SubscriptionPlan, CompanySubscription } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface PlanFormData {
  name: string;
  description: string;
  price: number;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  status: 'active' | 'inactive' | 'deprecated';
  maxUsers: number;
  maxAssets: number;
  maxWorkOrders: number;
  maxInventoryItems: number;
  storageLimit: number;
  features: {
    apiAccess: boolean;
    advancedReporting: boolean;
    customBranding: boolean;
    prioritySupport: boolean;
    multiLocation: boolean;
    integrations: boolean;
    auditLogs: boolean;
    customRoles: boolean;
  };
  isDefault: boolean;
  isTrial: boolean;
  trialDays: number;
  sortOrder: number;
}

const defaultFormData: PlanFormData = {
  name: '',
  description: '',
  price: 0,
  billingCycle: 'monthly',
  status: 'active',
  maxUsers: 5,
  maxAssets: 100,
  maxWorkOrders: 500,
  maxInventoryItems: 1000,
  storageLimit: 5,
  features: {
    apiAccess: false,
    advancedReporting: false,
    customBranding: false,
    prioritySupport: false,
    multiLocation: false,
    integrations: false,
    auditLogs: true,
    customRoles: false,
  },
  isDefault: false,
  isTrial: false,
  trialDays: 0,
  sortOrder: 0,
};

export function SubscriptionPlansPage() {
  const { isSuperAdmin } = useAuthStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<CompanySubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIncludeInactive, setShowIncludeInactive] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(defaultFormData);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'plans' | 'subscriptions'>('plans');

  useEffect(() => {
    fetchData();
  }, [showIncludeInactive]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansData, subscriptionsData] = await Promise.all([
        subscriptionApi.plans.getAll(showIncludeInactive),
        subscriptionApi.subscriptions.getAll(),
      ]);
      setPlans(Array.isArray(plansData) ? plansData : []);
      setSubscriptions(Array.isArray(subscriptionsData) ? subscriptionsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load subscription data', 'error');
      setPlans([]);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreatePlan = () => {
    setFormData(defaultFormData);
    setSelectedPlan(null);
    setIsEditing(false);
    setIsDrawerOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      billingCycle: plan.billingCycle,
      status: plan.status,
      maxUsers: plan.maxUsers,
      maxAssets: plan.maxAssets,
      maxWorkOrders: plan.maxWorkOrders,
      maxInventoryItems: plan.maxInventoryItems,
      storageLimit: plan.storageLimit,
      features: {
        apiAccess: plan.features?.apiAccess || false,
        advancedReporting: plan.features?.advancedReporting || false,
        customBranding: plan.features?.customBranding || false,
        prioritySupport: plan.features?.prioritySupport || false,
        multiLocation: plan.features?.multiLocation || false,
        integrations: plan.features?.integrations || false,
        auditLogs: plan.features?.auditLogs || false,
        customRoles: plan.features?.customRoles || false,
      },
      isDefault: plan.isDefault,
      isTrial: plan.isTrial,
      trialDays: plan.trialDays,
      sortOrder: plan.sortOrder,
    });
    setSelectedPlan(plan);
    setIsEditing(true);
    setIsDrawerOpen(true);
  };

  const handleDeletePlan = async (plan: SubscriptionPlan) => {
    if (!confirm(`Are you sure you want to delete the "${plan.name}" plan?`)) return;

    try {
      await subscriptionApi.plans.delete(plan.id);
      showToast('Plan deleted successfully', 'success');
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to delete plan', 'error');
    }
  };

  const handleSeedPlans = async () => {
    try {
      const seeded = await subscriptionApi.plans.seedDefaults();
      if (seeded.length > 0) {
        showToast(`${seeded.length} default plans created`, 'success');
        fetchData();
      } else {
        showToast('Plans already exist', 'error');
      }
    } catch (error) {
      showToast('Failed to seed plans', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing && selectedPlan) {
        await subscriptionApi.plans.update(selectedPlan.id, formData);
        showToast('Plan updated successfully', 'success');
      } else {
        await subscriptionApi.plans.create(formData);
        showToast('Plan created successfully', 'success');
      }
      setIsDrawerOpen(false);
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to save plan', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      deprecated: 'bg-yellow-100 text-yellow-800',
      trial: 'bg-blue-100 text-blue-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-red-100 text-red-800',
      suspended: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (!isSuperAdmin()) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions & Plans</h1>
          <p className="text-gray-600 mt-1">Manage subscription plans and company subscriptions</p>
        </div>
        <div className="flex items-center gap-3">
          {plans.length === 0 && (
            <button
              onClick={handleSeedPlans}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Seed Default Plans
            </button>
          )}
          <button
            onClick={handleCreatePlan}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('plans')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'plans'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Plans ({plans.length})
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'subscriptions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Company Subscriptions ({subscriptions.length})
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : activeTab === 'plans' ? (
        <>
          {/* Filter */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showIncludeInactive}
                onChange={(e) => setShowIncludeInactive(e.target.checked)}
                className="rounded border-gray-300"
              />
              Show inactive plans
            </label>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-xl border ${
                  plan.isDefault ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                } p-6 relative`}
              >
                {plan.isDefault && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                    Default
                  </div>
                )}
                {plan.isTrial && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-purple-500 text-white text-xs font-medium rounded-full">
                    Trial
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(plan.status)}`}>
                      {plan.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{plan.description || 'No description'}</p>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500">/{plan.billingCycle}</span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 border-t pt-4">
                  <div className="flex justify-between">
                    <span>Users</span>
                    <span className="font-medium">{plan.maxUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Assets</span>
                    <span className="font-medium">{plan.maxAssets}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Work Orders</span>
                    <span className="font-medium">{plan.maxWorkOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inventory Items</span>
                    <span className="font-medium">{plan.maxInventoryItems}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage</span>
                    <span className="font-medium">{plan.storageLimit} GB</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-gray-500 mb-2">Features</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(plan.features || {}).map(([key, value]) =>
                      value ? (
                        <span key={key} className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Subscriptions Table */
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{sub.company?.name || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900">{sub.plan?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">${sub.currentPrice || sub.plan?.price}/{sub.plan?.billingCycle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(sub.status)}`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(sub.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 space-y-1">
                        <div>Users: {sub.currentUsers}/{sub.plan?.maxUsers}</div>
                        <div>Assets: {sub.currentAssets}/{sub.plan?.maxAssets}</div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-xl w-full bg-white shadow-xl">
            <div className="h-full flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {isEditing ? 'Edit Plan' : 'Create New Plan'}
                </h2>
                <button onClick={() => setIsDrawerOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Cycle</label>
                    <select
                      value={formData.billingCycle}
                      onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="deprecated">Deprecated</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Limits</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Max Users</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxUsers}
                        onChange={(e) => setFormData({ ...formData, maxUsers: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Max Assets</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxAssets}
                        onChange={(e) => setFormData({ ...formData, maxAssets: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Max Work Orders</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxWorkOrders}
                        onChange={(e) => setFormData({ ...formData, maxWorkOrders: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Max Inventory Items</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxInventoryItems}
                        onChange={(e) => setFormData({ ...formData, maxInventoryItems: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Storage Limit (GB)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.storageLimit}
                        onChange={(e) => setFormData({ ...formData, storageLimit: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Features</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(formData.features).map(([key, value]) => (
                      <label key={key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              features: { ...formData.features, [key]: e.target.checked },
                            })
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">Set as default plan</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isTrial}
                        onChange={(e) => setFormData({ ...formData, isTrial: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-600">This is a trial plan</span>
                    </label>
                    {formData.isTrial && (
                      <div className="ml-6">
                        <label className="block text-sm text-gray-600 mb-1">Trial Days</label>
                        <input
                          type="number"
                          min="1"
                          value={formData.trialDays}
                          onChange={(e) => setFormData({ ...formData, trialDays: parseInt(e.target.value) })}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </form>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  {isEditing ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubscriptionPlansPage;
