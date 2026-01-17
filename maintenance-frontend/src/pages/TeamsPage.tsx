import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { teamApi, Team, userApi, User, companyApi, Company } from '../services/api';
import { useOrganizationStore } from '../store/organizationStore';
import { useAuthStore } from '../store/authStore';

interface TeamFormData {
  name: string;
  code: string;
  description: string;
  parentTeamId: string;
  leaderId: string;
  color: string;
  isActive: boolean;
  organizationId: string;
}

const TEAM_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
  '#06B6D4', '#EC4899', '#6366F1', '#14B8A6', '#F97316',
];

export function TeamsPage() {
  const { selectedOrganization } = useOrganizationStore();
  const { isSuperAdmin } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Team | null>(null);
  const [saving, setSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    code: '',
    description: '',
    parentTeamId: '',
    leaderId: '',
    color: TEAM_COLORS[0],
    isActive: true,
    organizationId: '',
  });

  useEffect(() => {
    fetchTeams();
    fetchUsers();
    if (isSuperAdmin()) {
      fetchOrganizations();
    }
  }, [selectedOrganization]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError('');
      const params: Record<string, any> = { includeMembers: true };
      if (selectedOrganization?.id) {
        params.organizationId = selectedOrganization.id;
      }
      const data = await teamApi.getAll(params);
      setTeams(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching teams:', err);
      setError(err.response?.data?.message || 'Failed to load teams');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userApi.getAll();
      setUsers(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await companyApi.getAll({ status: 'active' });
      const orgs = response?.data || response?.items || response || [];
      setOrganizations(Array.isArray(orgs) ? orgs : []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };

  const generateCode = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6) + '-' + Date.now().toString(36).toUpperCase().slice(-4);
  };

  const handleOpenModal = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setFormData({
        name: team.name,
        code: team.code,
        description: team.description || '',
        parentTeamId: team.parentTeamId || '',
        leaderId: team.leaderId || '',
        color: team.color || TEAM_COLORS[0],
        isActive: team.isActive,
        organizationId: team.organizationId || '',
      });
    } else {
      setEditingTeam(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        parentTeamId: '',
        leaderId: '',
        color: TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)],
        isActive: true,
        organizationId: selectedOrganization?.id || '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTeam(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      parentTeamId: '',
      leaderId: '',
      color: TEAM_COLORS[0],
      isActive: true,
      organizationId: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const payload = {
        name: formData.name.trim(),
        code: formData.code || generateCode(formData.name),
        description: formData.description.trim() || undefined,
        parentTeamId: formData.parentTeamId || undefined,
        leaderId: formData.leaderId || undefined,
        color: formData.color,
        isActive: formData.isActive,
        organizationId: formData.organizationId || selectedOrganization?.id || undefined,
      };

      if (editingTeam) {
        await teamApi.update(editingTeam.id, payload);
        setSuccessMessage('Team updated successfully');
      } else {
        await teamApi.create(payload);
        setSuccessMessage('Team created successfully');
      }

      handleCloseModal();
      fetchTeams();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving team:', err);
      setError(err.response?.data?.message || 'Failed to save team');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      setSaving(true);
      await teamApi.delete(deleteConfirm.id);
      setSuccessMessage('Team deleted successfully');
      setDeleteConfirm(null);
      fetchTeams();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error deleting team:', err);
      setError(err.response?.data?.message || 'Failed to delete team');
    } finally {
      setSaving(false);
    }
  };

  // Filter and search teams
  const filteredTeams = teams.filter(team => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (team.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && team.isActive) ||
      (filterStatus === 'inactive' && !team.isActive);
    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeams = filteredTeams.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const stats = {
    total: teams.length,
    active: teams.filter(t => t.isActive).length,
    inactive: teams.filter(t => !t.isActive).length,
    withMembers: teams.filter(t => (t.members?.length || 0) > 0).length,
  };

  const getParentTeamName = (parentId?: string) => {
    if (!parentId) return 'None (Top Level)';
    const parent = teams.find(t => t.id === parentId);
    return parent?.name || 'Unknown';
  };

  const getLeaderName = (leaderId?: string) => {
    if (!leaderId) return 'Not assigned';
    const leader = users.find(u => u.id === leaderId);
    return leader ? `${leader.firstName} ${leader.lastName}` : 'Unknown';
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
              <h1 className="text-2xl font-bold text-gray-900">Teams Management</h1>
              <p className="text-sm text-gray-500">Create and manage organization teams</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/teams/visualization"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Visualization
              </Link>
              <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Team
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Total Teams</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">Inactive</p>
            <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">With Members</p>
            <p className="text-2xl font-bold text-blue-600">{stats.withMembers}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={fetchTeams}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Teams Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leader</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedTeams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p>No teams found</p>
                      <button
                        onClick={() => handleOpenModal()}
                        className="mt-4 text-blue-600 hover:text-blue-700"
                      >
                        Create your first team
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedTeams.map((team) => (
                    <tr key={team.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold mr-3"
                            style={{ backgroundColor: team.color || TEAM_COLORS[0] }}
                          >
                            {team.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{team.name}</p>
                            {team.description && (
                              <p className="text-sm text-gray-500 truncate max-w-xs">{team.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-mono bg-gray-100 rounded">
                          {team.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getParentTeamName(team.parentTeamId)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {getLeaderName(team.leaderId)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                          {team.members?.length || 0} members
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          team.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {team.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenModal(team)}
                          className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(team)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <span className="text-sm text-gray-500">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTeams.length)} of {filteredTeams.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTeam ? 'Edit Team' : 'Create New Team'}
                </h2>
                <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Team Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (!editingTeam && !formData.code) {
                      setFormData(prev => ({ ...prev, name: e.target.value, code: generateCode(e.target.value) }));
                    }
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter team name"
                  required
                />
              </div>

              {/* Team Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Auto-generated if left empty"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter team description"
                />
              </div>

              {/* Organization (for super admin) */}
              {isSuperAdmin() && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <select
                    value={formData.organizationId}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Organization-wide (All)</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty for organization-wide team
                  </p>
                </div>
              )}

              {/* Parent Team */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parent Team
                </label>
                <select
                  value={formData.parentTeamId}
                  onChange={(e) => setFormData({ ...formData, parentTeamId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None (Top Level Team)</option>
                  {teams
                    .filter(t => t.id !== editingTeam?.id)
                    .map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                </select>
              </div>

              {/* Team Leader */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Leader
                </label>
                <select
                  value={formData.leaderId}
                  onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a leader</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-lg border-2 transition ${
                        formData.color === color ? 'border-gray-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                  Team is active
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Team
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamsPage;
