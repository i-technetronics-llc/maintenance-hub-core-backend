import { useState, useEffect, DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { teamApi, Team } from '../services/api';
import { useOrganizationStore } from '../store/organizationStore';

interface TeamNode {
  team: Team;
  children: TeamNode[];
  level: number;
  isExpanded: boolean;
}

const TEAM_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
  '#06B6D4', '#EC4899', '#6366F1', '#14B8A6', '#F97316',
];

export function TeamVisualizationPage() {
  const { selectedOrganization } = useOrganizationStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [treeData, setTreeData] = useState<TeamNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [draggedTeam, setDraggedTeam] = useState<Team | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'org-chart'>('tree');

  useEffect(() => {
    fetchTeams();
  }, [selectedOrganization]);

  useEffect(() => {
    if (teams.length > 0) {
      const tree = buildTree(teams);
      setTreeData(tree);
      // Auto-expand all nodes initially
      const allIds = new Set(teams.map(t => t.id));
      setExpandedNodes(allIds);
    }
  }, [teams]);

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

  const buildTree = (teams: Team[], parentId: string | null = null, level: number = 0): TeamNode[] => {
    return teams
      .filter(t => (t.parentTeamId || null) === parentId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
      .map(team => ({
        team,
        children: buildTree(teams, team.id, level + 1),
        level,
        isExpanded: true,
      }));
  };

  const toggleExpand = (teamId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, team: Team) => {
    setDraggedTeam(team);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', team.id);
  };

  const handleDragEnd = () => {
    setDraggedTeam(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, targetId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(targetId);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetParentId: string | null) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedTeam) return;

    // Prevent dropping on itself or its own children
    if (draggedTeam.id === targetParentId) return;
    if (isDescendant(draggedTeam.id, targetParentId)) return;

    try {
      await teamApi.moveTeam(draggedTeam.id, targetParentId);
      setSuccessMessage(`Team "${draggedTeam.name}" moved successfully`);
      fetchTeams();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error moving team:', err);
      setError(err.response?.data?.message || 'Failed to move team');
    }

    setDraggedTeam(null);
  };

  const isDescendant = (parentId: string, childId: string | null): boolean => {
    if (!childId) return false;
    const child = teams.find(t => t.id === childId);
    if (!child) return false;
    if (child.parentTeamId === parentId) return true;
    return isDescendant(parentId, child.parentTeamId || null);
  };

  const renderTreeNode = (node: TeamNode): JSX.Element => {
    const isExpanded = expandedNodes.has(node.team.id);
    const hasChildren = node.children.length > 0;
    const isDragging = draggedTeam?.id === node.team.id;
    const isDropTarget = dropTarget === node.team.id;

    return (
      <div key={node.team.id} className="select-none">
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node.team)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, node.team.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node.team.id)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing
            transition-all duration-200
            ${isDragging ? 'opacity-50 bg-blue-50' : 'hover:bg-gray-50'}
            ${isDropTarget ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
          `}
          style={{ marginLeft: `${node.level * 24}px` }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand(node.team.id);
            }}
            className={`w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 ${
              !hasChildren ? 'invisible' : ''
            }`}
          >
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Team Color Indicator */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: node.team.color || TEAM_COLORS[0] }}
          >
            {node.team.name.substring(0, 2).toUpperCase()}
          </div>

          {/* Team Info */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{node.team.name}</p>
            <p className="text-xs text-gray-500">
              {node.team.members?.length || 0} members
              {node.team.leaderId && ' | Has leader'}
            </p>
          </div>

          {/* Status Badge */}
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
            node.team.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {node.team.isActive ? 'Active' : 'Inactive'}
          </span>

          {/* Drag Handle */}
          <div className="text-gray-400 cursor-grab">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  const renderOrgChartNode = (node: TeamNode): JSX.Element => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.team.id);
    const isDragging = draggedTeam?.id === node.team.id;
    const isDropTarget = dropTarget === node.team.id;

    return (
      <div key={node.team.id} className="flex flex-col items-center">
        {/* Node */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, node.team)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => handleDragOver(e, node.team.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, node.team.id)}
          className={`
            relative bg-white rounded-xl shadow-md border-2 p-4 cursor-grab active:cursor-grabbing
            transition-all duration-200 min-w-[180px] max-w-[220px]
            ${isDragging ? 'opacity-50 scale-95' : 'hover:shadow-lg hover:-translate-y-1'}
            ${isDropTarget ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
          `}
        >
          {/* Color Bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
            style={{ backgroundColor: node.team.color || TEAM_COLORS[0] }}
          />

          {/* Team Info */}
          <div className="text-center mt-2">
            <div
              className="w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white text-lg font-bold mb-2"
              style={{ backgroundColor: node.team.color || TEAM_COLORS[0] }}
            >
              {node.team.name.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="font-semibold text-gray-900 truncate">{node.team.name}</h3>
            <p className="text-sm text-gray-500">{node.team.members?.length || 0} members</p>
            <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${
              node.team.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {node.team.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Expand Button for children */}
          {hasChildren && (
            <button
              onClick={() => toggleExpand(node.team.id)}
              className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-blue-500 hover:text-blue-500"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Connector Line */}
        {hasChildren && isExpanded && (
          <>
            <div className="w-0.5 h-8 bg-gray-300" />
            <div className="flex items-start gap-4">
              {node.children.map((child, idx) => (
                <div key={child.team.id} className="flex flex-col items-center">
                  {/* Horizontal connector */}
                  {node.children.length > 1 && (
                    <div className="relative h-4">
                      <div className="absolute top-0 h-0.5 bg-gray-300" style={{
                        left: idx === 0 ? '50%' : 0,
                        right: idx === node.children.length - 1 ? '50%' : 0,
                      }} />
                      <div className="absolute top-0 left-1/2 w-0.5 h-full bg-gray-300" />
                    </div>
                  )}
                  {renderOrgChartNode(child)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
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
              <h1 className="text-2xl font-bold text-gray-900">Teams Visualization</h1>
              <p className="text-sm text-gray-500">Drag and drop teams to reorganize hierarchy</p>
            </div>
            <div className="flex gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('tree')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                    viewMode === 'tree'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Tree View
                </button>
                <button
                  onClick={() => setViewMode('org-chart')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                    viewMode === 'org-chart'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Org Chart
                </button>
              </div>
              <Link
                to="/teams"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                List View
              </Link>
              <button
                onClick={() => {
                  const allIds = new Set(teams.map(t => t.id));
                  setExpandedNodes(allIds);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={() => setExpandedNodes(new Set())}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Collapse All
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

        {/* Instructions */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-medium text-blue-900">How to reorganize teams</h3>
              <p className="text-sm text-blue-700 mt-1">
                Drag any team and drop it onto another team to make it a child of that team.
                Drop on the "Root Level" zone to make it a top-level team.
              </p>
            </div>
          </div>
        </div>

        {/* Root Drop Zone */}
        <div
          onDragOver={(e) => handleDragOver(e, null)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
          className={`
            mb-4 p-4 border-2 border-dashed rounded-xl text-center transition-all
            ${dropTarget === null && draggedTeam ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          `}
        >
          <p className="text-sm text-gray-500">
            Drop here to make a team top-level (no parent)
          </p>
        </div>

        {/* Visualization Content */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {teams.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
              <p className="text-gray-500 mb-4">Create your first team to start building your organization structure.</p>
              <Link
                to="/teams"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Team
              </Link>
            </div>
          ) : viewMode === 'tree' ? (
            <div className="space-y-1">
              {treeData.map(node => renderTreeNode(node))}
            </div>
          ) : (
            <div className="overflow-x-auto pb-8">
              <div className="flex justify-center gap-6 pt-4">
                {treeData.map(node => renderOrgChartNode(node))}
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl border">
          <h3 className="font-medium text-gray-900 mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-green-100 rounded-full"></span>
              <span className="text-sm text-gray-600">Active Team</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-gray-100 rounded-full"></span>
              <span className="text-sm text-gray-600">Inactive Team</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Drop Target</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
              <span className="text-sm text-gray-600">Drag Handle</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TeamVisualizationPage;
