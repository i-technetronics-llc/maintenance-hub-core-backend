import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AssetHealthGauge } from '../components/predictive/AssetHealthGauge';
import { PredictionCard } from '../components/predictive/PredictionCard';
import { AnomalyTimeline } from '../components/predictive/AnomalyTimeline';
import { FailureProbabilityChart } from '../components/predictive/FailureProbabilityChart';
import { useAuthStore } from '../store/authStore';

interface PredictionFactor {
  name: string;
  contribution: number;
  value: number;
  threshold?: number;
  unit?: string;
  description?: string;
}

interface Prediction {
  id: string;
  assetId: string;
  assetName?: string;
  assetTag?: string;
  predictionType: 'anomaly' | 'failure' | 'remaining_life' | 'degradation';
  prediction: string;
  probability: number;
  confidence: number;
  predictedDate?: string;
  remainingLifeDays?: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'acknowledged' | 'work_order_created' | 'resolved' | 'false_positive' | 'dismissed';
  factors: PredictionFactor[];
  recommendedAction?: string;
  estimatedCost?: number;
  potentialSavings?: number;
  createdAt: string;
  asset?: {
    id: string;
    name: string;
    assetCode?: string;
  };
}

interface Anomaly {
  id: string;
  assetId: string;
  assetName?: string;
  sensorType: string;
  value: number;
  unit?: string;
  zScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  message?: string;
}

interface DashboardData {
  activePredictions: number;
  criticalAlerts: number;
  highRiskAlerts: number;
  mediumRiskAlerts: number;
  lowRiskAlerts: number;
  anomaliesLast24h: number;
  failuresPrevented: number;
  potentialSavings: number;
  modelAccuracy: number;
  assetsMonitored: number;
  predictionsByType: Record<string, number>;
  recentPredictions: Prediction[];
  assetHealthScores: Array<{ assetId: string; assetName: string; healthScore: number; riskLevel: string }>;
}

interface PredictionModel {
  id: string;
  name: string;
  assetType: string;
  modelType: string;
  status: string;
  accuracy: number;
  trainingDataPoints: number;
  lastTrainedAt?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const PredictiveMaintenancePage = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'predictions' | 'anomalies' | 'models'>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [models, setModels] = useState<PredictionModel[]>([]);

  // Filters
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [token]);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/api/v1/predictive/dashboard');
      setDashboardData(data.data || data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
      // Use mock data for demo
      setDashboardData({
        activePredictions: 12,
        criticalAlerts: 2,
        highRiskAlerts: 4,
        mediumRiskAlerts: 4,
        lowRiskAlerts: 2,
        anomaliesLast24h: 8,
        failuresPrevented: 15,
        potentialSavings: 45000,
        modelAccuracy: 89,
        assetsMonitored: 156,
        predictionsByType: { failure: 6, anomaly: 4, remaining_life: 2 },
        recentPredictions: [],
        assetHealthScores: [
          { assetId: '1', assetName: 'CNC Machine #3', healthScore: 45, riskLevel: 'high' },
          { assetId: '2', assetName: 'Hydraulic Press A', healthScore: 72, riskLevel: 'medium' },
          { assetId: '3', assetName: 'Conveyor Belt System', healthScore: 88, riskLevel: 'low' },
          { assetId: '4', assetName: 'HVAC Unit 1', healthScore: 25, riskLevel: 'critical' },
          { assetId: '5', assetName: 'Generator B', healthScore: 95, riskLevel: 'low' },
        ],
      });
    }
  }, [fetchWithAuth]);

  const fetchPredictions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (riskFilter !== 'all') params.append('riskLevel', riskFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      // Since we need assetId, we'll fetch from dashboard
      // In real app, you'd have a separate endpoint for all predictions
      setError(null);
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
    }
  }, [riskFilter, typeFilter]);

  const fetchAnomalies = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/api/v1/predictive/anomalies?limit=20');
      const rawAnomalies = data.data || data || [];
      setAnomalies(rawAnomalies.map((a: any) => ({
        id: a.id,
        assetId: a.assetId,
        assetName: a.asset?.name || 'Unknown Asset',
        sensorType: a.factors?.[0]?.name || 'Unknown',
        value: a.factors?.[0]?.value || 0,
        unit: a.factors?.[0]?.unit || '',
        zScore: a.factors?.[0]?.contribution / 25 || 0,
        severity: a.riskLevel,
        timestamp: a.createdAt,
        message: a.prediction,
      })));
    } catch (err) {
      console.error('Failed to fetch anomalies:', err);
      // Mock data
      setAnomalies([
        {
          id: '1',
          assetId: '1',
          assetName: 'CNC Machine #3',
          sensorType: 'temperature',
          value: 95.5,
          unit: '°C',
          zScore: 3.2,
          severity: 'high',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          message: 'Temperature reading significantly above normal',
        },
        {
          id: '2',
          assetId: '2',
          assetName: 'Hydraulic Press A',
          sensorType: 'vibration',
          value: 12.8,
          unit: 'Hz',
          zScore: 2.8,
          severity: 'medium',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          message: 'Vibration levels elevated',
        },
        {
          id: '3',
          assetId: '4',
          assetName: 'HVAC Unit 1',
          sensorType: 'current',
          value: 45.2,
          unit: 'A',
          zScore: 4.1,
          severity: 'critical',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          message: 'Current draw critically high',
        },
      ]);
    }
  }, [fetchWithAuth]);

  const fetchModels = useCallback(async () => {
    try {
      const data = await fetchWithAuth('/api/v1/predictive/models');
      setModels(data.data || data || []);
    } catch (err) {
      console.error('Failed to fetch models:', err);
      // Mock data
      setModels([
        {
          id: '1',
          name: 'Anomaly Detection - CNC',
          assetType: 'CNC',
          modelType: 'anomaly_detection',
          status: 'active',
          accuracy: 92,
          trainingDataPoints: 125000,
          lastTrainedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          name: 'Failure Prediction - Hydraulic',
          assetType: 'Hydraulic',
          modelType: 'failure_prediction',
          status: 'active',
          accuracy: 87,
          trainingDataPoints: 89000,
          lastTrainedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          name: 'Remaining Life - Motors',
          assetType: 'Motor',
          modelType: 'remaining_life',
          status: 'active',
          accuracy: 85,
          trainingDataPoints: 67000,
          lastTrainedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    }
  }, [fetchWithAuth]);

  // Mock predictions for demo
  useEffect(() => {
    setPredictions([
      {
        id: '1',
        assetId: '1',
        assetName: 'CNC Machine #3',
        assetTag: 'CNC-003',
        predictionType: 'failure',
        prediction: 'Spindle bearing failure likely within 14 days',
        probability: 78,
        confidence: 87,
        predictedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        riskLevel: 'high',
        status: 'new',
        factors: [
          { name: 'Vibration Level', contribution: 45, value: 12.5, threshold: 8, unit: 'mm/s', description: 'Significantly elevated vibration detected' },
          { name: 'Temperature', contribution: 30, value: 85, threshold: 75, unit: '°C', description: 'Operating temperature above normal' },
          { name: 'Age', contribution: 25, value: 2500, unit: 'hours', description: 'Component approaching end of service life' },
        ],
        recommendedAction: 'Schedule bearing replacement during next planned downtime',
        estimatedCost: 2500,
        potentialSavings: 15000,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '2',
        assetId: '2',
        assetName: 'Hydraulic Press A',
        assetTag: 'HYD-A01',
        predictionType: 'failure',
        prediction: 'Hydraulic pump degradation detected',
        probability: 52,
        confidence: 72,
        predictedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        riskLevel: 'medium',
        status: 'new',
        factors: [
          { name: 'Pressure Drop', contribution: 60, value: 15, threshold: 10, unit: '%', description: 'Gradual pressure loss detected' },
          { name: 'Oil Quality', contribution: 40, value: 65, threshold: 80, unit: 'TAN', description: 'Oil degradation above threshold' },
        ],
        recommendedAction: 'Monitor closely and plan replacement within next month',
        estimatedCost: 4200,
        potentialSavings: 8000,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '3',
        assetId: '4',
        assetName: 'HVAC Unit 1',
        assetTag: 'HVAC-001',
        predictionType: 'failure',
        prediction: 'Compressor failure imminent',
        probability: 92,
        confidence: 95,
        predictedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        riskLevel: 'critical',
        status: 'new',
        factors: [
          { name: 'Current Draw', contribution: 50, value: 45, threshold: 32, unit: 'A', description: 'Current significantly exceeds rating' },
          { name: 'Temperature', contribution: 35, value: 105, threshold: 85, unit: '°C', description: 'Critical temperature level' },
          { name: 'Runtime', contribution: 15, value: 8760, unit: 'hours', description: 'Extended continuous operation' },
        ],
        recommendedAction: 'Schedule emergency maintenance immediately. Risk of catastrophic failure.',
        estimatedCost: 8500,
        potentialSavings: 25000,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
      {
        id: '4',
        assetId: '3',
        assetName: 'Conveyor Belt System',
        assetTag: 'CONV-001',
        predictionType: 'remaining_life',
        prediction: 'Motor temperature trending upward',
        probability: 25,
        confidence: 65,
        predictedDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        remainingLifeDays: 180,
        riskLevel: 'low',
        status: 'new',
        factors: [
          { name: 'Temperature Trend', contribution: 70, value: 2.5, unit: '°C/week', description: 'Gradual temperature increase' },
          { name: 'Efficiency', contribution: 30, value: 94, threshold: 95, unit: '%', description: 'Slight efficiency decline' },
        ],
        recommendedAction: 'Check motor cooling and lubrication during next scheduled maintenance',
        estimatedCost: 800,
        potentialSavings: 3000,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ]);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchDashboard(),
        fetchAnomalies(),
        fetchModels(),
      ]);
      setIsLoading(false);
    };

    loadData();
  }, [fetchDashboard, fetchAnomalies, fetchModels]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions, riskFilter, typeFilter]);

  const handleAcknowledge = async (id: string) => {
    try {
      await fetchWithAuth(`/api/v1/predictive/acknowledge/${id}`, { method: 'POST' });
      setPredictions(prev => prev.map(p => p.id === id ? { ...p, status: 'acknowledged' } : p));
    } catch (err) {
      console.error('Failed to acknowledge:', err);
      // Optimistic update for demo
      setPredictions(prev => prev.map(p => p.id === id ? { ...p, status: 'acknowledged' } : p));
    }
  };

  const handleCreateWorkOrder = async (id: string) => {
    try {
      await fetchWithAuth('/api/v1/predictive/generate-work-order', {
        method: 'POST',
        body: JSON.stringify({ predictionId: id }),
      });
      setPredictions(prev => prev.map(p => p.id === id ? { ...p, status: 'work_order_created' } : p));
      // Navigate to work orders
      navigate('/work-orders');
    } catch (err) {
      console.error('Failed to create work order:', err);
      // Demo: just update status
      setPredictions(prev => prev.map(p => p.id === id ? { ...p, status: 'work_order_created' } : p));
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await fetchWithAuth(`/api/v1/predictive/dismiss/${id}`, { method: 'POST' });
      setPredictions(prev => prev.map(p => p.id === id ? { ...p, status: 'dismissed' } : p));
    } catch (err) {
      console.error('Failed to dismiss:', err);
      setPredictions(prev => prev.map(p => p.id === id ? { ...p, status: 'dismissed' } : p));
    }
  };

  const handleViewAsset = (assetId: string) => {
    navigate(`/assets/${assetId}`);
  };

  const filteredPredictions = predictions.filter(p => {
    if (riskFilter !== 'all' && p.riskLevel !== riskFilter) return false;
    if (typeFilter !== 'all' && p.predictionType !== typeFilter) return false;
    return true;
  });

  const probabilityData = (dashboardData?.assetHealthScores || []).map(a => ({
    assetId: a.assetId,
    assetName: a.assetName,
    probability: 100 - a.healthScore,
    riskLevel: a.riskLevel as 'low' | 'medium' | 'high' | 'critical',
    predictedDays: Math.round(a.healthScore * 2),
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading predictive analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Predictive Maintenance</h1>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">AI-Powered</span>
              </div>
              <p className="text-sm text-gray-500">Machine learning failure prediction and anomaly detection</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('models')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Configure Models
              </button>
              <button
                onClick={() => {
                  setIsLoading(true);
                  Promise.all([fetchDashboard(), fetchAnomalies()]).then(() => setIsLoading(false));
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Refresh Analysis
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'predictions', label: 'Predictions' },
              { id: 'anomalies', label: 'Anomalies' },
              { id: 'models', label: 'Models' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.id === 'predictions' && dashboardData && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                    {dashboardData.activePredictions}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Active Predictions</p>
                  <span className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-2">{dashboardData.activePredictions}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-red-100 text-red-700">{dashboardData.criticalAlerts} critical</span>
                  <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-700">{dashboardData.highRiskAlerts} high</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Potential Savings</p>
                  <span className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-600 mt-2">${dashboardData.potentialSavings.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">From prevented failures</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Failures Prevented</p>
                  <span className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-2">{dashboardData.failuresPrevented}</p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Model Accuracy</p>
                  <span className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </span>
                </div>
                <p className="text-2xl font-bold text-purple-600 mt-2">{dashboardData.modelAccuracy}%</p>
                <p className="text-xs text-gray-500 mt-1">Average across models</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">Assets Monitored</p>
                  <span className="p-2 bg-indigo-100 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </span>
                </div>
                <p className="text-2xl font-bold text-indigo-600 mt-2">{dashboardData.assetsMonitored}</p>
                <p className="text-xs text-gray-500 mt-1">{dashboardData.anomaliesLast24h} anomalies (24h)</p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset Health Scores */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Asset Health Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  {dashboardData.assetHealthScores.slice(0, 4).map(asset => (
                    <AssetHealthGauge
                      key={asset.assetId}
                      healthScore={asset.healthScore}
                      assetName={asset.assetName}
                      size="sm"
                    />
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('predictions')}
                  className="w-full mt-4 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                >
                  View All Assets
                </button>
              </div>

              {/* Failure Probability Chart */}
              <div className="lg:col-span-2">
                <FailureProbabilityChart
                  data={probabilityData}
                  onAssetClick={handleViewAsset}
                />
              </div>
            </div>

            {/* Recent Predictions and Anomalies */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Critical Predictions */}
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Critical Predictions</h3>
                    <button
                      onClick={() => setActiveTab('predictions')}
                      className="text-sm text-purple-600 hover:text-purple-800"
                    >
                      View all
                    </button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {predictions
                    .filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high')
                    .slice(0, 3)
                    .map(prediction => (
                      <PredictionCard
                        key={prediction.id}
                        prediction={prediction}
                        compact
                      />
                    ))}
                  {predictions.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high').length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No critical predictions</p>
                  )}
                </div>
              </div>

              {/* Anomaly Timeline */}
              <AnomalyTimeline
                anomalies={anomalies}
                maxItems={5}
                onViewAsset={handleViewAsset}
              />
            </div>

            {/* ML Model Info */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Machine Learning Engine</h3>
              <p className="text-purple-100 mb-4">
                Our predictive maintenance system uses statistical methods including Z-score anomaly detection,
                exponential smoothing for trend prediction, and Weibull distribution for remaining life estimation.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-purple-200">Algorithm</p>
                  <p className="text-lg font-bold">Z-Score + IQR</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-purple-200">Models Active</p>
                  <p className="text-lg font-bold">{models.length}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-purple-200">Trend Analysis</p>
                  <p className="text-lg font-bold">Exp. Smoothing</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-xs text-purple-200">Life Estimation</p>
                  <p className="text-lg font-bold">Weibull</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Risk Level</label>
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Levels</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Prediction Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="failure">Failure</option>
                    <option value="anomaly">Anomaly</option>
                    <option value="remaining_life">Remaining Life</option>
                  </select>
                </div>
                <div className="ml-auto text-sm text-gray-500">
                  Showing {filteredPredictions.length} predictions
                </div>
              </div>
            </div>

            {/* Predictions List */}
            <div className="space-y-4">
              {filteredPredictions.map(prediction => (
                <PredictionCard
                  key={prediction.id}
                  prediction={prediction}
                  onAcknowledge={handleAcknowledge}
                  onCreateWorkOrder={handleCreateWorkOrder}
                  onDismiss={handleDismiss}
                  onViewAsset={handleViewAsset}
                />
              ))}
              {filteredPredictions.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No predictions found</h3>
                  <p className="mt-1 text-sm text-gray-500">Adjust filters or run a new analysis</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnomalyTimeline
              anomalies={anomalies}
              maxItems={20}
              onViewAsset={handleViewAsset}
            />
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Anomaly Statistics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total (24h)</span>
                    <span className="text-lg font-semibold">{dashboardData?.anomaliesLast24h || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Critical</span>
                    <span className="text-lg font-semibold text-red-600">
                      {anomalies.filter(a => a.severity === 'critical').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">High</span>
                    <span className="text-lg font-semibold text-orange-600">
                      {anomalies.filter(a => a.severity === 'high').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Medium</span>
                    <span className="text-lg font-semibold text-yellow-600">
                      {anomalies.filter(a => a.severity === 'medium').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Models Tab */}
        {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Prediction Models</h2>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                Create New Model
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map(model => (
                <div key={model.id} className="bg-white rounded-xl shadow-sm border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{model.name}</h3>
                      <p className="text-sm text-gray-500">{model.assetType}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      model.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {model.status}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-500">Accuracy</span>
                        <span className="font-medium">{model.accuracy}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full">
                        <div
                          className="h-2 bg-purple-500 rounded-full"
                          style={{ width: `${model.accuracy}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Type</span>
                      <span className="font-medium capitalize">
                        {model.modelType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Training Data</span>
                      <span className="font-medium">
                        {model.trainingDataPoints.toLocaleString()} points
                      </span>
                    </div>

                    {model.lastTrainedAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Last Trained</span>
                        <span className="font-medium">
                          {new Date(model.lastTrainedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                    <button className="flex-1 px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                      Retrain
                    </button>
                    <button className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
                      Configure
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PredictiveMaintenancePage;
