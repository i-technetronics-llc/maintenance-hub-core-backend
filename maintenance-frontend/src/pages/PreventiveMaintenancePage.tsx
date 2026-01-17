import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useOrganizationStore } from '../store/organizationStore';

interface PMSchedule {
  id: string;
  name: string;
  description?: string;
  assetId?: string;
  assetName?: string;
  siteId?: string;
  siteName?: string;
  maintenanceType: string;
  triggerType: 'time_based' | 'meter_based' | 'condition_based';
  frequency?: string;
  frequencyType?: string;
  frequencyValue?: number;
  intervalDays?: number;
  meterThreshold?: number;
  meterUnit?: string;
  priority: string;
  estimatedDuration?: number;
  checklist?: { item: string; mandatory: boolean }[];
  assignedToId?: string;
  assignedToName?: string;
  nextDueDate?: string;
  startDate?: string;
  lastExecutedAt?: string;
  isActive: boolean;
  complianceRate?: number;
  createdAt: string;
}

interface Asset {
  id: string;
  name: string;
  code?: string;
}

interface Site {
  id: string;
  name: string;
  code?: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

// Maintenance Types
const MAINTENANCE_TYPES = [
  { value: 'ppm', label: 'Planned Preventive Maintenance (PPM)' },
  { value: 'cmc', label: 'Corrective Maintenance (CMC)' },
  { value: 'power_availability', label: 'Power Availability Check' },
  { value: 'grid_performance', label: 'Grid Performance Monitoring' },
  { value: 'grid_fault', label: 'Grid Fault Maintenance' },
  { value: 'general_housekeeping', label: 'General Housekeeping' },
  { value: 'safety_inspection', label: 'Safety Inspection' },
  { value: 'calibration', label: 'Calibration' },
  { value: 'lubrication', label: 'Lubrication' },
  { value: 'filter_replacement', label: 'Filter Replacement' },
  { value: 'battery_maintenance', label: 'Battery Maintenance' },
  { value: 'hvac_service', label: 'HVAC Service' },
  { value: 'electrical_inspection', label: 'Electrical Inspection' },
  { value: 'other', label: 'Other' },
];

const FREQUENCY_TYPES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annually', label: 'Semi-Annually' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'custom', label: 'Custom Interval' },
];

const PRIORITIES = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

// Toast component
const Toast = ({ message, type, onClose }: { message: string; type: 'error' | 'success'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-in-right">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
        type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
      }`}>
        {type === 'success' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-80">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

interface PMStats {
  totalSchedules: number;
  activeSchedules: number;
  dueThisWeek: number;
  overdue: number;
  complianceRate: number;
  completedThisMonth: number;
}

// Calendar View Component
const PMCalendarView = ({
  schedules,
  onSelectSchedule,
  getPriorityColor,
}: {
  schedules: PMSchedule[];
  onSelectSchedule: (schedule: PMSchedule) => void;
  getPriorityColor: (priority: string) => string;
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const getSchedulesForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return schedules.filter((s) => {
      if (!s.nextDueDate) return false;
      const dueDate = new Date(s.nextDueDate);
      return (
        dueDate.getDate() === date.getDate() &&
        dueDate.getMonth() === date.getMonth() &&
        dueDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const today = new Date();
  const isToday = (day: number) => {
    return (
      today.getDate() === day &&
      today.getMonth() === currentDate.getMonth() &&
      today.getFullYear() === currentDate.getFullYear()
    );
  };

  const days = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50 border-r border-b border-gray-200" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const daySchedules = getSchedulesForDate(day);
    const isPast = new Date(currentDate.getFullYear(), currentDate.getMonth(), day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    days.push(
      <div
        key={day}
        className={`h-32 border-r border-b border-gray-200 p-1 overflow-hidden ${
          isToday(day) ? 'bg-blue-50' : isPast ? 'bg-gray-50' : 'bg-white'
        }`}
      >
        <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-700'}`}>
          {day}
        </div>
        <div className="space-y-1 overflow-y-auto max-h-24">
          {daySchedules.slice(0, 3).map((schedule) => (
            <button
              key={schedule.id}
              onClick={() => onSelectSchedule(schedule)}
              className={`w-full text-left px-1.5 py-0.5 text-xs rounded truncate ${getPriorityColor(schedule.priority)} hover:opacity-80`}
            >
              {schedule.name}
            </button>
          ))}
          {daySchedules.length > 3 && (
            <div className="text-xs text-gray-500 px-1">+{daySchedules.length - 3} more</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-2 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">{days}</div>
    </div>
  );
}

export const PreventiveMaintenancePage = () => {
  const { selectedOrganization } = useOrganizationStore();
  const [schedules, setSchedules] = useState<PMSchedule[]>([]);
  const [stats, setStats] = useState<PMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSchedule, setSelectedSchedule] = useState<PMSchedule | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'due_soon'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'list' | 'calendar'>('calendar');
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [editingSchedule, setEditingSchedule] = useState<PMSchedule | null>(null);

  // Dropdown data
  const [assets, setAssets] = useState<Asset[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maintenanceType: 'ppm',
    assetId: '',
    siteId: '',
    triggerType: 'time_based' as 'time_based' | 'meter_based' | 'condition_based',
    frequencyType: 'monthly',
    frequencyValue: 1,
    customDaysInterval: 30,
    meterType: '',
    meterInterval: '',
    priority: 'medium',
    estimatedHours: '',
    startDate: '',
    assignedToId: '',
    leadDays: 7,
    checklist: [] as { item: string; mandatory: boolean }[],
  });

  // Checklist item input
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newChecklistMandatory, setNewChecklistMandatory] = useState(false);

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<PMSchedule | null>(null);

  useEffect(() => {
    loadData();
    loadDropdownData();
  }, [selectedOrganization]);

  const loadDropdownData = async () => {
    try {
      const params: Record<string, string> = {};
      if (selectedOrganization?.id) {
        params.organizationId = selectedOrganization.id;
      }

      // Load assets
      try {
        const assetsResponse = await api.get('/assets', { params });
        const assetsData = assetsResponse.data?.data || assetsResponse.data || [];
        setAssets(Array.isArray(assetsData) ? assetsData : []);
      } catch {
        setAssets([]);
      }

      // Load sites
      try {
        const sitesResponse = await api.get('/sites', { params });
        const sitesData = sitesResponse.data?.data || sitesResponse.data || [];
        setSites(Array.isArray(sitesData) ? sitesData : []);
      } catch {
        setSites([]);
      }

      // Load users
      try {
        const usersResponse = await api.get('/users', { params });
        const usersData = usersResponse.data?.data || usersResponse.data || [];
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch {
        setUsers([]);
      }
    } catch (error) {
      console.error('Failed to load dropdown data:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedOrganization?.id) {
        params.organizationId = selectedOrganization.id;
      }
      // Load PM schedules
      const response = await api.get('/preventive-maintenance', { params });
      const data = response.data?.data || response.data || [];
      setSchedules(Array.isArray(data) ? data : []);

      // Load stats
      try {
        const statsResponse = await api.get('/preventive-maintenance/stats');
        setStats(statsResponse.data?.data || statsResponse.data);
      } catch {
        // Generate mock stats if endpoint doesn't exist
        setStats({
          totalSchedules: data.length,
          activeSchedules: data.filter((s: PMSchedule) => s.isActive).length,
          dueThisWeek: data.filter((s: PMSchedule) => {
            if (!s.nextDueDate) return false;
            const due = new Date(s.nextDueDate);
            const weekFromNow = new Date();
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return due <= weekFromNow;
          }).length,
          overdue: data.filter((s: PMSchedule) => {
            if (!s.nextDueDate) return false;
            return new Date(s.nextDueDate) < new Date();
          }).length,
          complianceRate: 85,
          completedThisMonth: 12,
        });
      }
    } catch (error) {
      console.error('Failed to load PM data:', error);
      // Set mock data for demo
      setSchedules([
        {
          id: '1',
          name: 'Monthly HVAC Filter Replacement',
          description: 'Replace air filters on all HVAC units',
          assetName: 'HVAC System - Building A',
          triggerType: 'time_based',
          frequency: 'monthly',
          intervalDays: 30,
          priority: 'medium',
          maintenanceType: 'preventive',
          estimatedDuration: 60,
          assignedToName: 'John Smith',
          nextDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          lastExecutedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          complianceRate: 92,
          createdAt: new Date().toISOString(),
          checklist: [
            { item: 'Turn off HVAC system', mandatory: true },
            { item: 'Remove old filter', mandatory: true },
            { item: 'Clean filter housing', mandatory: false },
            { item: 'Install new filter', mandatory: true },
            { item: 'Restart system', mandatory: true },
          ],
        },
        {
          id: '2',
          name: 'Quarterly Generator Inspection',
          description: 'Full inspection and testing of backup generators',
          assetName: 'Generator Unit 1',
          triggerType: 'time_based',
          frequency: 'quarterly',
          intervalDays: 90,
          priority: 'high',
          maintenanceType: 'preventive',
          estimatedDuration: 180,
          assignedToName: 'Mike Johnson',
          nextDueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          lastExecutedAt: new Date(Date.now() - 92 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          complianceRate: 78,
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Conveyor Belt Oil Change',
          description: 'Change oil at 5000 operating hours',
          assetName: 'Conveyor Belt - Line 1',
          triggerType: 'meter_based',
          meterThreshold: 5000,
          meterUnit: 'hours',
          priority: 'medium',
          maintenanceType: 'preventive',
          estimatedDuration: 120,
          assignedToName: 'Sarah Williams',
          nextDueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          complianceRate: 95,
          createdAt: new Date().toISOString(),
        },
      ]);
      setStats({
        totalSchedules: 3,
        activeSchedules: 3,
        dueThisWeek: 1,
        overdue: 1,
        complianceRate: 85,
        completedThisMonth: 12,
      });
    } finally {
      setLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      description: '',
      maintenanceType: 'ppm',
      assetId: '',
      siteId: '',
      triggerType: 'time_based',
      frequencyType: 'monthly',
      frequencyValue: 1,
      customDaysInterval: 30,
      meterType: '',
      meterInterval: '',
      priority: 'medium',
      estimatedHours: '',
      startDate: '',
      assignedToId: '',
      leadDays: 7,
      checklist: [],
    });
    setNewChecklistItem('');
    setNewChecklistMandatory(false);
  };

  const openCreateModal = () => {
    resetFormData();
    setModalError('');
    setModalMode('create');
    setEditingSchedule(null);
    setShowModal(true);
  };

  const openEditModal = (schedule: PMSchedule) => {
    setEditingSchedule(schedule);
    setFormData({
      name: schedule.name || '',
      description: schedule.description || '',
      maintenanceType: schedule.maintenanceType || 'ppm',
      assetId: schedule.assetId || '',
      siteId: schedule.siteId || '',
      triggerType: schedule.triggerType || 'time_based',
      frequencyType: schedule.frequencyType || 'monthly',
      frequencyValue: schedule.frequencyValue || 1,
      customDaysInterval: schedule.intervalDays || 30,
      meterType: schedule.meterUnit || '',
      meterInterval: schedule.meterThreshold?.toString() || '',
      priority: schedule.priority || 'medium',
      estimatedHours: schedule.estimatedDuration?.toString() || '',
      startDate: schedule.startDate ? schedule.startDate.split('T')[0] : '',
      assignedToId: schedule.assignedToId || '',
      leadDays: 7,
      checklist: schedule.checklist || [],
    });
    setModalError('');
    setModalMode('edit');
    setShowModal(true);
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setFormData({
        ...formData,
        checklist: [...formData.checklist, { item: newChecklistItem.trim(), mandatory: newChecklistMandatory }],
      });
      setNewChecklistItem('');
      setNewChecklistMandatory(false);
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setFormData({
      ...formData,
      checklist: formData.checklist.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError('');

    try {
      const payload: any = {
        name: formData.name,
        description: formData.description || undefined,
        maintenanceType: formData.maintenanceType,
        triggerType: formData.triggerType,
        priority: formData.priority,
        isActive: true,
        organizationId: selectedOrganization?.id,
      };

      if (formData.assetId) payload.assetId = formData.assetId;
      if (formData.siteId) payload.siteId = formData.siteId;
      if (formData.assignedToId) payload.assignedToId = formData.assignedToId;
      if (formData.startDate) payload.startDate = formData.startDate;
      if (formData.estimatedHours) payload.estimatedHours = parseFloat(formData.estimatedHours);
      if (formData.checklist.length > 0) {
        payload.checklist = formData.checklist.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
      }

      // Time-based settings
      if (formData.triggerType === 'time_based') {
        payload.frequencyType = formData.frequencyType;
        payload.frequencyValue = formData.frequencyValue;
        if (formData.frequencyType === 'custom') {
          payload.customDaysInterval = formData.customDaysInterval;
        }
        payload.leadDays = formData.leadDays;
      }

      // Meter-based settings
      if (formData.triggerType === 'meter_based') {
        payload.meterType = formData.meterType;
        payload.meterInterval = parseFloat(formData.meterInterval);
      }

      if (modalMode === 'create') {
        await api.post('/preventive-maintenance', payload);
        setToast({ message: 'Schedule created successfully', type: 'success' });
      } else {
        await api.patch(`/preventive-maintenance/${editingSchedule?.id}`, payload);
        setToast({ message: 'Schedule updated successfully', type: 'success' });
      }

      setShowModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      setModalError(error.response?.data?.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (schedule: PMSchedule) => {
    setDeletingSchedule(schedule);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deletingSchedule) return;
    setDeleting(true);

    try {
      await api.delete(`/preventive-maintenance/${deletingSchedule.id}`);
      setShowDeleteModal(false);
      setDeletingSchedule(null);
      setToast({ message: 'Schedule deleted successfully', type: 'success' });
      loadData();
    } catch (error: any) {
      console.error('Error deleting schedule:', error);
      setToast({ message: error.response?.data?.message || 'Failed to delete schedule', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (schedule: PMSchedule) => {
    try {
      await api.patch(`/preventive-maintenance/${schedule.id}`, { isActive: !schedule.isActive });
      setSchedules(schedules.map(s => s.id === schedule.id ? { ...s, isActive: !s.isActive } : s));
    } catch (error) {
      console.error('Failed to toggle schedule:', error);
    }
  };

  const handleGenerateWorkOrder = async (schedule: PMSchedule) => {
    try {
      await api.post(`/preventive-maintenance/schedules/${schedule.id}/generate-work-order`);
      alert('Work order generated successfully');
      loadData();
    } catch (error: any) {
      console.error('Failed to generate work order:', error);
      const message = error.response?.data?.message || 'Failed to generate work order';
      alert(message);
    }
  };

  const filteredSchedules = schedules
    .filter(schedule => {
      if (filter === 'active') return schedule.isActive;
      if (filter === 'overdue') return schedule.nextDueDate && new Date(schedule.nextDueDate) < new Date();
      if (filter === 'due_soon') {
        if (!schedule.nextDueDate) return false;
        const due = new Date(schedule.nextDueDate);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return due <= weekFromNow && due >= new Date();
      }
      return true;
    })
    .filter(schedule =>
      schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.assetName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    switch (type) {
      case 'time_based': return 'Time Based';
      case 'meter_based': return 'Meter Based';
      case 'condition_based': return 'Condition Based';
      default: return type;
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Maintenance Schedule</h1>
              <p className="text-sm text-gray-500">Manage maintenance schedules and tasks</p>
            </div>
            <div className="flex gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setView('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setView('calendar')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    view === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                  }`}
                >
                  Calendar
                </button>
              </div>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-sm text-gray-500">Total Schedules</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSchedules}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeSchedules}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-sm text-gray-500">Due This Week</p>
              <p className="text-2xl font-bold text-blue-600">{stats.dueThisWeek}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-sm text-gray-500">Compliance Rate</p>
              <p className="text-2xl font-bold text-purple-600">{stats.complianceRate}%</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <p className="text-sm text-gray-500">Completed (Month)</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedThisMonth}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['all', 'active', 'due_soon', 'overdue'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filter === f ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                }`}
              >
                {f === 'due_soon' ? 'Due Soon' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* List View */}
        {view === 'list' && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Schedule Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Asset</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Trigger Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Priority</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Next Due</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Compliance</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSchedules.map((schedule) => {
                  const isOverdue = schedule.nextDueDate && new Date(schedule.nextDueDate) < new Date();

                  return (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{schedule.name}</p>
                          <p className="text-sm text-gray-500 truncate max-w-xs">{schedule.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{schedule.assetName || '-'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full">
                          {getTriggerTypeLabel(schedule.triggerType)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(schedule.priority)}`}>
                          {schedule.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {schedule.nextDueDate ? new Date(schedule.nextDueDate).toLocaleDateString() : '-'}
                        </span>
                        {isOverdue && <span className="ml-2 text-xs text-red-600">(Overdue)</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                (schedule.complianceRate || 0) >= 90 ? 'bg-green-500' :
                                (schedule.complianceRate || 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${schedule.complianceRate || 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{schedule.complianceRate || 0}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          schedule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {schedule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedSchedule(schedule)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openEditModal(schedule)}
                            className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                            title="Edit Schedule"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleGenerateWorkOrder(schedule)}
                            className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                            title="Generate Work Order"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleToggleActive(schedule)}
                            className={`p-2 hover:bg-gray-100 rounded-lg ${
                              schedule.isActive ? 'text-yellow-600' : 'text-green-600'
                            }`}
                            title={schedule.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {schedule.isActive ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                              )}
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(schedule)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                            title="Delete Schedule"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredSchedules.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No PM schedules found
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
        {view === 'calendar' && (
          <PMCalendarView schedules={filteredSchedules} onSelectSchedule={setSelectedSchedule} getPriorityColor={getPriorityColor} />
        )}
      </main>

      {/* Schedule Detail Slide-in Modal */}
      {selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setSelectedSchedule(null)}>
          <div
            className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl overflow-y-auto animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedSchedule.name}</h3>
                  <p className="text-sm text-gray-500">{selectedSchedule.assetName}</p>
                </div>
                <button onClick={() => setSelectedSchedule(null)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
                <p className="text-gray-600">{selectedSchedule.description || 'No description'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Trigger Type</p>
                  <p className="text-gray-900">{getTriggerTypeLabel(selectedSchedule.triggerType)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Priority</p>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedSchedule.priority)}`}>
                    {selectedSchedule.priority}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Frequency</p>
                  <p className="text-gray-900">
                    {selectedSchedule.triggerType === 'time_based'
                      ? `${selectedSchedule.frequency || 'N/A'} (every ${selectedSchedule.intervalDays} days)`
                      : `${selectedSchedule.meterThreshold} ${selectedSchedule.meterUnit}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Estimated Duration</p>
                  <p className="text-gray-900">{selectedSchedule.estimatedDuration || 0} minutes</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Next Due Date</p>
                  <p className="text-gray-900">
                    {selectedSchedule.nextDueDate
                      ? new Date(selectedSchedule.nextDueDate).toLocaleDateString()
                      : 'Not scheduled'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Assigned To</p>
                  <p className="text-gray-900">{selectedSchedule.assignedToName || 'Unassigned'}</p>
                </div>
              </div>

              {selectedSchedule.checklist && selectedSchedule.checklist.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Checklist</p>
                  <div className="space-y-2">
                    {selectedSchedule.checklist.map((item, index) => (
                      <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg">
                        <span className="flex-1 text-gray-700">{item.item}</span>
                        {item.mandatory && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Required</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-blue-900">Compliance Rate</p>
                    <p className="text-sm text-blue-700">{selectedSchedule.complianceRate || 0}%</p>
                  </div>
                  <div className="w-24 h-3 bg-blue-200 rounded-full">
                    <div
                      className="h-3 bg-blue-600 rounded-full"
                      style={{ width: `${selectedSchedule.complianceRate || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedSchedule(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  openEditModal(selectedSchedule);
                  setSelectedSchedule(null);
                }}
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  handleGenerateWorkOrder(selectedSchedule);
                  setSelectedSchedule(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generate Work Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Schedule Modal */}
      {showModal && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowModal(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-white shadow-xl z-50 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {modalMode === 'create' ? 'Create New Schedule' : 'Edit Schedule'}
                </h3>
                <p className="text-sm text-gray-500">
                  {modalMode === 'create' ? 'Set up a new maintenance schedule' : 'Modify the existing schedule'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-200">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{modalError}</div>
              )}

              {/* Basic Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Monthly HVAC Filter Replacement"
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Type *</label>
                    <select
                      required
                      value={formData.maintenanceType}
                      onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {MAINTENANCE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the maintenance activity..."
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Asset & Location */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Asset & Location</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                    <select
                      value={formData.siteId}
                      onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Select site</option>
                      {sites.map((site) => (
                        <option key={site.id} value={site.id}>{site.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
                    <select
                      value={formData.assetId}
                      onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Select asset</option>
                      {assets.map((asset) => (
                        <option key={asset.id} value={asset.id}>{asset.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Trigger Configuration */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Schedule Trigger</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'time_based', label: 'Time Based', desc: 'Schedule by calendar frequency' },
                        { value: 'meter_based', label: 'Meter Based', desc: 'Schedule by meter reading' },
                        { value: 'condition_based', label: 'Condition Based', desc: 'Schedule by sensor condition' },
                      ].map((trigger) => (
                        <button
                          key={trigger.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, triggerType: trigger.value as any })}
                          className={`p-3 border rounded-xl text-left transition ${
                            formData.triggerType === trigger.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <p className="font-medium text-sm text-gray-900">{trigger.label}</p>
                          <p className="text-xs text-gray-500 mt-1">{trigger.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time-based settings */}
                  {formData.triggerType === 'time_based' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                        <select
                          value={formData.frequencyType}
                          onChange={(e) => setFormData({ ...formData, frequencyType: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          {FREQUENCY_TYPES.map((freq) => (
                            <option key={freq.value} value={freq.value}>{freq.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Every</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            value={formData.frequencyValue}
                            onChange={(e) => setFormData({ ...formData, frequencyValue: parseInt(e.target.value) || 1 })}
                            className="w-20 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <span className="text-sm text-gray-600">
                            {formData.frequencyType === 'daily' ? 'day(s)' :
                             formData.frequencyType === 'weekly' ? 'week(s)' :
                             formData.frequencyType === 'monthly' ? 'month(s)' :
                             formData.frequencyType === 'yearly' ? 'year(s)' : 'period(s)'}
                          </span>
                        </div>
                      </div>
                      {formData.frequencyType === 'custom' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Custom Days Interval</label>
                          <input
                            type="number"
                            min="1"
                            value={formData.customDaysInterval}
                            onChange={(e) => setFormData({ ...formData, customDaysInterval: parseInt(e.target.value) || 30 })}
                            className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Lead Days</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.leadDays}
                          onChange={(e) => setFormData({ ...formData, leadDays: parseInt(e.target.value) || 0 })}
                          placeholder="Days before due to notify"
                          className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </>
                  )}

                  {/* Meter-based settings */}
                  {formData.triggerType === 'meter_based' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meter Type</label>
                        <select
                          value={formData.meterType}
                          onChange={(e) => setFormData({ ...formData, meterType: e.target.value })}
                          className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">Select meter type</option>
                          <option value="hours">Operating Hours</option>
                          <option value="miles">Miles/Kilometers</option>
                          <option value="cycles">Cycles</option>
                          <option value="kwh">kWh</option>
                          <option value="units">Units Produced</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Meter Interval</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.meterInterval}
                          onChange={(e) => setFormData({ ...formData, meterInterval: e.target.value })}
                          placeholder="e.g., 5000"
                          className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Priority & Assignment */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Priority & Assignment</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
                    <select
                      required
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                      placeholder="e.g., 2.5"
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                    <select
                      value={formData.assignedToId}
                      onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Select technician</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Checklist Items</h4>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      placeholder="Add checklist item..."
                      className="flex-1 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklistItem())}
                    />
                    <label className="flex items-center gap-2 px-3 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={newChecklistMandatory}
                        onChange={(e) => setNewChecklistMandatory(e.target.checked)}
                        className="rounded"
                      />
                      Required
                    </label>
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm"
                    >
                      Add
                    </button>
                  </div>
                  {formData.checklist.length > 0 && (
                    <div className="space-y-2">
                      {formData.checklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <span className="flex-1 text-sm text-gray-700">{item.item}</span>
                          {item.mandatory && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">Required</span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItem(index)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </form>

            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                onClick={handleSubmit}
                className="px-5 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : modalMode === 'create' ? 'Create Schedule' : 'Save Changes'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingSchedule && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setShowDeleteModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Schedule</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <strong>{deletingSchedule.name}</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PreventiveMaintenancePage;
