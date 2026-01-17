import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface AssetLocation {
  locationId?: string;
  locationName?: string;
  address?: string;
  coordinates?: string;
  region?: string;
  clientOrgId?: string;
  createdAt?: string;
}

interface Asset {
  id: string;
  assetCode: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  criticality: number;
  location?: AssetLocation | string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  warrantyExpiry?: string;
  depreciationMethod?: string;
  currentValue?: number;
  parentAssetId?: string;
  parentAsset?: { id: string; name: string };
  childAssets?: { id: string; name: string; assetCode: string }[];
  meterReadings?: { id: string; value: number; unit: string; readingDate: string }[];
  workOrders?: { id: string; woNumber: string; title: string; status: string; createdAt: string }[];
  documents?: { id: string; name: string; type: string; url: string; uploadedAt: string }[];
  history?: { id: string; action: string; description: string; performedBy: string; performedAt: string }[];
  specifications?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Helper to get location display string
const getLocationDisplay = (location?: AssetLocation | string): string => {
  if (!location) return '-';
  if (typeof location === 'string') return location;
  return location.locationName || location.address || '-';
};

export const AssetDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      loadAsset(id);
    }
  }, [id]);

  const loadAsset = async (assetId: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/assets/${assetId}`);
      setAsset(response.data?.data || response.data);
    } catch (error) {
      console.error('Failed to load asset:', error);
      // Mock data for demo
      setAsset({
        id: assetId,
        assetCode: 'AST-001',
        name: 'HVAC Unit - Building A',
        description: 'Main HVAC system for the office building',
        type: 'HVAC',
        status: 'active',
        criticality: 4,
        location: 'Building A, Floor 1',
        manufacturer: 'Carrier',
        model: 'AquaForce 30XA',
        serialNumber: 'CAR-2024-001234',
        purchaseDate: '2022-03-15',
        purchasePrice: 45000,
        warrantyExpiry: '2027-03-15',
        depreciationMethod: 'straight_line',
        currentValue: 36000,
        meterReadings: [
          { id: '1', value: 12500, unit: 'hours', readingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '2', value: 12300, unit: 'hours', readingDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
        ],
        workOrders: [
          { id: '1', woNumber: 'WO-001', title: 'Quarterly Inspection', status: 'completed', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
          { id: '2', woNumber: 'WO-002', title: 'Filter Replacement', status: 'in_progress', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
        ],
        history: [
          { id: '1', action: 'Created', description: 'Asset created', performedBy: 'Admin', performedAt: '2022-03-15T10:00:00Z' },
          { id: '2', action: 'Maintenance', description: 'Quarterly maintenance completed', performedBy: 'John Smith', performedAt: '2023-06-15T14:30:00Z' },
        ],
        specifications: {
          'Cooling Capacity': '100 tons',
          'Power Consumption': '75 kW',
          'Refrigerant Type': 'R-134a',
        },
        createdAt: '2022-03-15T10:00:00Z',
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'inactive': return 'bg-gray-100 text-gray-700';
      case 'under_maintenance': return 'bg-yellow-100 text-yellow-700';
      case 'decommissioned': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getCriticalityLabel = (criticality: number) => {
    switch (criticality) {
      case 5: return { label: 'Critical', color: 'bg-red-100 text-red-700' };
      case 4: return { label: 'High', color: 'bg-orange-100 text-orange-700' };
      case 3: return { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' };
      case 2: return { label: 'Low', color: 'bg-blue-100 text-blue-700' };
      case 1: return { label: 'Very Low', color: 'bg-gray-100 text-gray-700' };
      default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Asset not found</p>
        <button onClick={() => navigate('/assets')} className="mt-4 text-blue-600 hover:underline">
          Back to Assets
        </button>
      </div>
    );
  }

  const criticality = getCriticalityLabel(asset.criticality);
  const tabs = ['overview', 'work-orders', 'meters', 'documents', 'history'];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <button
              onClick={() => navigate('/assets')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Assets
            </button>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{asset.name}</h1>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(asset.status)}`}>
                    {asset.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-500 mt-1">{asset.assetCode} | {asset.type}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Edit
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create Work Order
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-gray-900">{asset.description || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-gray-900">{getLocationDisplay(asset.location)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Manufacturer</p>
                    <p className="text-gray-900">{asset.manufacturer || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Model</p>
                    <p className="text-gray-900">{asset.model || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Serial Number</p>
                    <p className="text-gray-900 font-mono">{asset.serialNumber || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Criticality</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${criticality.color}`}>
                      {criticality.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Purchase Date</p>
                    <p className="text-gray-900">{asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Purchase Price</p>
                    <p className="text-gray-900">{asset.purchasePrice ? formatCurrency(asset.purchasePrice) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Current Value</p>
                    <p className="text-gray-900">{asset.currentValue ? formatCurrency(asset.currentValue) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Warranty Expiry</p>
                    <p className="text-gray-900">{asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : '-'}</p>
                  </div>
                </div>
              </div>

              {asset.specifications && Object.keys(asset.specifications).length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(asset.specifications).map(([key, value]) => (
                      <div key={key}>
                        <p className="text-sm text-gray-500">{key}</p>
                        <p className="text-gray-900">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Work Orders</span>
                    <span className="font-medium text-gray-900">{asset.workOrders?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Meter Readings</span>
                    <span className="font-medium text-gray-900">{asset.meterReadings?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Documents</span>
                    <span className="font-medium text-gray-900">{asset.documents?.length || 0}</span>
                  </div>
                </div>
              </div>

              {/* Latest Meter Reading */}
              {asset.meterReadings && asset.meterReadings.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Latest Meter Reading</h3>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">
                      {asset.meterReadings[0].value.toLocaleString()}
                    </p>
                    <p className="text-gray-500">{asset.meterReadings[0].unit}</p>
                    <p className="text-sm text-gray-400 mt-2">
                      {new Date(asset.meterReadings[0].readingDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                    Add Reading
                  </button>
                </div>
              )}

              {/* QR Code */}
              <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h3>
                <div className="w-32 h-32 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <button className="mt-4 text-blue-600 hover:underline text-sm">
                  Download QR Code
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'work-orders' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">WO Number</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Title</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {asset.workOrders?.map((wo) => (
                  <tr key={wo.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="py-3 px-4 font-medium text-blue-600">{wo.woNumber}</td>
                    <td className="py-3 px-4 text-gray-900">{wo.title}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        wo.status === 'completed' ? 'bg-green-100 text-green-700' :
                        wo.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {wo.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">{new Date(wo.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(!asset.workOrders || asset.workOrders.length === 0) && (
              <div className="text-center py-12 text-gray-500">No work orders found</div>
            )}
          </div>
        )}

        {activeTab === 'meters' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Meter Readings</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Reading
              </button>
            </div>
            <div className="space-y-4">
              {asset.meterReadings?.map((reading) => (
                <div key={reading.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{reading.value.toLocaleString()} {reading.unit}</p>
                    <p className="text-sm text-gray-500">{new Date(reading.readingDate).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {(!asset.meterReadings || asset.meterReadings.length === 0) && (
                <div className="text-center py-12 text-gray-500">No meter readings recorded</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Upload Document
              </button>
            </div>
            {(!asset.documents || asset.documents.length === 0) && (
              <div className="text-center py-12 text-gray-500">No documents uploaded</div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset History</h3>
            <div className="space-y-4">
              {asset.history?.map((event) => (
                <div key={event.id} className="flex items-start gap-4 p-4 border-l-4 border-blue-500 bg-gray-50 rounded-r-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{event.action}</p>
                    <p className="text-sm text-gray-600">{event.description}</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {event.performedBy} | {new Date(event.performedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!asset.history || asset.history.length === 0) && (
                <div className="text-center py-12 text-gray-500">No history recorded</div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AssetDetailPage;
