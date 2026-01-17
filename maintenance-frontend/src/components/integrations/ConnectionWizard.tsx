import { useState, useEffect } from 'react';
import { IntegrationType, integrationsApi, IntegrationConfig } from '../../services/api';

interface ConnectionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingIntegration?: IntegrationConfig | null;
}

type WizardStep = 'type' | 'connection' | 'settings' | 'review';

const INTEGRATION_TYPES = [
  {
    value: 'sap' as IntegrationType,
    label: 'SAP',
    description: 'Connect to SAP ERP systems (MM, PM, CO modules)',
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    color: 'blue',
  },
  {
    value: 'oracle' as IntegrationType,
    label: 'Oracle',
    description: 'Connect to Oracle EBS or Oracle Cloud applications',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
    color: 'red',
  },
  {
    value: 'dynamics' as IntegrationType,
    label: 'Microsoft Dynamics',
    description: 'Connect to Microsoft Dynamics 365 (Coming Soon)',
    icon: 'M3 3h18v18H3V3zm16 16V5H5v14h14z',
    color: 'purple',
    disabled: true,
  },
];

const SAP_FIELDS = [
  { key: 'baseUrl', label: 'SAP Gateway URL', type: 'text', required: true, placeholder: 'https://your-sap-server.com/sap/opu/odata' },
  { key: 'client', label: 'SAP Client', type: 'text', required: true, placeholder: '100' },
  { key: 'systemNumber', label: 'System Number', type: 'text', required: false, placeholder: '00' },
  { key: 'username', label: 'Username', type: 'text', required: true, placeholder: 'SAP_USER' },
  { key: 'password', label: 'Password', type: 'password', required: true, placeholder: '********' },
  { key: 'language', label: 'Language', type: 'text', required: false, placeholder: 'EN' },
];

const ORACLE_FIELDS = [
  { key: 'baseUrl', label: 'Oracle REST API URL', type: 'text', required: true, placeholder: 'https://your-oracle-instance.com/fscmRestApi' },
  { key: 'tenantId', label: 'Tenant ID', type: 'text', required: false, placeholder: 'Optional for cloud' },
  { key: 'username', label: 'Username', type: 'text', required: true, placeholder: 'ORACLE_USER' },
  { key: 'password', label: 'Password', type: 'password', required: true, placeholder: '********' },
  { key: 'apiVersion', label: 'API Version', type: 'text', required: false, placeholder: '11.13.18.05' },
];

export const ConnectionWizard = ({
  isOpen,
  onClose,
  onSave,
  editingIntegration,
}: ConnectionWizardProps) => {
  const [step, setStep] = useState<WizardStep>('type');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [integrationType, setIntegrationType] = useState<IntegrationType>('sap');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [connectionConfig, setConnectionConfig] = useState<Record<string, string>>({});
  const [syncSettings, setSyncSettings] = useState({
    syncAssets: true,
    syncInventory: true,
    syncWorkOrders: false,
    syncPurchaseOrders: false,
    syncInterval: 60,
    autoSync: false,
  });

  useEffect(() => {
    if (editingIntegration) {
      setIntegrationType(editingIntegration.type);
      setName(editingIntegration.name);
      setDescription(editingIntegration.description || '');
      setConnectionConfig(editingIntegration.connectionConfig as Record<string, string>);
      setSyncSettings({
        syncAssets: editingIntegration.syncSettings?.syncAssets ?? true,
        syncInventory: editingIntegration.syncSettings?.syncInventory ?? true,
        syncWorkOrders: editingIntegration.syncSettings?.syncWorkOrders ?? false,
        syncPurchaseOrders: editingIntegration.syncSettings?.syncPurchaseOrders ?? false,
        syncInterval: editingIntegration.syncSettings?.syncInterval ?? 60,
        autoSync: editingIntegration.syncSettings?.autoSync ?? false,
      });
      setStep('connection');
    } else {
      resetForm();
    }
  }, [editingIntegration, isOpen]);

  const resetForm = () => {
    setStep('type');
    setIntegrationType('sap');
    setName('');
    setDescription('');
    setConnectionConfig({});
    setSyncSettings({
      syncAssets: true,
      syncInventory: true,
      syncWorkOrders: false,
      syncPurchaseOrders: false,
      syncInterval: 60,
      autoSync: false,
    });
    setError('');
  };

  const getConnectionFields = () => {
    switch (integrationType) {
      case 'sap':
        return SAP_FIELDS;
      case 'oracle':
        return ORACLE_FIELDS;
      default:
        return [];
    }
  };

  const validateStep = (): boolean => {
    setError('');

    if (step === 'connection') {
      if (!name.trim()) {
        setError('Integration name is required');
        return false;
      }

      const fields = getConnectionFields();
      for (const field of fields) {
        if (field.required && !connectionConfig[field.key]) {
          setError(`${field.label} is required`);
          return false;
        }
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;

    const steps: WizardStep[] = ['type', 'connection', 'settings', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: WizardStep[] = ['type', 'connection', 'settings', 'review'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const data = {
        type: integrationType,
        name,
        description: description || undefined,
        connectionConfig,
        syncSettings,
        isActive: true,
      };

      if (editingIntegration) {
        await integrationsApi.update(editingIntegration.id, data);
      } else {
        await integrationsApi.create(data);
      }

      onSave();
      onClose();
      resetForm();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save integration');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingIntegration ? 'Edit Integration' : 'Add New Integration'}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Steps */}
            <div className="flex items-center gap-2 mt-4">
              {['type', 'connection', 'settings', 'review'].map((s, index) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === s ? 'bg-blue-600 text-white' :
                    ['type', 'connection', 'settings', 'review'].indexOf(step) > index ?
                    'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {['type', 'connection', 'settings', 'review'].indexOf(step) > index ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && (
                    <div className={`w-12 h-1 mx-1 rounded ${
                      ['type', 'connection', 'settings', 'review'].indexOf(step) > index ?
                      'bg-green-200' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Select Type */}
            {step === 'type' && (
              <div className="space-y-4">
                <p className="text-gray-600">Select the ERP system you want to connect to:</p>
                <div className="grid gap-4">
                  {INTEGRATION_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => !type.disabled && setIntegrationType(type.value)}
                      disabled={type.disabled}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        integrationType === type.value
                          ? 'border-blue-500 bg-blue-50'
                          : type.disabled
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          type.color === 'blue' ? 'bg-blue-100' :
                          type.color === 'red' ? 'bg-red-100' : 'bg-purple-100'
                        }`}>
                          <svg
                            className={`w-6 h-6 ${
                              type.color === 'blue' ? 'text-blue-600' :
                              type.color === 'red' ? 'text-red-600' : 'text-purple-600'
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={type.icon} />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{type.label}</h3>
                          <p className="text-sm text-gray-500">{type.description}</p>
                        </div>
                        {integrationType === type.value && (
                          <svg className="w-6 h-6 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Connection Details */}
            {step === 'connection' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Integration Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="My SAP Integration"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <hr className="my-4" />

                <h3 className="font-medium text-gray-900">Connection Settings</h3>

                {getConnectionFields().map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label} {field.required && '*'}
                    </label>
                    <input
                      type={field.type}
                      value={connectionConfig[field.key] || ''}
                      onChange={(e) => setConnectionConfig({ ...connectionConfig, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Step 3: Sync Settings */}
            {step === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Data to Sync</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'syncAssets', label: 'Assets', desc: 'Sync equipment and asset data from ERP' },
                      { key: 'syncInventory', label: 'Inventory', desc: 'Sync materials and inventory levels' },
                      { key: 'syncWorkOrders', label: 'Work Orders', desc: 'Push work orders to ERP system' },
                      { key: 'syncPurchaseOrders', label: 'Purchase Orders', desc: 'Create purchase orders in ERP' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={syncSettings[item.key as keyof typeof syncSettings] as boolean}
                          onChange={(e) => setSyncSettings({ ...syncSettings, [item.key]: e.target.checked })}
                          className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                        />
                        <div>
                          <span className="font-medium text-gray-900">{item.label}</span>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Automatic Sync</h3>
                  <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={syncSettings.autoSync}
                      onChange={(e) => setSyncSettings({ ...syncSettings, autoSync: e.target.checked })}
                      className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <div className="flex-1">
                      <span className="font-medium text-gray-900">Enable automatic sync</span>
                      <p className="text-sm text-gray-500">Automatically sync data at regular intervals</p>
                      {syncSettings.autoSync && (
                        <div className="mt-2">
                          <label className="text-sm text-gray-600">Sync every</label>
                          <select
                            value={syncSettings.syncInterval}
                            onChange={(e) => setSyncSettings({ ...syncSettings, syncInterval: parseInt(e.target.value) })}
                            className="ml-2 px-3 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={120}>2 hours</option>
                            <option value={360}>6 hours</option>
                            <option value={720}>12 hours</option>
                            <option value={1440}>24 hours</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 'review' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Integration Summary</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Name</dt>
                      <dd className="font-medium text-gray-900">{name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Type</dt>
                      <dd className="font-medium text-gray-900 uppercase">{integrationType}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Server URL</dt>
                      <dd className="font-medium text-gray-900 truncate max-w-xs">{connectionConfig.baseUrl}</dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Sync Configuration</h3>
                  <div className="flex flex-wrap gap-2">
                    {syncSettings.syncAssets && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">Assets</span>
                    )}
                    {syncSettings.syncInventory && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">Inventory</span>
                    )}
                    {syncSettings.syncWorkOrders && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">Work Orders</span>
                    )}
                    {syncSettings.syncPurchaseOrders && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">Purchase Orders</span>
                    )}
                  </div>
                  {syncSettings.autoSync && (
                    <p className="mt-2 text-sm text-gray-600">
                      Auto-sync enabled every {syncSettings.syncInterval} minutes
                    </p>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-2">
                    <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Connection credentials will be encrypted</p>
                      <p>Your ERP credentials are stored securely and encrypted at rest.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={step === 'type' ? onClose : handleBack}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              {step === 'type' ? 'Cancel' : 'Back'}
            </button>

            {step === 'review' ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                {editingIntegration ? 'Update Integration' : 'Create Integration'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
