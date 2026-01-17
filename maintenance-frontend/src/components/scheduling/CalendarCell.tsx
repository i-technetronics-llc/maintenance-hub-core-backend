import React, { useState } from 'react';
import { DraggableWorkOrder, WorkOrderData } from './DraggableWorkOrder';

interface CalendarCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  workOrders: WorkOrderData[];
  technicianFilter?: string;
  onDrop: (date: Date, workOrder: WorkOrderData) => void;
  onWorkOrderClick?: (workOrder: WorkOrderData) => void;
  onDragStart: (e: React.DragEvent, workOrder: WorkOrderData) => void;
  onDragEnd: (e: React.DragEvent) => void;
  conflicts?: WorkOrderData[];
  maxVisible?: number;
}

export const CalendarCell: React.FC<CalendarCellProps> = ({
  date,
  isCurrentMonth,
  isToday,
  isWeekend,
  workOrders,
  onDrop,
  onWorkOrderClick,
  onDragStart,
  onDragEnd,
  conflicts = [],
  maxVisible = 3,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const workOrder = JSON.parse(data) as WorkOrderData;
        onDrop(date, workOrder);
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  const visibleWorkOrders = workOrders.slice(0, maxVisible);
  const hiddenCount = workOrders.length - maxVisible;
  const hasConflicts = conflicts.length > 0;

  const dayNumber = date.getDate();

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          min-h-28 p-1 border-r border-b border-gray-200 transition-colors duration-200
          ${!isCurrentMonth ? 'bg-gray-50' : isWeekend ? 'bg-gray-25' : 'bg-white'}
          ${isToday ? 'ring-2 ring-inset ring-blue-500' : ''}
          ${isDragOver ? 'bg-blue-100' : ''}
          ${hasConflicts ? 'bg-red-50' : ''}
        `}
      >
        <div className="flex items-center justify-between mb-1">
          <span
            className={`
              text-sm font-medium px-1.5 py-0.5 rounded-full
              ${isToday ? 'bg-blue-600 text-white' : ''}
              ${!isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
            `}
          >
            {dayNumber}
          </span>
          {hasConflicts && (
            <span className="text-xs text-red-600 font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {conflicts.length}
            </span>
          )}
        </div>

        <div className="space-y-1 overflow-hidden">
          {visibleWorkOrders.map((workOrder) => (
            <DraggableWorkOrder
              key={workOrder.id}
              workOrder={workOrder}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onClick={onWorkOrderClick}
              compact
              showAssignee={false}
            />
          ))}

          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAllModal(true)}
              className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium py-0.5 hover:bg-blue-50 rounded"
            >
              +{hiddenCount} more
            </button>
          )}
        </div>
      </div>

      {/* Modal to show all work orders for this day */}
      {showAllModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAllModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              <button
                onClick={() => setShowAllModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-96 space-y-2">
              {workOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No work orders scheduled</p>
              ) : (
                workOrders.map((workOrder) => (
                  <DraggableWorkOrder
                    key={workOrder.id}
                    workOrder={workOrder}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onClick={(wo) => {
                      setShowAllModal(false);
                      onWorkOrderClick?.(wo);
                    }}
                    compact={false}
                  />
                ))
              )}
            </div>

            {hasConflicts && (
              <div className="p-4 border-t border-red-200 bg-red-50">
                <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Scheduling Conflicts ({conflicts.length})
                </h4>
                <p className="text-sm text-red-600">
                  Some work orders have overlapping assignments or time slots.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CalendarCell;
