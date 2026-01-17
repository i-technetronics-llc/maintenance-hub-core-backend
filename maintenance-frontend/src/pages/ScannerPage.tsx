import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarcodeScanner, ScanResult, ScanMode } from '../components/BarcodeScanner';
import { api } from '../services/api';

// Asset interface
interface Asset {
  id: string;
  assetCode: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  criticality: number;
  location?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  meterReadings?: { value: number; unit: string; readingDate: string }[];
}

// Inventory item interface
interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  minQuantity: number;
  unit?: string;
  location?: string;
  status: string;
}

type ScanResultType = 'asset' | 'inventory' | 'unknown';

interface ParsedScanResult {
  type: ScanResultType;
  id?: string;
  code?: string;
  data?: Asset | InventoryItem | null;
  rawValue: string;
}

export const ScannerPage = () => {
  const navigate = useNavigate();
  const [scanMode, setScanMode] = useState<ScanMode>('all');
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [showManualEntry, setShowManualEntry] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ParsedScanResult | null>(null);
  const [_error, setError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<ParsedScanResult[]>([]);

  // Load recent scans from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentScans');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setRecentScans(parsed.slice(0, 10)); // Keep last 10
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Save recent scans to localStorage
  const saveRecentScan = useCallback((result: ParsedScanResult) => {
    setRecentScans(prev => {
      const updated = [result, ...prev.filter(r => r.rawValue !== result.rawValue)].slice(0, 10);
      localStorage.setItem('recentScans', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Parse QR code data
  const parseQRCode = (rawValue: string): { type: ScanResultType; id?: string; code?: string } => {
    // Check for asset QR code format: ASSET:AST-001 or asset:UUID or URL with asset ID
    const assetPatterns = [
      /^ASSET:(.+)$/i,
      /^asset:(.+)$/i,
      /\/assets\/([a-f0-9-]+)$/i,
      /^AST-\d+$/i,
    ];

    for (const pattern of assetPatterns) {
      const match = rawValue.match(pattern);
      if (match) {
        return { type: 'asset', code: match[1] || rawValue };
      }
    }

    // Check for inventory QR code format: INV:SKU-001 or inventory:UUID or SKU pattern
    const inventoryPatterns = [
      /^INV:(.+)$/i,
      /^inventory:(.+)$/i,
      /\/inventory\/([a-f0-9-]+)$/i,
      /^SKU-\d+$/i,
    ];

    for (const pattern of inventoryPatterns) {
      const match = rawValue.match(pattern);
      if (match) {
        return { type: 'inventory', code: match[1] || rawValue };
      }
    }

    // Check for UUID format (could be either)
    const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
    if (uuidPattern.test(rawValue)) {
      return { type: 'unknown', id: rawValue };
    }

    return { type: 'unknown', code: rawValue };
  };

  // Fetch asset data
  const fetchAsset = async (idOrCode: string): Promise<Asset | null> => {
    try {
      // Try by ID first
      const response = await api.get(`/assets/${idOrCode}`);
      return response.data?.data || response.data;
    } catch {
      // Try by asset code
      try {
        const response = await api.get('/assets', { params: { search: idOrCode } });
        const assets = response.data?.data?.data || response.data?.data || response.data || [];
        if (Array.isArray(assets) && assets.length > 0) {
          const found = assets.find((a: Asset) =>
            a.assetCode?.toLowerCase() === idOrCode.toLowerCase() ||
            a.id === idOrCode
          );
          return found || null;
        }
      } catch {
        // Asset not found
      }
    }
    return null;
  };

  // Fetch inventory data
  const fetchInventory = async (idOrSku: string): Promise<InventoryItem | null> => {
    try {
      // Try by ID first
      const response = await api.get(`/inventory/${idOrSku}`);
      return response.data?.data || response.data;
    } catch {
      // Try by SKU
      try {
        const response = await api.get(`/inventory/sku/${idOrSku}`);
        return response.data?.data || response.data;
      } catch {
        // Try by search
        try {
          const response = await api.get('/inventory', { params: { search: idOrSku } });
          const items = response.data?.data?.data || response.data?.data || response.data || [];
          if (Array.isArray(items) && items.length > 0) {
            const found = items.find((i: InventoryItem) =>
              i.sku?.toLowerCase() === idOrSku.toLowerCase() ||
              i.id === idOrSku
            );
            return found || null;
          }
        } catch {
          // Item not found
        }
      }
    }
    return null;
  };

  // Handle scan result
  const handleScan = useCallback(async (result: ScanResult) => {
    setIsScanning(false);
    setIsLoading(true);
    setError(null);

    const parsed = parseQRCode(result.rawValue);
    const parsedResult: ParsedScanResult = {
      type: parsed.type,
      id: parsed.id,
      code: parsed.code,
      rawValue: result.rawValue,
      data: null,
    };

    try {
      // Try to fetch data based on type
      if (parsed.type === 'asset' || parsed.type === 'unknown') {
        const asset = await fetchAsset(parsed.code || parsed.id || result.rawValue);
        if (asset) {
          parsedResult.type = 'asset';
          parsedResult.data = asset;
        }
      }

      if (!parsedResult.data && (parsed.type === 'inventory' || parsed.type === 'unknown')) {
        const inventory = await fetchInventory(parsed.code || parsed.id || result.rawValue);
        if (inventory) {
          parsedResult.type = 'inventory';
          parsedResult.data = inventory;
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }

    setScanResult(parsedResult);
    saveRecentScan(parsedResult);
    setIsLoading(false);
  }, [saveRecentScan]);

  // Handle manual code submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    await handleScan({
      rawValue: manualCode.trim(),
      format: 'manual',
      timestamp: new Date(),
      mode: scanMode,
    });
    setManualCode('');
    setShowManualEntry(false);
  };

  // Handle scanner error
  const handleScanError = (error: Error) => {
    console.error('Scanner error:', error);
    setError(error.message);
    setShowManualEntry(true);
  };

  // Reset and scan again
  const handleScanAgain = () => {
    setScanResult(null);
    setError(null);
    setIsScanning(true);
  };

  // Navigation actions
  const handleViewAsset = (assetId: string) => {
    navigate(`/assets/${assetId}`);
  };

  const handleCreateWorkOrder = (assetId: string) => {
    navigate(`/work-orders?createFor=${assetId}`);
  };

  const handleViewInventory = (inventoryId: string) => {
    navigate(`/inventory?item=${inventoryId}`);
  };

  const handleRecordMeterReading = (assetId: string) => {
    navigate(`/assets/${assetId}?tab=meters&action=add`);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'in_stock':
        return 'bg-green-100 text-green-700';
      case 'inactive':
      case 'out_of_stock':
        return 'bg-red-100 text-red-700';
      case 'under_maintenance':
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">QR/Barcode Scanner</h1>
            <p className="text-sm text-gray-500 mt-1">Scan asset or inventory codes</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowManualEntry(!showManualEntry)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span className="hidden sm:inline">Manual Entry</span>
            </button>
          </div>
        </div>

        {/* Scan mode selector */}
        <div className="mt-4 flex gap-2">
          {(['all', 'asset', 'inventory'] as ScanMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setScanMode(mode)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                scanMode === mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode === 'all' ? 'All Codes' : mode === 'asset' ? 'Assets' : 'Inventory'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Manual entry form */}
        {showManualEntry && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Enter Code Manually</h2>
            <form onSubmit={handleManualSubmit} className="flex gap-3">
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter asset code or SKU..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
              <button
                type="submit"
                disabled={!manualCode.trim() || isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>
        )}

        {/* Scanner */}
        {isScanning && !scanResult && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <BarcodeScanner
              onScan={handleScan}
              onError={handleScanError}
              mode={scanMode}
              enabled={isScanning}
              className="w-full"
            />
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-500">Looking up scanned code...</p>
          </div>
        )}

        {/* Scan result */}
        {scanResult && !isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Result header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    scanResult.data ? 'bg-green-100' : 'bg-yellow-100'
                  }`}>
                    {scanResult.data ? (
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Scanned Code</p>
                    <p className="font-mono text-lg font-semibold text-gray-900">{scanResult.rawValue}</p>
                  </div>
                </div>
                <button
                  onClick={handleScanAgain}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Scan Again
                </button>
              </div>
            </div>

            {/* Result content */}
            <div className="p-6">
              {scanResult.data ? (
                scanResult.type === 'asset' ? (
                  // Asset details
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {(scanResult.data as Asset).name}
                          </h3>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor((scanResult.data as Asset).status)}`}>
                            {(scanResult.data as Asset).status?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-gray-500 mt-1">
                          {(scanResult.data as Asset).assetCode} | {(scanResult.data as Asset).type}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                        Asset
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">{(scanResult.data as Asset).location || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Manufacturer</p>
                        <p className="font-medium text-gray-900">{(scanResult.data as Asset).manufacturer || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Model</p>
                        <p className="font-medium text-gray-900">{(scanResult.data as Asset).model || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Serial Number</p>
                        <p className="font-medium font-mono text-gray-900">{(scanResult.data as Asset).serialNumber || '-'}</p>
                      </div>
                      {(scanResult.data as Asset).warrantyExpiry && (
                        <div>
                          <p className="text-sm text-gray-500">Warranty Expires</p>
                          <p className="font-medium text-gray-900">
                            {new Date((scanResult.data as Asset).warrantyExpiry!).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {(scanResult.data as Asset).meterReadings && (scanResult.data as Asset).meterReadings!.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500">Latest Reading</p>
                          <p className="font-medium text-gray-900">
                            {(scanResult.data as Asset).meterReadings![0].value.toLocaleString()} {(scanResult.data as Asset).meterReadings![0].unit}
                          </p>
                        </div>
                      )}
                    </div>

                    {(scanResult.data as Asset).description && (
                      <div>
                        <p className="text-sm text-gray-500">Description</p>
                        <p className="text-gray-700 mt-1">{(scanResult.data as Asset).description}</p>
                      </div>
                    )}

                    {/* Quick actions */}
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleViewAsset((scanResult.data as Asset).id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </button>
                        <button
                          onClick={() => handleCreateWorkOrder((scanResult.data as Asset).id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Create Work Order
                        </button>
                        <button
                          onClick={() => handleRecordMeterReading((scanResult.data as Asset).id)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Record Reading
                        </button>
                        <button
                          onClick={() => navigate(`/assets/${(scanResult.data as Asset).id}?tab=history`)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          View History
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Inventory details
                  <div className="space-y-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {(scanResult.data as InventoryItem).name}
                          </h3>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor((scanResult.data as InventoryItem).status)}`}>
                            {(scanResult.data as InventoryItem).status?.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-gray-500 mt-1">
                          SKU: {(scanResult.data as InventoryItem).sku} | {(scanResult.data as InventoryItem).category}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                        Inventory
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Quantity</p>
                        <p className={`font-medium text-2xl ${
                          (scanResult.data as InventoryItem).quantity <= (scanResult.data as InventoryItem).minQuantity
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}>
                          {(scanResult.data as InventoryItem).quantity} {(scanResult.data as InventoryItem).unit || 'units'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Min. Quantity</p>
                        <p className="font-medium text-gray-900">{(scanResult.data as InventoryItem).minQuantity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">{(scanResult.data as InventoryItem).location || '-'}</p>
                      </div>
                    </div>

                    {(scanResult.data as InventoryItem).description && (
                      <div>
                        <p className="text-sm text-gray-500">Description</p>
                        <p className="text-gray-700 mt-1">{(scanResult.data as InventoryItem).description}</p>
                      </div>
                    )}

                    {/* Low stock warning */}
                    {(scanResult.data as InventoryItem).quantity <= (scanResult.data as InventoryItem).minQuantity && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="font-medium text-red-800">Low Stock Alert</p>
                          <p className="text-sm text-red-700 mt-1">
                            Current stock is at or below minimum quantity. Consider reordering soon.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Quick actions */}
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h4>
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleViewInventory((scanResult.data as InventoryItem).id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Details
                        </button>
                        <button
                          onClick={() => navigate(`/inventory/transactions?itemId=${(scanResult.data as InventoryItem).id}`)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Adjust Stock
                        </button>
                        <button
                          onClick={() => navigate(`/inventory/transactions?itemId=${(scanResult.data as InventoryItem).id}&type=history`)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          View Transactions
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                // No match found
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Match Found</h3>
                  <p className="text-gray-500 mb-6">
                    The scanned code "{scanResult.rawValue}" was not found in the system.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={handleScanAgain}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Try Another Scan
                    </button>
                    <button
                      onClick={() => navigate('/assets?action=create')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Create New Asset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recent scans */}
        {recentScans.length > 0 && !scanResult && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Scans</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentScans.map((scan, index) => (
                <button
                  key={index}
                  onClick={() => setScanResult(scan)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      scan.type === 'asset' ? 'bg-blue-100' : scan.type === 'inventory' ? 'bg-purple-100' : 'bg-gray-100'
                    }`}>
                      {scan.type === 'asset' ? (
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      ) : scan.type === 'inventory' ? (
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 font-mono">{scan.rawValue}</p>
                      <p className="text-sm text-gray-500">
                        {scan.data ? (
                          scan.type === 'asset'
                            ? (scan.data as Asset).name
                            : (scan.data as InventoryItem).name
                        ) : (
                          'Not found in system'
                        )}
                      </p>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Help section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Scanning Tips</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Good Lighting</p>
                <p className="text-sm text-gray-600">Ensure adequate lighting for best results</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Center the Code</p>
                <p className="text-sm text-gray-600">Keep the code inside the viewfinder frame</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Proper Distance</p>
                <p className="text-sm text-gray-600">Hold camera 6-12 inches from code</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Manual Entry</p>
                <p className="text-sm text-gray-600">Use manual entry if scanning fails</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScannerPage;
