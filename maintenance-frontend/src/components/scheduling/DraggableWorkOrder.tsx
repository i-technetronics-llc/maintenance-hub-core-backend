import React from 'react';

export interface WorkOrderData {
  id: string;
  woNumber?: string;
  title: string;
  description?: string;
  type?: string;
  priority: string;
  status: string;
  scheduledDate?: string;
  dueDate?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  asset?: {
    id: string;
    name: string;
  };
  estimatedHours?: number;
  isPMSchedule?: boolean;
  pmScheduleId?: string;
}

interface DraggableWorkOrderProps {
  workOrder: WorkOrderData;
  onDragStart: (e: React.DragEvent, workOrder: WorkOrderData) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onClick?: (workOrder: WorkOrderData) => void;
  compact?: boolean;
  showAssignee?: boolean;
}

const getPriorityColor = (priority: string): string => {
  switch (priority?.toLowerCase()) {
    case 'critical':
      return 'border-l-red-600 bg-red-50';
    case 'high':
      return 'border-l-orange-500 bg-orange-50';
    case 'medium':
      return 'border-l-yellow-500 bg-yellow-50';
    case 'low':
      return 'border-l-green-500 bg-green-50';
    default:
      return 'border-l-gray-400 bg-gray-50';
  }
};

const getPriorityBadge = (priority: string): string => {
  switch (priority?.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-700';
    case 'high':
      return 'bg-orange-100 text-orange-700';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700';
    case 'low':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusBadge = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'open':
    case 'draft':
      return 'bg-blue-100 text-blue-700';
    case 'in_progress':
    case 'in progress':
      return 'bg-purple-100 text-purple-700';
    case 'on_hold':
    case 'on hold':
      return 'bg-yellow-100 text-yellow-700';
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'cancelled':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getTypeIcon = (type?: string, isPM?: boolean): JSX.Element => {
  if (isPM) {
    return (
      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }

  switch (type?.toLowerCase()) {
    case 'corrective':
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    case 'preventive':
      return (
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'predictive':
      return (
        <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'inspection':
      return (
        <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
  }
};

export const DraggableWorkOrder: React.FC<DraggableWorkOrderProps> = ({
  workOrder,
  onDragStart,
  onDragEnd,
  onClick,
  compact = false,
  showAssignee = true,
}) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(workOrder));
    onDragStart(e, workOrder);
  };

  if (compact) {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        onClick={() => onClick?.(workOrder)}
        className={`
          px-2 py-1 text-xs rounded border-l-4 cursor-move
          hover:shadow-md transition-shadow duration-200
          ${getPriorityColor(workOrder.priority)}
        `}
      >
        <div className="flex items-center gap-1">
          {getTypeIcon(workOrder.type, workOrder.isPMSchedule)}
          <span className="truncate font-medium">{workOrder.title}</span>
        </div>
        {workOrder.assignedTo && showAssignee && (
          <div className="text-gray-500 truncate mt-0.5">
            {workOrder.assignedTo.firstName} {workOrder.assignedTo.lastName?.[0]}.
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onClick?.(workOrder)}
      className={`
        p-3 rounded-lg border-l-4 cursor-move
        hover:shadow-lg transition-all duration-200
        ${getPriorityColor(workOrder.priority)}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {getTypeIcon(workOrder.type, workOrder.isPMSchedule)}
          <div className="min-w-0">
            <h4 className="font-medium text-gray-900 truncate">{workOrder.title}</h4>
            {workOrder.woNumber && (
              <p className="text-xs text-gray-500">{workOrder.woNumber}</p>
            )}
          </div>
        </div>
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full shrink-0 ${getPriorityBadge(workOrder.priority)}`}>
          {workOrder.priority}
        </span>
      </div>

      {workOrder.description && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{workOrder.description}</p>
      )}

      {workOrder.asset && (
        <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="truncate">{workOrder.asset.name}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(workOrder.status)}`}>
            {workOrder.status.replace(/_/g, ' ')}
          </span>
          {workOrder.estimatedHours && (
            <span className="text-xs text-gray-500">
              {workOrder.estimatedHours}h
            </span>
          )}
        </div>
        {workOrder.assignedTo && showAssignee && (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
              {workOrder.assignedTo.firstName[0]}{workOrder.assignedTo.lastName?.[0]}
            </div>
            <span className="text-xs text-gray-600 truncate max-w-20">
              {workOrder.assignedTo.firstName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraggableWorkOrder;
