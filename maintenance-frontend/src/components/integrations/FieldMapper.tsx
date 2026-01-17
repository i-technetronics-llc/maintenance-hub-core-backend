import { useState, useEffect } from 'react';
import { IntegrationConfig, IntegrationType, integrationsApi } from '../../services/api';

interface FieldMapperProps {
  isOpen: boolean;
  onClose: () => void;
  integration: IntegrationConfig | null;
  onSave: () => void;
}

const ENTITY_TYPES = [
  { key: 'assets', label: 'Assets', description: 'Map ERP equipment fields to asset fields' },
  { key: 'inventory', label: 'Inventory', description: 'Map ERP material fields to inventory fields' },
  { key: 'workOrders', label: 'Work Orders', description: 'Map work order fields for ERP sync' },
  { key: 'purchaseOrders', label: 'Purchase Orders', description: 'Map purchase order fields for ERP sync' },
];

const INTERNAL_FIELDS = {
  assets: [
    { key: 'externalId', label: 'External ID', required: true },
    { key: 'name', label: 'Name', required: true },
    { key: 'type', label: 'Type', required: false },
    { key: 'category', label: 'Category', required: false },
    { key: 'serialNumber', label: 'Serial Number', required: false },
    { key: 'manufacturer', label: 'Manufacturer', required: false },
    { key: 'model', label: 'Model', required: false },
    { key: 'location', label: 'Location', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'purchaseDate', label: 'Purchase Date', required: false },
    { key: 'purchasePrice', label: 'Purchase Price', required: false },
    { key: 'warrantyExpiry', label: 'Warranty Expiry', required: false },
  ],
  inventory: [
    { key: 'externalId', label: 'External ID', required: true },
    { key: 'name', label: 'Name', required: true },
    { key: 'description', label: 'Description', required: false },
    { key: 'category', label: 'Category', required: false },
    { key: 'unit', label: 'Unit', required: false },
    { key: 'quantity', label: 'Quantity', required: false },
    { key: 'unitPrice', label: 'Unit Price', required: false },
    { key: 'minQuantity', label: 'Min Quantity', required: false },
    { key: 'maxQuantity', label: 'Max Quantity', required: false },
    { key: 'location', label: 'Location', required: false },
    { key: 'supplier', label: 'Supplier', required: false },
    { key: 'manufacturer', label: 'Manufacturer', required: false },
  ],
  workOrders: [
    { key: 'externalId', label: 'External ID', required: true },
    { key: 'title', label: 'Title', required: true },
    { key: 'description', label: 'Description', required: false },
    { key: 'type', label: 'Type', required: false },
    { key: 'priority', label: 'Priority', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'assetExternalId', label: 'Asset External ID', required: false },
    { key: 'scheduledDate', label: 'Scheduled Date', required: false },
    { key: 'dueDate', label: 'Due Date', required: false },
    { key: 'estimatedCost', label: 'Estimated Cost', required: false },
    { key: 'actualCost', label: 'Actual Cost', required: false },
  ],
  purchaseOrders: [
    { key: 'externalId', label: 'External ID', required: true },
    { key: 'poNumber', label: 'PO Number', required: false },
    { key: 'vendorId', label: 'Vendor ID', required: false },
    { key: 'vendorName', label: 'Vendor Name', required: false },
    { key: 'status', label: 'Status', required: false },
    { key: 'orderDate', label: 'Order Date', required: false },
    { key: 'expectedDeliveryDate', label: 'Expected Delivery', required: false },
    { key: 'totalAmount', label: 'Total Amount', required: false },
    { key: 'currency', label: 'Currency', required: false },
  ],
};

export const FieldMapper = ({
  isOpen,
  onClose,
  integration,
  onSave,
}: FieldMapperProps) => {
  const [activeEntity, setActiveEntity] = useState('assets');
  const [mappings, setMappings] = useState<Record<string, Record<string, string>>>({});
  const [defaultMappings, setDefaultMappings] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (integration && isOpen) {
      setMappings(integration.mappings || {});
      loadDefaultMappings(integration.type);
    }
  }, [integration, isOpen]);

  const loadDefaultMappings = async (type: IntegrationType) => {
    try {
      const defaults = await integrationsApi.getDefaultMappings(type);
      setDefaultMappings(defaults);
    } catch (err) {
      console.error('Failed to load default mappings:', err);
    }
  };

  const getErpFieldsForEntity = (entityType: string): string[] => {
    const entityMappings = defaultMappings[entityType] || {};
    return Object.keys(entityMappings);
  };

  const getCurrentMapping = (entityType: string, erpField: string): string => {
    return mappings[entityType]?.[erpField] || defaultMappings[entityType]?.[erpField] || '';
  };

  const handleMappingChange = (entityType: string, erpField: string, internalField: string) => {
    setMappings((prev) => ({
      ...prev,
      [entityType]: {
        ...prev[entityType],
        [erpField]: internalField,
      },
    }));
  };

  const handleResetToDefaults = (entityType: string) => {
    setMappings((prev) => ({
      ...prev,
      [entityType]: { ...defaultMappings[entityType] },
    }));
  };

  const handleSave = async () => {
    if (!integration) return;

    setSaving(true);
    setError('');

    try {
      await integrationsApi.updateMappings(integration.id, mappings);
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save mappings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !integration) return null;

  const erpFields = getErpFieldsForEntity(activeEntity);
  const internalFields = INTERNAL_FIELDS[activeEntity as keyof typeof INTERNAL_FIELDS] || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Field Mappings</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Configure how {integration.type.toUpperCase()} fields map to internal fields
                </p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Entity Tabs */}
          <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-2">
              {ENTITY_TYPES.map((entity) => (
                <button
                  key={entity.key}
                  onClick={() => setActiveEntity(entity.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeEntity === entity.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {entity.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {ENTITY_TYPES.find((e) => e.key === activeEntity)?.description}
              </p>
              <button
                onClick={() => handleResetToDefaults(activeEntity)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Reset to Defaults
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg border border-gray-200">
              {/* Table Header */}
              <div className="grid grid-cols-2 gap-4 px-4 py-3 bg-gray-100 rounded-t-lg font-medium text-sm text-gray-700">
                <div>{integration.type.toUpperCase()} Field</div>
                <div>Internal Field</div>
              </div>

              {/* Mapping Rows */}
              <div className="divide-y divide-gray-200">
                {erpFields.length > 0 ? (
                  erpFields.map((erpField) => (
                    <div key={erpField} className="grid grid-cols-2 gap-4 px-4 py-3 items-center">
                      <div>
                        <code className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">
                          {erpField}
                        </code>
                      </div>
                      <div>
                        <select
                          value={getCurrentMapping(activeEntity, erpField)}
                          onChange={(e) => handleMappingChange(activeEntity, erpField, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">-- Not Mapped --</option>
                          {internalFields.map((field) => (
                            <option key={field.key} value={field.key}>
                              {field.label} {field.required && '*'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    <p>No default mappings available for this entity type.</p>
                    <p className="text-sm mt-1">You can add custom mappings manually.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Add Custom Mapping */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Add Custom Mapping</h4>
              <p className="text-sm text-blue-700 mb-3">
                Add a custom ERP field mapping that isn't in the defaults.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ERP Field Name"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  id="customErpField"
                />
                <select
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  id="customInternalField"
                >
                  <option value="">Select Internal Field</option>
                  {internalFields.map((field) => (
                    <option key={field.key} value={field.key}>
                      {field.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const erpField = (document.getElementById('customErpField') as HTMLInputElement)?.value;
                    const internalField = (document.getElementById('customInternalField') as HTMLSelectElement)?.value;
                    if (erpField && internalField) {
                      handleMappingChange(activeEntity, erpField, internalField);
                      (document.getElementById('customErpField') as HTMLInputElement).value = '';
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
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
              Save Mappings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
