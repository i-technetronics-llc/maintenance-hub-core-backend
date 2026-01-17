import { useState, useEffect } from 'react';

interface SystemConfig {
  general: {
    siteName: string;
    supportEmail: string;
    maxUploadSize: number;
    sessionTimeout: number;
    maintenanceMode: boolean;
  };
  security: {
    passwordMinLength: number;
    passwordRequireUppercase: boolean;
    passwordRequireNumbers: boolean;
    passwordRequireSpecial: boolean;
    mfaEnabled: boolean;
    maxLoginAttempts: number;
    lockoutDuration: number;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    slackIntegration: boolean;
    webhookEnabled: boolean;
  };
  features: {
    signupEnabled: boolean;
    trialEnabled: boolean;
    trialDays: number;
    apiAccessEnabled: boolean;
    multiLanguage: boolean;
    darkMode: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    backupRetention: number;
    lastBackup: string;
  };
}

export const SystemConfiguration = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      // Simulated data - replace with actual API call
      const mockConfig: SystemConfig = {
        general: {
          siteName: 'CMMS Platform',
          supportEmail: 'support@cmms.com',
          maxUploadSize: 50,
          sessionTimeout: 30,
          maintenanceMode: false,
        },
        security: {
          passwordMinLength: 8,
          passwordRequireUppercase: true,
          passwordRequireNumbers: true,
          passwordRequireSpecial: true,
          mfaEnabled: false,
          maxLoginAttempts: 5,
          lockoutDuration: 15,
        },
        email: {
          smtpHost: 'smtp.example.com',
          smtpPort: 587,
          smtpUser: 'noreply@cmms.com',
          smtpSecure: true,
          fromEmail: 'noreply@cmms.com',
          fromName: 'CMMS Platform',
        },
        notifications: {
          emailNotifications: true,
          pushNotifications: true,
          smsNotifications: false,
          slackIntegration: false,
          webhookEnabled: true,
        },
        features: {
          signupEnabled: true,
          trialEnabled: true,
          trialDays: 14,
          apiAccessEnabled: true,
          multiLanguage: false,
          darkMode: false,
        },
        backup: {
          autoBackup: true,
          backupFrequency: 'daily',
          backupRetention: 30,
          lastBackup: new Date().toISOString(),
        },
      };
      setConfig(mockConfig);
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage({ type: 'success', text: 'Configuration saved successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = <T extends keyof SystemConfig>(
    section: T,
    key: keyof SystemConfig[T],
    value: any
  ) => {
    if (!config) return;
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [key]: value,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!config) return null;

  const tabs = [
    { id: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'email', label: 'Email', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { id: 'notifications', label: 'Notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'features', label: 'Features', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { id: 'backup', label: 'Backup', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Configuration</h1>
          <p className="text-gray-500">Manage platform settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 bg-white rounded-xl shadow-sm border p-4">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                  <input
                    type="text"
                    value={config.general.siteName}
                    onChange={(e) => updateConfig('general', 'siteName', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                  <input
                    type="email"
                    value={config.general.supportEmail}
                    onChange={(e) => updateConfig('general', 'supportEmail', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Upload Size (MB)</label>
                  <input
                    type="number"
                    value={config.general.maxUploadSize}
                    onChange={(e) => updateConfig('general', 'maxUploadSize', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={config.general.sessionTimeout}
                    onChange={(e) => updateConfig('general', 'sessionTimeout', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Maintenance Mode</p>
                  <p className="text-sm text-gray-500">When enabled, only super admins can access the platform</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.general.maintenanceMode}
                    onChange={(e) => updateConfig('general', 'maintenanceMode', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Password Length</label>
                  <input
                    type="number"
                    value={config.security.passwordMinLength}
                    onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))}
                    className="w-32 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Password Requirements</p>
                  {[
                    { key: 'passwordRequireUppercase' as const, label: 'Require uppercase letters' },
                    { key: 'passwordRequireNumbers' as const, label: 'Require numbers' },
                    { key: 'passwordRequireSpecial' as const, label: 'Require special characters' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.security[item.key]}
                        onChange={(e) => updateConfig('security', item.key, e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">{item.label}</span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Login Attempts</label>
                    <input
                      type="number"
                      value={config.security.maxLoginAttempts}
                      onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lockout Duration (minutes)</label>
                    <input
                      type="number"
                      value={config.security.lockoutDuration}
                      onChange={(e) => updateConfig('security', 'lockoutDuration', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mt-4">
                  <div>
                    <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                    <p className="text-sm text-gray-500">Require MFA for all users</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.security.mfaEnabled}
                      onChange={(e) => updateConfig('security', 'mfaEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Feature Toggles</h3>

              <div className="space-y-4">
                {[
                  { key: 'signupEnabled' as const, label: 'Public Signup', description: 'Allow new companies to register' },
                  { key: 'trialEnabled' as const, label: 'Free Trial', description: 'Enable free trial for new signups' },
                  { key: 'apiAccessEnabled' as const, label: 'API Access', description: 'Allow API key generation' },
                  { key: 'multiLanguage' as const, label: 'Multi-Language', description: 'Enable language selection' },
                  { key: 'darkMode' as const, label: 'Dark Mode', description: 'Allow dark mode theme' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.features[item.key]}
                        onChange={(e) => updateConfig('features', item.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}

                {config.features.trialEnabled && (
                  <div className="ml-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trial Duration (days)</label>
                    <input
                      type="number"
                      value={config.features.trialDays}
                      onChange={(e) => updateConfig('features', 'trialDays', parseInt(e.target.value))}
                      className="w-32 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Backup Settings</h3>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Automatic Backups</p>
                  <p className="text-sm text-gray-500">Schedule automatic database backups</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.backup.autoBackup}
                    onChange={(e) => updateConfig('backup', 'autoBackup', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {config.backup.autoBackup && (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Backup Frequency</label>
                    <select
                      value={config.backup.backupFrequency}
                      onChange={(e) => updateConfig('backup', 'backupFrequency', e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Retention Period (days)</label>
                    <input
                      type="number"
                      value={config.backup.backupRetention}
                      onChange={(e) => updateConfig('backup', 'backupRetention', parseInt(e.target.value))}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">Last Backup</p>
                    <p className="text-sm text-blue-700">
                      {new Date(config.backup.lastBackup).toLocaleString()}
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Backup Now
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
