import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { WorkOrder, workOrderApi } from '../services/api';

interface WorkOrderDetail extends WorkOrder {
  timeEntries?: { id: string; startTime: string; endTime?: string; duration: number; userId: string; userName: string }[];
  partsUsed?: { id: string; inventoryId: string; name: string; quantity: number; unitCost: number }[];
  comments?: { id: string; userId: string; userName: string; content: string; createdAt: string }[];
  signatures?: { id: string; type: string; signedBy: string; signedAt: string; imageUrl: string }[];
  attachments?: { id: string; name: string; type: string; url: string; uploadedAt: string }[];
}

export const WorkOrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (id) {
      loadWorkOrder(id);
    }
  }, [id]);

  const loadWorkOrder = async (woId: string) => {
    try {
      setLoading(true);
      const data = await workOrderApi.getById(woId);
      setWorkOrder({
        ...data,
        timeEntries: [
          { id: '1', startTime: '2024-01-15T08:00:00Z', endTime: '2024-01-15T10:30:00Z', duration: 150, userId: '1', userName: 'John Smith' },
          { id: '2', startTime: '2024-01-15T13:00:00Z', endTime: '2024-01-15T15:00:00Z', duration: 120, userId: '1', userName: 'John Smith' },
        ],
        partsUsed: [
          { id: '1', inventoryId: 'inv1', name: 'Air Filter - 20x20', quantity: 2, unitCost: 25 },
          { id: '2', inventoryId: 'inv2', name: 'Belt - V-Type', quantity: 1, unitCost: 45 },
        ],
        comments: [
          { id: '1', userId: '1', userName: 'John Smith', content: 'Started inspection, found worn belt.', createdAt: '2024-01-15T08:30:00Z' },
          { id: '2', userId: '2', userName: 'Mike Manager', content: 'Approved parts request.', createdAt: '2024-01-15T09:00:00Z' },
        ],
      });
    } catch (error) {
      console.error('Failed to load work order:', error);
      // Set mock data
      setWorkOrder({
        id: woId,
        woNumber: 'WO-001234',
        title: 'HVAC Quarterly Maintenance',
        description: 'Perform quarterly maintenance on Building A HVAC system including filter replacement, belt inspection, and refrigerant level check.',
        type: 'preventive',
        priority: 'medium',
        status: 'in_progress',
        asset: { id: '1', name: 'HVAC Unit - Building A' },
        assignedTo: { id: '1', firstName: 'John', lastName: 'Smith' },
        checklist: [
          { item: 'Turn off HVAC system', completed: true, mandatory: true },
          { item: 'Replace air filters', completed: true, mandatory: true },
          { item: 'Inspect belt condition', completed: true, mandatory: true },
          { item: 'Check refrigerant levels', completed: false, mandatory: true },
          { item: 'Clean condenser coils', completed: false, mandatory: false },
          { item: 'Test thermostat', completed: false, mandatory: true },
        ],
        estimatedCost: 500,
        actualCost: 320,
        scheduledDate: '2024-01-15',
        dueDate: '2024-01-16',
        createdAt: '2024-01-10T08:00:00Z',
        updatedAt: new Date().toISOString(),
        timeEntries: [
          { id: '1', startTime: '2024-01-15T08:00:00Z', endTime: '2024-01-15T10:30:00Z', duration: 150, userId: '1', userName: 'John Smith' },
        ],
        partsUsed: [
          { id: '1', inventoryId: 'inv1', name: 'Air Filter - 20x20', quantity: 2, unitCost: 25 },
        ],
        comments: [
          { id: '1', userId: '1', userName: 'John Smith', content: 'Started inspection, found worn belt.', createdAt: '2024-01-15T08:30:00Z' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!workOrder) return;
    try {
      await workOrderApi.update(workOrder.id, { status: newStatus });
      setWorkOrder({ ...workOrder, status: newStatus });
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleChecklistToggle = (index: number) => {
    if (!workOrder || !workOrder.checklist) return;
    const updatedChecklist = [...workOrder.checklist];
    updatedChecklist[index] = { ...updatedChecklist[index], completed: !updatedChecklist[index].completed };
    setWorkOrder({ ...workOrder, checklist: updatedChecklist });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'assigned': return 'bg-purple-100 text-purple-700';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Work order not found</p>
        <button onClick={() => navigate('/work-orders')} className="mt-4 text-blue-600 hover:underline">
          Back to Work Orders
        </button>
      </div>
    );
  }

  const completedTasks = workOrder.checklist?.filter(item => item.completed).length || 0;
  const totalTasks = workOrder.checklist?.length || 0;
  const completionPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalTime = workOrder.timeEntries?.reduce((acc, entry) => acc + entry.duration, 0) || 0;
  const tabs = ['details', 'checklist', 'time', 'parts', 'comments', 'attachments'];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <button
              onClick={() => navigate('/work-orders')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Work Orders
            </button>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{workOrder.woNumber}</h1>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(workOrder.status)}`}>
                    {workOrder.status.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(workOrder.priority)}`}>
                    {workOrder.priority}
                  </span>
                </div>
                <p className="text-gray-700 mt-1">{workOrder.title}</p>
              </div>
              <div className="flex gap-2">
                <select
                  value={workOrder.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="closed">Closed</option>
                </select>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Edit
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
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Work Order Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-gray-900">{workOrder.description || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="text-gray-900">{workOrder.type || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Asset</p>
                    <p className="text-gray-900">{workOrder.asset?.name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Assigned To</p>
                    <p className="text-gray-900">
                      {workOrder.assignedTo ? `${workOrder.assignedTo.firstName} ${workOrder.assignedTo.lastName}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Scheduled Date</p>
                    <p className="text-gray-900">{workOrder.scheduledDate ? new Date(workOrder.scheduledDate).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="text-gray-900">{workOrder.dueDate ? new Date(workOrder.dueDate).toLocaleDateString() : '-'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Estimated Cost</p>
                    <p className="text-gray-900">${workOrder.estimatedCost?.toLocaleString() || '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Actual Cost</p>
                    <p className="text-gray-900">${workOrder.actualCost?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Progress */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress</h3>
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="8"
                        strokeDasharray={`${completionPercent * 2.51} 251`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{completionPercent}%</span>
                    </div>
                  </div>
                  <p className="text-gray-500 mt-2">{completedTasks} of {totalTasks} tasks completed</p>
                </div>
              </div>

              {/* Time Tracking */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Time Tracking</h3>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{formatDuration(totalTime)}</p>
                  <p className="text-gray-500">Total time logged</p>
                </div>
                <button
                  onClick={() => setIsTracking(!isTracking)}
                  className={`w-full mt-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isTracking
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {isTracking ? 'Stop Timer' : 'Start Timer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Checklist</h3>
              <p className="text-sm text-gray-500">{completedTasks} of {totalTasks} completed</p>
            </div>
            <div className="space-y-3">
              {workOrder.checklist?.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center p-4 rounded-lg border ${
                    item.completed ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleChecklistToggle(index)}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className={`ml-3 flex-1 ${item.completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {item.item}
                  </span>
                  {item.mandatory && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Required</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'time' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Time Entries</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Entry
              </button>
            </div>
            <div className="space-y-3">
              {workOrder.timeEntries?.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{entry.userName}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(entry.startTime).toLocaleString()} - {entry.endTime ? new Date(entry.endTime).toLocaleString() : 'In progress'}
                    </p>
                  </div>
                  <p className="font-medium text-gray-900">{formatDuration(entry.duration)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'parts' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Parts Used</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Part
              </button>
            </div>
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 text-sm font-medium text-gray-500">Part</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-500">Quantity</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-500">Unit Cost</th>
                  <th className="text-right py-3 text-sm font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workOrder.partsUsed?.map((part) => (
                  <tr key={part.id}>
                    <td className="py-3 text-gray-900">{part.name}</td>
                    <td className="py-3 text-right text-gray-600">{part.quantity}</td>
                    <td className="py-3 text-right text-gray-600">${part.unitCost}</td>
                    <td className="py-3 text-right font-medium text-gray-900">${part.quantity * part.unitCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'comments' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
            <div className="space-y-4 mb-4">
              {workOrder.comments?.map((comment) => (
                <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{comment.userName}</p>
                    <p className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-gray-600">{comment.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Post
              </button>
            </div>
          </div>
        )}

        {activeTab === 'attachments' && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Attachments</h3>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Upload
              </button>
            </div>
            <div className="text-center py-12 text-gray-500">
              No attachments uploaded yet
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkOrderDetailPage;
