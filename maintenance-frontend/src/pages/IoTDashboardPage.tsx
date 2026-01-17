import { useState, useEffect } from 'react';

interface IoTSensor {
  id: string;
  name: string;
  assetName: string;
  type: 'temperature' | 'vibration' | 'pressure' | 'flow' | 'current';
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  lastReading: string;
  threshold: { min: number; max: number };
}

export const IoTDashboardPage = () => {
  const [sensors, setSensors] = useState<IoTSensor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSensors();
    // Simulate real-time updates
    const interval = setInterval(() => {
      updateSensorValues();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadSensors = async () => {
    setLoading(true);
    const mockSensors: IoTSensor[] = [
      {
        id: '1',
        name: 'Temp Sensor 001',
        assetName: 'CNC Machine #3',
        type: 'temperature',
        value: 72.5,
        unit: '°F',
        status: 'normal',
        lastReading: new Date().toISOString(),
        threshold: { min: 60, max: 90 },
      },
      {
        id: '2',
        name: 'Vibration Sensor 002',
        assetName: 'Hydraulic Press A',
        type: 'vibration',
        value: 2.8,
        unit: 'mm/s',
        status: 'warning',
        lastReading: new Date().toISOString(),
        threshold: { min: 0, max: 2.5 },
      },
      {
        id: '3',
        name: 'Pressure Sensor 003',
        assetName: 'Compressor Unit',
        type: 'pressure',
        value: 125,
        unit: 'PSI',
        status: 'normal',
        lastReading: new Date().toISOString(),
        threshold: { min: 100, max: 150 },
      },
      {
        id: '4',
        name: 'Flow Meter 004',
        assetName: 'Cooling System',
        type: 'flow',
        value: 45.2,
        unit: 'GPM',
        status: 'normal',
        lastReading: new Date().toISOString(),
        threshold: { min: 40, max: 60 },
      },
      {
        id: '5',
        name: 'Current Sensor 005',
        assetName: 'Main Motor',
        type: 'current',
        value: 98,
        unit: 'A',
        status: 'critical',
        lastReading: new Date().toISOString(),
        threshold: { min: 0, max: 85 },
      },
    ];
    setSensors(mockSensors);
    setLoading(false);
  };

  const updateSensorValues = () => {
    setSensors(prev => prev.map(sensor => ({
      ...sensor,
      value: sensor.value + (Math.random() - 0.5) * 2,
      lastReading: new Date().toISOString(),
    })));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSensorIcon = (type: string) => {
    switch (type) {
      case 'temperature':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5" />;
      case 'vibration':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />;
      case 'pressure':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />;
      case 'flow':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />;
      case 'current':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />;
      default:
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />;
    }
  };

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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">IoT Dashboard</h1>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">Enterprise</span>
                <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live
                </span>
              </div>
              <p className="text-sm text-gray-500">Real-time sensor monitoring and alerts</p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Add Sensor
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Connected Sensors</p>
            <p className="text-2xl font-bold text-gray-900">{sensors.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Normal</p>
            <p className="text-2xl font-bold text-green-600">
              {sensors.filter(s => s.status === 'normal').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Warning</p>
            <p className="text-2xl font-bold text-yellow-600">
              {sensors.filter(s => s.status === 'warning').length}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Critical</p>
            <p className="text-2xl font-bold text-red-600">
              {sensors.filter(s => s.status === 'critical').length}
            </p>
          </div>
        </div>

        {/* Sensor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map((sensor) => (
            <div key={sensor.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${sensor.status === 'normal' ? 'bg-green-100' : sensor.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'}`}>
                    <svg className={`w-5 h-5 ${sensor.status === 'normal' ? 'text-green-600' : sensor.status === 'warning' ? 'text-yellow-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {getSensorIcon(sensor.type)}
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{sensor.name}</h3>
                    <p className="text-sm text-gray-500">{sensor.assetName}</p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${getStatusColor(sensor.status)} ${sensor.status !== 'normal' ? 'animate-pulse' : ''}`} />
              </div>

              <div className="mb-4">
                <p className="text-3xl font-bold text-gray-900">
                  {sensor.value.toFixed(1)}
                  <span className="text-lg text-gray-500 ml-1">{sensor.unit}</span>
                </p>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Min: {sensor.threshold.min}</span>
                  <span>Max: {sensor.threshold.max}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getStatusColor(sensor.status)}`}
                    style={{
                      width: `${Math.min(100, Math.max(0, ((sensor.value - sensor.threshold.min) / (sensor.threshold.max - sensor.threshold.min)) * 100))}%`
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  Last: {new Date(sensor.lastReading).toLocaleTimeString()}
                </span>
                <button className="text-blue-600 hover:text-blue-800">View History</button>
              </div>
            </div>
          ))}
        </div>

        {/* Gateway Status */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">IoT Gateways</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Gateway A - Production Floor</p>
                <p className="text-sm text-gray-500">12 sensors connected</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium">Gateway B - Warehouse</p>
                <p className="text-sm text-gray-500">8 sensors connected</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
              <div>
                <p className="font-medium">Gateway C - Utilities</p>
                <p className="text-sm text-gray-500">5 sensors connected (1 offline)</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IoTDashboardPage;
