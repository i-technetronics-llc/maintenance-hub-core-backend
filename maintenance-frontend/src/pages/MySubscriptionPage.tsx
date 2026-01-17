import { useState, useEffect } from 'react';
import { subscriptionApi, SubscriptionPlan, CompanySubscription, SubscriptionUsage } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface SubscriptionWithUsage extends CompanySubscription {
  usage?: Record<string, SubscriptionUsage>;
  withinLimits?: boolean;
}

export function MySubscriptionPage() {
  const { user, isSuperAdmin } = useAuthStore();
  const [subscription, setSubscription] = useState<SubscriptionWithUsage | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);

      const [subscriptionData, plansData] = await Promise.all([
        subscriptionApi.subscriptions.getMySubscription(),
        subscriptionApi.plans.getAll(),
      ]);

      setSubscription(subscriptionData);
      setPlans(Array.isArray(plansData) ? plansData : []);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to load subscription information');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; dot: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
      trial: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
      expired: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
      suspended: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
    };
    return colors[status] || colors.active;
  };

  const getUsagePercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button
          onClick={fetchSubscription}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Super Admin redirect
  if (isSuperAdmin()) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Super Administrator</h2>
        <p className="text-gray-600 mb-4">
          As a Super Administrator, you have full access to all features.
        </p>
        <a
          href="/settings/subscriptions"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Manage All Subscriptions
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    );
  }

  // No subscription
  if (!subscription) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Subscription</h2>
          <p className="text-gray-600 mb-6">
            Your organization doesn't have an active subscription plan.
            Please contact your administrator.
          </p>
        </div>

        {/* Available Plans */}
        {plans.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Plans</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-xl border ${
                    plan.isDefault ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  } p-6`}
                >
                  <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500">/{plan.billingCycle}</span>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-gray-600">
                    <li>{plan.maxUsers} users</li>
                    <li>{plan.maxAssets} assets</li>
                    <li>{plan.maxWorkOrders} work orders</li>
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const statusColors = getStatusColor(subscription.status || 'active');
  const plan = subscription.plan;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Subscription</h1>
        <p className="text-gray-600 mt-1">View your organization's subscription details and usage</p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900">{plan?.name}</h2>
                <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${statusColors.bg} ${statusColors.text}`}>
                  <span className={`w-2 h-2 rounded-full ${statusColors.dot}`}></span>
                  {subscription.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : 'Unknown'}
                </span>
              </div>
              <p className="text-gray-600 mt-1">{plan?.description}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                ${subscription.currentPrice || plan?.price}
              </div>
              <div className="text-gray-500">per {plan?.billingCycle}</div>
            </div>
          </div>
        </div>

        {/* Subscription Details */}
        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-gray-500">Company</p>
            <p className="font-medium text-gray-900">{user?.company?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="font-medium text-gray-900">
              {new Date(subscription.startDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Next Billing</p>
            <p className="font-medium text-gray-900">
              {subscription.nextBillingDate
                ? new Date(subscription.nextBillingDate).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
          {subscription.status === 'trial' && subscription.trialEndsAt && (
            <div>
              <p className="text-sm text-gray-500">Trial Ends</p>
              <p className="font-medium text-orange-600">
                {new Date(subscription.trialEndsAt).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Usage</h3>
          {subscription.withinLimits === false && (
            <span className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full">
              Limits Exceeded
            </span>
          )}
        </div>

        <div className="space-y-6">
          {subscription.usage && Object.entries(subscription.usage).map(([key, usage]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="text-sm text-gray-600">
                  {usage.current} / {usage.max} ({usage.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getUsagePercentageColor(usage.percentage)}`}
                  style={{ width: `${Math.min(usage.percentage, 100)}%` }}
                />
              </div>
            </div>
          ))}

          {!subscription.usage && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.currentUsers} / {plan?.maxUsers}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Assets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.currentAssets} / {plan?.maxAssets}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Work Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.currentWorkOrders} / {plan?.maxWorkOrders}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Inventory Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.currentInventoryItems} / {plan?.maxInventoryItems}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Storage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscription.storageUsed} / {plan?.storageLimit} GB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Included Features</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {plan?.features && Object.entries(plan.features).map(([key, enabled]) => (
            <div
              key={key}
              className={`flex items-center gap-2 p-3 rounded-lg ${
                enabled ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              {enabled ? (
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span className={`text-sm ${enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="bg-blue-50 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Need to upgrade or have questions?</h4>
            <p className="text-sm text-gray-600 mt-1">
              Contact your administrator or reach out to our support team for assistance with your subscription.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MySubscriptionPage;
