import { useState, useEffect } from 'react';
import { settingsApi, Setting } from '../services/api';

interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning';
  message: string;
}

interface SettingsGroup {
  [key: string]: Setting[];
}

const MODULE_LABELS: Record<string, { label: string; description: string; icon: string }> = {
  inventory: {
    label: 'Inventory',
    description: 'Configure inventory tracking and alerts',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  work_orders: {
    label: 'Work Orders',
    description: 'Manage work order settings and automation',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
  },
  notifications: {
    label: 'Notifications',
    description: 'Configure email and push notification preferences',
    icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  },
  general: {
    label: 'General',
    description: 'General application settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
};

const KEY_LABELS: Record<string, string> = {
  low_stock_threshold: 'Low Stock Threshold',
  auto_reorder: 'Auto Reorder',
  track_expiry: 'Track Expiry Dates',
  auto_assign: 'Auto Assignment',
  require_approval: 'Require Approval',
  sla_tracking: 'SLA Tracking',
  email_alerts: 'Email Alerts',
  low_stock_alerts: 'Low Stock Alerts',
  work_order_updates: 'Work Order Updates',
  timezone: 'Timezone',
  date_format: 'Date Format',
  currency: 'Currency',
};

export const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [, setSettings] = useState<Setting[]>([]);
  const [groupedSettings, setGroupedSettings] = useState<SettingsGroup>({});
  const [activeModule, setActiveModule] = useState<string>('');
  const [saving, setSaving] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsApi.getAll();
      // Handle both wrapped { success, data } and direct array responses
      const settingsData = Array.isArray(response)
        ? response
        : (response.data || []);
      setSettings(Array.isArray(settingsData) ? settingsData : []);

      // Group settings by module
      const grouped: SettingsGroup = {};
      const dataArray = Array.isArray(settingsData) ? settingsData : [];
      dataArray.forEach((setting: Setting) => {
        if (!grouped[setting.module]) {
          grouped[setting.module] = [];
        }
        grouped[setting.module].push(setting);
      });
      setGroupedSettings(grouped);

      // Set default active module
      if (Object.keys(grouped).length > 0 && !activeModule) {
        setActiveModule(Object.keys(grouped)[0]);
      }
    } catch (err: any) {
      console.error('Error loading settings:', err);
      showToast('error', err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type: 'success' | 'error' | 'warning', message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleToggleSetting = async (setting: Setting) => {
    setSaving(setting.id);
    try {
      const newValue = { ...setting.value, enabled: !setting.value?.enabled };
      await settingsApi.update(setting.id, { value: newValue, isEnabled: !setting.value?.enabled });
      showToast('success', `${KEY_LABELS[setting.key] || setting.key} updated successfully`);
      await fetchSettings();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateValue = async (setting: Setting, newValue: any) => {
    setSaving(setting.id);
    try {
      await settingsApi.update(setting.id, { value: newValue });
      showToast('success', `${KEY_LABELS[setting.key] || setting.key} updated successfully`);
      await fetchSettings();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  const handleInitializeDefaults = async () => {
    setSaving('defaults');
    try {
      await settingsApi.initializeDefaults();
      showToast('success', 'Default settings initialized successfully');
      await fetchSettings();
    } catch (err: any) {
      showToast('error', err.response?.data?.message || 'Failed to initialize default settings');
    } finally {
      setSaving(null);
    }
  };

  const renderSettingValue = (setting: Setting) => {
    const value = setting.value;

    // Boolean toggle (for enabled/disabled settings)
    if (typeof value?.enabled !== 'undefined' || typeof value === 'boolean') {
      const isEnabled = typeof value === 'boolean' ? value : value?.enabled;
      return (
        <button
          onClick={() => handleToggleSetting(setting)}
          disabled={saving === setting.id}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isEnabled ? 'bg-blue-600' : 'bg-gray-200'
          } ${saving === setting.id ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      );
    }

    // Number input (for threshold values)
    if (typeof value?.threshold !== 'undefined') {
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value.threshold}
            onChange={(e) => handleUpdateValue(setting, { ...value, threshold: parseInt(e.target.value) || 0 })}
            disabled={saving === setting.id}
            className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {value.alertEnabled !== undefined && (
            <button
              onClick={() => handleUpdateValue(setting, { ...value, alertEnabled: !value.alertEnabled })}
              disabled={saving === setting.id}
              className={`px-3 py-1.5 text-sm rounded ${
                value.alertEnabled
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {value.alertEnabled ? 'Alerts On' : 'Alerts Off'}
            </button>
          )}
        </div>
      );
    }

    // String value (for timezone, date format, currency)
    if (typeof value?.value !== 'undefined') {
      if (setting.key === 'timezone') {
        return (
          <select
            value={value.value}
            onChange={(e) => handleUpdateValue(setting, { value: e.target.value })}
            disabled={saving === setting.id}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Europe/Paris">Paris (CET)</option>
            <option value="Asia/Tokyo">Tokyo (JST)</option>
          </select>
        );
      }
      if (setting.key === 'date_format') {
        return (
          <select
            value={value.value}
            onChange={(e) => handleUpdateValue(setting, { value: e.target.value })}
            disabled={saving === setting.id}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
          </select>
        );
      }
      if (setting.key === 'currency') {
        return (
          <select
            value={value.value}
            onChange={(e) => handleUpdateValue(setting, { value: e.target.value })}
            disabled={saving === setting.id}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
            <option value="CAD">CAD</option>
            <option value="AUD">AUD</option>
          </select>
        );
      }
      return <span className="text-gray-600">{value.value}</span>;
    }

    // JSON display for complex values
    return (
      <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const modules = Object.keys(groupedSettings);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure application settings for inventory and other modules</p>
      </div>

      {modules.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No settings configured</h3>
          <p className="mt-2 text-sm text-gray-500">
            Initialize default settings to get started
          </p>
          <button
            onClick={handleInitializeDefaults}
            disabled={saving === 'defaults'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving === 'defaults' ? 'Initializing...' : 'Initialize Default Settings'}
          </button>
        </div>
      ) : (
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {modules.map((module) => {
                const moduleInfo = MODULE_LABELS[module] || { label: module, description: '', icon: '' };
                return (
                  <button
                    key={module}
                    onClick={() => setActiveModule(module)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeModule === module
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 ${activeModule === module ? 'text-blue-600' : 'text-gray-400'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={moduleInfo.icon} />
                    </svg>
                    <span className="font-medium">{moduleInfo.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 pt-6 border-t">
              <button
                onClick={handleInitializeDefaults}
                disabled={saving === 'defaults'}
                className="w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center gap-2 justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset to Defaults
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeModule && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    {MODULE_LABELS[activeModule]?.label || activeModule}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {MODULE_LABELS[activeModule]?.description || 'Configure module settings'}
                  </p>
                </div>

                <div className="divide-y divide-gray-200">
                  {groupedSettings[activeModule]?.map((setting) => (
                    <div key={setting.id} className="px-6 py-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {KEY_LABELS[setting.key] || setting.key}
                        </h3>
                        {setting.description && (
                          <p className="text-sm text-gray-500 mt-1">{setting.description}</p>
                        )}
                      </div>
                      <div className="flex items-center">
                        {renderSettingValue(setting)}
                        {saving === setting.id && (
                          <svg className="animate-spin ml-2 h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
