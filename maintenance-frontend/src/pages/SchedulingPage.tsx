import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SchedulingCalendar,
  DraggableWorkOrder,
  TechnicianList,
  ViewMode,
  WorkOrderData,
  Technician,
} from '../components/scheduling';
import { api, workOrderApi, userApi, RescheduleWorkOrderDto } from '../services/api';

interface FilterState {
  priority: string;
  type: string;
  status: string;
  technicianId?: string;
}

export const SchedulingPage = () => {
  const navigate = useNavigate();

  // State
  const [workOrders, setWorkOrders] = useState<WorkOrderData[]>([]);
  const [unscheduledWorkOrders, setUnscheduledWorkOrders] = useState<WorkOrderData[]>([]);
  const [pmSchedules, setPMSchedules] = useState<WorkOrderData[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [rescheduleLoading, setRescheduleLoading] = useState<string | null>(null);

  // Calendar state
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    priority: '',
    type: '',
    status: '',
    technicianId: undefined,
  });

  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState<'unscheduled' | 'technicians'>('unscheduled');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Selected work order for detail view
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderData | null>(null);

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Load work orders
      const woResponse = await workOrderApi.getAll({ limit: 100 });
      const allWorkOrders = woResponse.data || [];

      // Separate scheduled and unscheduled
      const scheduled: WorkOrderData[] = [];
      const unscheduled: WorkOrderData[] = [];

      allWorkOrders.forEach((wo: any) => {
        const workOrder: WorkOrderData = {
          id: wo.id,
          woNumber: wo.woNumber,
          title: wo.title,
          description: wo.description,
          type: wo.type?.toLowerCase(),
          priority: wo.priority?.toLowerCase() || 'medium',
          status: wo.status?.toLowerCase() || 'draft',
          scheduledDate: wo.scheduledDate,
          dueDate: wo.dueDate,
          assignedTo: wo.assignedTo
            ? {
                id: wo.assignedTo.id,
                firstName: wo.assignedTo.firstName,
                lastName: wo.assignedTo.lastName,
              }
            : undefined,
          asset: wo.asset
            ? {
                id: wo.asset.id,
                name: wo.asset.name,
              }
            : undefined,
        };

        if (wo.scheduledDate || wo.dueDate) {
          scheduled.push(workOrder);
        } else {
          unscheduled.push(workOrder);
        }
      });

      setWorkOrders(scheduled);
      setUnscheduledWorkOrders(unscheduled);

      // Load PM schedules
      try {
        const pmResponse = await api.get('/preventive-maintenance');
        const pmData = pmResponse.data?.data || pmResponse.data || [];
        const pmItems: WorkOrderData[] = pmData.map((pm: any) => ({
          id: pm.id,
          title: pm.name,
          description: pm.description,
          type: 'preventive',
          priority: pm.priority?.toLowerCase() || 'medium',
          status: pm.isActive ? 'scheduled' : 'inactive',
          scheduledDate: pm.nextDueDate,
          dueDate: pm.nextDueDate,
          assignedTo: pm.assignedToId
            ? { id: pm.assignedToId, firstName: pm.assignedToName || 'Unknown', lastName: '' }
            : undefined,
          asset: pm.assetId
            ? { id: pm.assetId, name: pm.assetName || 'Unknown Asset' }
            : undefined,
          isPMSchedule: true,
          pmScheduleId: pm.id,
        }));
        setPMSchedules(pmItems);
      } catch (error) {
        console.error('Failed to load PM schedules:', error);
        setPMSchedules([]);
      }

      // Load technicians (users)
      try {
        const usersData = await userApi.getAll();
        const users = Array.isArray(usersData) ? usersData : [];

        // Calculate workload for each user
        const techList: Technician[] = users.map((user: any) => {
          const assignedCount = allWorkOrders.filter(
            (wo: any) => wo.assignedTo?.id === user.id
          ).length;

          return {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role?.name || 'Technician',
            availability: user.isActive ? 'available' : 'off',
            workload: {
              assigned: assignedCount,
              completed: 0,
              percentage: Math.min((assignedCount / 10) * 100, 100),
            },
          };
        });

        setTechnicians(techList);
      } catch (error) {
        console.error('Failed to load users:', error);
        setTechnicians([]);
      }
    } catch (error) {
      console.error('Failed to load scheduling data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle reschedule
  const handleReschedule = async (workOrderId: string, newDate: Date, technicianId?: string) => {
    setRescheduleLoading(workOrderId);

    try {
      // Call reschedule API using the workOrderApi
      const rescheduleData: RescheduleWorkOrderDto = {
        scheduledDate: newDate.toISOString(),
        assignedToId: technicianId,
      };
      await workOrderApi.reschedule(workOrderId, rescheduleData);

      // Update local state
      const movedWorkOrder = unscheduledWorkOrders.find((wo) => wo.id === workOrderId);

      if (movedWorkOrder) {
        // Move from unscheduled to scheduled
        setUnscheduledWorkOrders((prev) => prev.filter((wo) => wo.id !== workOrderId));
        setWorkOrders((prev) => [
          ...prev,
          { ...movedWorkOrder, scheduledDate: newDate.toISOString() },
        ]);
      } else {
        // Update scheduled work order
        setWorkOrders((prev) =>
          prev.map((wo) =>
            wo.id === workOrderId ? { ...wo, scheduledDate: newDate.toISOString() } : wo
          )
        );
      }

      // Show success notification (could use a toast library)
      console.log('Work order rescheduled successfully');
    } catch (error: any) {
      console.error('Failed to reschedule work order:', error);
      alert(error.response?.data?.message || 'Failed to reschedule work order');
    } finally {
      setRescheduleLoading(null);
    }
  };

  // Handle work order click
  const handleWorkOrderClick = (workOrder: WorkOrderData) => {
    if (workOrder.isPMSchedule) {
      setSelectedWorkOrder(workOrder);
    } else {
      navigate(`/work-orders/${workOrder.id}`);
    }
  };

  // Filter work orders
  const getFilteredWorkOrders = (items: WorkOrderData[]): WorkOrderData[] => {
    return items.filter((wo) => {
      if (filters.priority && wo.priority !== filters.priority) return false;
      if (filters.type && wo.type !== filters.type) return false;
      if (filters.status && wo.status !== filters.status) return false;
      if (filters.technicianId && wo.assignedTo?.id !== filters.technicianId) return false;
      return true;
    });
  };

  // Drag handlers for sidebar items
  const handleDragStart = (e: React.DragEvent, workOrder: WorkOrderData) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(workOrder));
  };

  const handleDragEnd = () => {
    // Cleanup if needed
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading scheduling data...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Scheduling Calendar</h1>
              <p className="text-sm text-gray-500">
                Drag and drop work orders to schedule and reassign
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Quick Stats */}
              <div className="hidden lg:flex items-center gap-4 mr-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{workOrders.length}</p>
                  <p className="text-xs text-gray-500">Scheduled</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">{unscheduledWorkOrders.length}</p>
                  <p className="text-xs text-gray-500">Unscheduled</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{pmSchedules.length}</p>
                  <p className="text-xs text-gray-500">PM Schedules</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/work-orders')}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View All Work Orders
              </button>
              <button
                onClick={() => navigate('/work-orders/new')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Work Order
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="corrective">Corrective</option>
            <option value="preventive">Preventive</option>
            <option value="predictive">Predictive</option>
            <option value="inspection">Inspection</option>
            <option value="emergency">Emergency</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>

          {Object.values(filters).some((v) => v) && (
            <button
              onClick={() =>
                setFilters({ priority: '', type: '', status: '', technicianId: undefined })
              }
              className="px-3 py-2 text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear Filters
            </button>
          )}
        </div>

        {/* Calendar + Sidebar Layout */}
        <div className="flex gap-6">
          {/* Calendar */}
          <div className={`flex-1 ${sidebarCollapsed ? '' : 'lg:mr-80'}`}>
            <SchedulingCalendar
              workOrders={getFilteredWorkOrders(workOrders)}
              pmSchedules={getFilteredWorkOrders(pmSchedules)}
              technicians={technicians}
              selectedTechnicianId={filters.technicianId}
              viewMode={viewMode}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onViewModeChange={setViewMode}
              onReschedule={handleReschedule}
              onWorkOrderClick={handleWorkOrderClick}
            />
          </div>

          {/* Sidebar */}
          <div
            className={`fixed right-0 top-0 h-full bg-white border-l border-gray-200 shadow-lg transition-transform duration-300 z-40
              ${sidebarCollapsed ? 'translate-x-full' : 'translate-x-0'}
              w-80 pt-20`}
          >
            {/* Sidebar Toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -left-10 top-24 bg-white border border-gray-200 border-r-0 rounded-l-lg p-2 shadow-md"
            >
              <svg
                className={`w-5 h-5 text-gray-600 transition-transform ${
                  sidebarCollapsed ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Sidebar Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setSidebarTab('unscheduled')}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors
                  ${
                    sidebarTab === 'unscheduled'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Unscheduled ({unscheduledWorkOrders.length})
              </button>
              <button
                onClick={() => setSidebarTab('technicians')}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors
                  ${
                    sidebarTab === 'technicians'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Technicians ({technicians.length})
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="h-[calc(100vh-12rem)] overflow-y-auto p-4">
              {sidebarTab === 'unscheduled' && (
                <div className="space-y-3">
                  {unscheduledWorkOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg
                        className="w-12 h-12 mx-auto mb-3 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                      <p className="font-medium">All work orders scheduled!</p>
                      <p className="text-sm">No unscheduled work orders</p>
                    </div>
                  ) : (
                    unscheduledWorkOrders.map((wo) => (
                      <div
                        key={wo.id}
                        className={`relative ${rescheduleLoading === wo.id ? 'opacity-50' : ''}`}
                      >
                        <DraggableWorkOrder
                          workOrder={wo}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onClick={handleWorkOrderClick}
                          compact={false}
                        />
                        {rescheduleLoading === wo.id && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {sidebarTab === 'technicians' && (
                <div>
                  <p className="text-xs text-gray-500 mb-3">
                    Select a technician to filter the calendar
                  </p>
                  <TechnicianList
                    technicians={technicians}
                    selectedId={filters.technicianId}
                    onSelect={(id) => setFilters({ ...filters, technicianId: id })}
                    showWorkload
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span className="text-sm text-gray-600">Critical Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <span className="text-sm text-gray-600">High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-500"></div>
              <span className="text-sm text-gray-600">Medium Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span className="text-sm text-gray-600">Low Priority</span>
            </div>
            <div className="w-px h-4 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-600">PM Schedule</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-sm text-gray-600">Corrective</span>
            </div>
          </div>
        </div>
      </main>

      {/* PM Schedule Detail Modal */}
      {selectedWorkOrder && selectedWorkOrder.isPMSchedule && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedWorkOrder(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedWorkOrder.title}
                  </h3>
                  <p className="text-sm text-gray-500">Preventive Maintenance Schedule</p>
                </div>
                <button
                  onClick={() => setSelectedWorkOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {selectedWorkOrder.description && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Description</p>
                  <p className="text-gray-600">{selectedWorkOrder.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Priority</p>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1
                      ${
                        selectedWorkOrder.priority === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : selectedWorkOrder.priority === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : selectedWorkOrder.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                  >
                    {selectedWorkOrder.priority}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Due Date</p>
                  <p className="text-gray-600">
                    {selectedWorkOrder.dueDate
                      ? new Date(selectedWorkOrder.dueDate).toLocaleDateString()
                      : 'Not set'}
                  </p>
                </div>

                {selectedWorkOrder.asset && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Asset</p>
                    <p className="text-gray-600">{selectedWorkOrder.asset.name}</p>
                  </div>
                )}

                {selectedWorkOrder.assignedTo && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Assigned To</p>
                    <p className="text-gray-600">
                      {selectedWorkOrder.assignedTo.firstName} {selectedWorkOrder.assignedTo.lastName}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setSelectedWorkOrder(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedWorkOrder(null);
                  navigate('/preventive-maintenance');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View PM Schedules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulingPage;
