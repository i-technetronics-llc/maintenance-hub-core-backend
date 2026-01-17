import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'draft';
  dueDate: string;
  createdAt: string;
  paidAt?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface UsageData {
  metric: string;
  current: number;
  limit: number;
  unit: string;
}

export const BillingPage = () => {
  const { section } = useParams<{ section?: string }>();
  const [activeTab, setActiveTab] = useState(section || 'overview');
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [usage, setUsage] = useState<UsageData[]>([]);
  const [currentPlan] = useState({ name: 'Pro', price: 99, interval: 'month' });

  useEffect(() => {
    if (section) {
      setActiveTab(section);
    }
  }, [section]);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      // Load billing data from API
      try {
        const [invoicesRes, methodsRes, usageRes] = await Promise.all([
          api.get('/billing/invoices'),
          api.get('/billing/payment-methods'),
          api.get('/billing/usage'),
        ]);
        setInvoices(invoicesRes.data?.data || invoicesRes.data || []);
        setPaymentMethods(methodsRes.data?.data || methodsRes.data || []);
        setUsage(usageRes.data?.data || usageRes.data || []);
      } catch {
        // Use mock data if API not available
        setInvoices([
          {
            id: '1',
            invoiceNumber: 'INV-2024-001',
            amount: 99.00,
            currency: 'USD',
            status: 'paid',
            dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
            paidAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            invoiceNumber: 'INV-2024-002',
            amount: 99.00,
            currency: 'USD',
            status: 'pending',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
          },
        ]);
        setPaymentMethods([
          {
            id: '1',
            type: 'card',
            last4: '4242',
            brand: 'Visa',
            expiryMonth: 12,
            expiryYear: 2025,
            isDefault: true,
          },
        ]);
        setUsage([
          { metric: 'Users', current: 15, limit: 25, unit: 'users' },
          { metric: 'Assets', current: 245, limit: 500, unit: 'assets' },
          { metric: 'Work Orders', current: 1250, limit: 5000, unit: 'per month' },
          { metric: 'Storage', current: 2.4, limit: 10, unit: 'GB' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'invoices', label: 'Invoices' },
    { id: 'payment-methods', label: 'Payment Methods' },
    { id: 'usage', label: 'Usage' },
  ];

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
              <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
              <p className="text-sm text-gray-500">Manage your subscription and payments</p>
            </div>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Current Plan */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
                  <p className="text-gray-500 mt-1">
                    {currentPlan.name} - ${currentPlan.price}/{currentPlan.interval}
                  </p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Upgrade Plan
                </button>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                {usage.map((item) => (
                  <div key={item.metric} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">{item.metric}</p>
                    <p className="text-xl font-bold text-gray-900">
                      {item.current} / {item.limit}
                    </p>
                    <div className="mt-2 w-full h-2 bg-gray-200 rounded-full">
                      <div
                        className={`h-2 rounded-full ${
                          (item.current / item.limit) > 0.9 ? 'bg-red-500' :
                          (item.current / item.limit) > 0.7 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min((item.current / item.limit) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{item.unit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Invoice */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Invoice</h3>
              <div className="flex items-center justify-between py-4 border-t border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Pro Plan - Monthly</p>
                  <p className="text-sm text-gray-500">
                    Due on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-xl font-bold text-gray-900">$99.00</p>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{invoice.invoiceNumber}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {new Date(invoice.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ${invoice.amount.toFixed(2)} {invoice.currency}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Download</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payment-methods' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Add Payment Method
              </button>
            </div>
            <div className="grid gap-4">
              {paymentMethods.map((method) => (
                <div key={method.id} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center">
                        {method.brand === 'Visa' && (
                          <span className="text-blue-600 font-bold text-sm">VISA</span>
                        )}
                        {method.brand === 'Mastercard' && (
                          <span className="text-orange-600 font-bold text-sm">MC</span>
                        )}
                        {!method.brand && method.type === 'bank_account' && (
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {method.type === 'card' ? `${method.brand} ending in ${method.last4}` : `Bank account ending in ${method.last4}`}
                        </p>
                        {method.expiryMonth && method.expiryYear && (
                          <p className="text-sm text-gray-500">
                            Expires {method.expiryMonth}/{method.expiryYear}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {method.isDefault && (
                        <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Default
                        </span>
                      )}
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Current Usage</h3>
            <div className="space-y-6">
              {usage.map((item) => (
                <div key={item.metric}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.metric}</span>
                    <span className="text-sm text-gray-500">
                      {item.current} / {item.limit} {item.unit}
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full">
                    <div
                      className={`h-3 rounded-full transition-all ${
                        (item.current / item.limit) > 0.9 ? 'bg-red-500' :
                        (item.current / item.limit) > 0.7 ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min((item.current / item.limit) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round((item.current / item.limit) * 100)}% used
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BillingPage;
