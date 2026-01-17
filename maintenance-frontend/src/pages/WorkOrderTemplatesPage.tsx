import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useOrganizationStore } from '../store/organizationStore';

interface PMTask {
  id: string;
  name: string;
  description?: string;
  category?: string;
  estimatedDuration?: number;
  requiredSkills?: string[];
  requiredParts?: any[];
  checklistItems?: any[];
  safetyInstructions?: string;
  organizationId?: string;
  organization?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

const TASK_CATEGORIES = [
  'Inspection',
  'Lubrication',
  'Calibration',
  'Replacement',
  'Cleaning',
  'Testing',
  'Safety Check',
  'Electrical',
  'Mechanical',
  'HVAC',
  'Plumbing',
  'Other',
];

export function WorkOrderTemplatesPage() {
  const { selectedOrganization } = useOrganizationStore();
  const [tasks, setTasks] = useState<PMTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    category: '',
    estimatedDuration: '',
    safetyInstructions: '',
  });

  // View/Edit modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<PMTask | null>(null);

  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchTasks();
  }, [selectedOrganization]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedOrganization?.id) {
        params.organizationId = selectedOrganization.id;
      }
      const response = await api.get('/preventive-maintenance/tasks', { params });
      const data = response.data?.data || response.data || [];
      setTasks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching tasks:', err);
      setError(err.response?.data?.message || 'Failed to fetch templates');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    try {
      const payload = {
        name: newTask.name,
        description: newTask.description || undefined,
        category: newTask.category || undefined,
        estimatedDuration: newTask.estimatedDuration ? parseInt(newTask.estimatedDuration) : undefined,
        safetyInstructions: newTask.safetyInstructions || undefined,
        organizationId: selectedOrganization?.id,
      };

      await api.post('/preventive-maintenance/tasks', payload);
      setShowCreateModal(false);
      setNewTask({
        name: '',
        description: '',
        category: '',
        estimatedDuration: '',
        safetyInstructions: '',
      });
      fetchTasks();
    } catch (err: any) {
      console.error('Error creating task:', err);
      setCreateError(err.response?.data?.message || 'Failed to create template');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await api.delete(`/preventive-maintenance/tasks/${id}`);
      fetchTasks();
    } catch (err: any) {
      console.error('Error deleting task:', err);
      alert(err.response?.data?.message || 'Failed to delete template');
    }
  };

  const openCreateModal = () => {
    setNewTask({
      name: '',
      description: '',
      category: '',
      estimatedDuration: '',
      safetyInstructions: '',
    });
    setCreateError('');
    setShowCreateModal(true);
  };

  const openDetailModal = (task: PMTask) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm ||
      task.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || task.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from tasks
  const uniqueCategories = [...new Set(tasks.map(t => t.category).filter(Boolean))].sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500 text-sm">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Work Order Templates</h2>
          <p className="text-gray-600">Manage reusable task templates for preventive maintenance</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Template
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search templates by name or description..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => openDetailModal(task)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">{task.name}</h3>
                {task.category && (
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {task.category}
                  </span>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            {task.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {task.estimatedDuration && (
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {task.estimatedDuration} min
                </div>
              )}
              {task.checklistItems && task.checklistItems.length > 0 && (
                <div className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  {task.checklistItems.length} items
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || categoryFilter
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating a new template'}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Template
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 animate-slide-in-right overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Template</h3>
                <p className="text-sm text-gray-500">Add a new task template</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="flex-1 overflow-y-auto p-6 space-y-5">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., HVAC Filter Replacement"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category
                </label>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">Select a category</option>
                  {TASK_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  placeholder="Describe the task template..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={newTask.estimatedDuration}
                  onChange={(e) => setNewTask({ ...newTask, estimatedDuration: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="e.g., 30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Safety Instructions
                </label>
                <textarea
                  rows={2}
                  value={newTask.safetyInstructions}
                  onChange={(e) => setNewTask({ ...newTask, safetyInstructions: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                  placeholder="Any safety precautions to follow..."
                />
              </div>
            </form>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                onClick={handleCreateTask}
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedTask && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowDetailModal(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 animate-slide-in-right overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Template Details</h3>
                <p className="text-sm text-gray-500">{selectedTask.name}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-1">Name</h4>
                <p className="text-sm text-gray-900">{selectedTask.name}</p>
              </div>

              {selectedTask.category && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
                  <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {selectedTask.category}
                  </span>
                </div>
              )}

              {selectedTask.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                  <p className="text-sm text-gray-900">{selectedTask.description}</p>
                </div>
              )}

              {selectedTask.estimatedDuration && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Estimated Duration</h4>
                  <p className="text-sm text-gray-900">{selectedTask.estimatedDuration} minutes</p>
                </div>
              )}

              {selectedTask.safetyInstructions && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Safety Instructions</h4>
                  <p className="text-sm text-gray-900">{selectedTask.safetyInstructions}</p>
                </div>
              )}

              {selectedTask.checklistItems && selectedTask.checklistItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Checklist Items</h4>
                  <ul className="space-y-2">
                    {selectedTask.checklistItems.map((item: any, index: number) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-900">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                        </svg>
                        {item.description || item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Created: {new Date(selectedTask.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  Updated: {new Date(selectedTask.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => handleDeleteTask(selectedTask.id)}
                className="px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default WorkOrderTemplatesPage;
