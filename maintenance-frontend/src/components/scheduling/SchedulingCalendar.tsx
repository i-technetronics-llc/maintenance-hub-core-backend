import React, { useState, useMemo, useCallback } from 'react';
import { CalendarCell } from './CalendarCell';
import { DraggableWorkOrder, WorkOrderData } from './DraggableWorkOrder';
import { Technician } from './TechnicianSelector';

export type ViewMode = 'month' | 'week' | 'day';

interface SchedulingCalendarProps {
  workOrders: WorkOrderData[];
  pmSchedules?: WorkOrderData[];
  technicians?: Technician[];
  selectedTechnicianId?: string;
  viewMode: ViewMode;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onReschedule: (workOrderId: string, newDate: Date, technicianId?: string) => void;
  onWorkOrderClick?: (workOrder: WorkOrderData) => void;
  onCreateWorkOrder?: (date: Date) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const SchedulingCalendar: React.FC<SchedulingCalendarProps> = ({
  workOrders,
  pmSchedules = [],
  selectedTechnicianId,
  viewMode,
  currentDate,
  onDateChange,
  onViewModeChange,
  onReschedule,
  onWorkOrderClick,
  onCreateWorkOrder,
}) => {
  const [draggedWorkOrder, setDraggedWorkOrder] = useState<WorkOrderData | null>(null);

  // Combine work orders and PM schedules
  const allItems = useMemo(() => {
    const pmItems: WorkOrderData[] = pmSchedules.map((pm) => ({
      ...pm,
      isPMSchedule: true,
    }));
    return [...workOrders, ...pmItems];
  }, [workOrders, pmSchedules]);

  // Filter by selected technician
  const filteredItems = useMemo(() => {
    if (!selectedTechnicianId) return allItems;
    return allItems.filter((item) => item.assignedTo?.id === selectedTechnicianId);
  }, [allItems, selectedTechnicianId]);

  // Group work orders by date
  const workOrdersByDate = useMemo(() => {
    const grouped: Record<string, WorkOrderData[]> = {};

    filteredItems.forEach((item) => {
      const dateStr = item.scheduledDate
        ? new Date(item.scheduledDate).toISOString().split('T')[0]
        : item.dueDate
          ? new Date(item.dueDate).toISOString().split('T')[0]
          : null;

      if (dateStr) {
        if (!grouped[dateStr]) grouped[dateStr] = [];
        grouped[dateStr].push(item);
      }
    });

    return grouped;
  }, [filteredItems]);

  // Detect conflicts (same technician, overlapping times)
  const detectConflicts = useCallback((date: Date): WorkOrderData[] => {
    const dateStr = date.toISOString().split('T')[0];
    const dayItems = workOrdersByDate[dateStr] || [];

    // Group by technician
    const byTechnician: Record<string, WorkOrderData[]> = {};
    dayItems.forEach((item) => {
      if (item.assignedTo?.id) {
        if (!byTechnician[item.assignedTo.id]) byTechnician[item.assignedTo.id] = [];
        byTechnician[item.assignedTo.id].push(item);
      }
    });

    // Find technicians with multiple assignments (simple conflict detection)
    const conflicts: WorkOrderData[] = [];
    Object.values(byTechnician).forEach((items) => {
      if (items.length > 1) {
        // Simple logic: if a technician has more than 3 items, flag as potential conflict
        if (items.length > 3) {
          conflicts.push(...items);
        }
      }
    });

    return conflicts;
  }, [workOrdersByDate]);

  // Generate calendar days for month view
  const getMonthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startPadding = firstDay.getDay();
    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }

    // Next month padding (to complete 6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [currentDate]);

  // Generate week days
  const getWeekDays = useMemo(() => {
    const day = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - day);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      return date;
    });
  }, [currentDate]);

  // Navigation handlers
  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);

    switch (viewMode) {
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }

    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  // Drag handlers
  const handleDragStart = (_e: React.DragEvent, workOrder: WorkOrderData) => {
    setDraggedWorkOrder(workOrder);
  };

  const handleDragEnd = () => {
    setDraggedWorkOrder(null);
  };

  const handleDrop = (date: Date, workOrder: WorkOrderData) => {
    onReschedule(workOrder.id, date, workOrder.assignedTo?.id);
    setDraggedWorkOrder(null);
  };

  // Get work orders for a specific date
  const getWorkOrdersForDate = (date: Date): WorkOrderData[] => {
    const dateStr = date.toISOString().split('T')[0];
    return workOrdersByDate[dateStr] || [];
  };

  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is weekend
  const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  // Format header based on view mode
  const getHeaderTitle = (): string => {
    switch (viewMode) {
      case 'month':
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'week': {
        const startOfWeek = getWeekDays[0];
        const endOfWeek = getWeekDays[6];
        if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
          return `${startOfWeek.toLocaleDateString('en-US', { month: 'long' })} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
        }
        return `${startOfWeek.toLocaleDateString('en-US', { month: 'short' })} ${startOfWeek.getDate()} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short' })} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
      }
      case 'day':
        return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      default:
        return '';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigate('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            {getHeaderTitle()}
          </h2>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors
                ${viewMode === mode ? 'bg-white shadow text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Body */}
      <div className="overflow-auto">
        {/* Month View */}
        {viewMode === 'month' && (
          <>
            {/* Days of week header */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-sm font-medium text-gray-600 border-r border-gray-200 last:border-r-0"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {getMonthDays.map(({ date, isCurrentMonth }, index) => (
                <CalendarCell
                  key={index}
                  date={date}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isToday(date)}
                  isWeekend={isWeekend(date)}
                  workOrders={getWorkOrdersForDate(date)}
                  onDrop={handleDrop}
                  onWorkOrderClick={onWorkOrderClick}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  conflicts={detectConflicts(date)}
                />
              ))}
            </div>
          </>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex border-b border-gray-200">
              <div className="w-16 shrink-0 py-2 px-1 text-xs text-gray-500 text-center border-r border-gray-200">
                Time
              </div>
              {getWeekDays.map((date, index) => (
                <div
                  key={index}
                  className={`flex-1 py-2 text-center border-r border-gray-200 last:border-r-0
                    ${isToday(date) ? 'bg-blue-50' : ''}`}
                >
                  <p className="text-xs text-gray-500">{DAYS_OF_WEEK[date.getDay()]}</p>
                  <p className={`text-lg font-semibold ${isToday(date) ? 'text-blue-600' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </p>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="flex-1 overflow-auto max-h-[600px]">
              {HOURS.slice(6, 20).map((hour) => (
                <div key={hour} className="flex border-b border-gray-100">
                  <div className="w-16 shrink-0 py-3 px-1 text-xs text-gray-500 text-right border-r border-gray-200">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  {getWeekDays.map((date, index) => {
                    const dayItems = getWorkOrdersForDate(date);
                    const hasItems = dayItems.length > 0;

                    return (
                      <div
                        key={index}
                        className={`flex-1 min-h-12 border-r border-gray-200 last:border-r-0 p-1
                          ${isWeekend(date) ? 'bg-gray-50' : ''}
                          ${isToday(date) ? 'bg-blue-50/50' : ''}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('bg-blue-100');
                        }}
                        onDragLeave={(e) => {
                          e.currentTarget.classList.remove('bg-blue-100');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('bg-blue-100');
                          try {
                            const data = e.dataTransfer.getData('application/json');
                            if (data) {
                              const workOrder = JSON.parse(data) as WorkOrderData;
                              const scheduledDate = new Date(date);
                              scheduledDate.setHours(hour, 0, 0, 0);
                              handleDrop(scheduledDate, workOrder);
                            }
                          } catch (error) {
                            console.error('Error parsing dropped data:', error);
                          }
                        }}
                      >
                        {hour === 8 && hasItems && (
                          <div className="space-y-1">
                            {dayItems.slice(0, 2).map((item) => (
                              <DraggableWorkOrder
                                key={item.id}
                                workOrder={item}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                onClick={onWorkOrderClick}
                                compact
                              />
                            ))}
                            {dayItems.length > 2 && (
                              <button
                                onClick={() => onDateChange(date)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                +{dayItems.length - 2} more
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <div className="flex flex-col">
            {/* All day section */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <div className="w-20 shrink-0 py-3 px-2 text-xs text-gray-500 border-r border-gray-200">
                All day
              </div>
              <div
                className="flex-1 p-2 min-h-16"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('bg-blue-100');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('bg-blue-100');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove('bg-blue-100');
                  try {
                    const data = e.dataTransfer.getData('application/json');
                    if (data) {
                      const workOrder = JSON.parse(data) as WorkOrderData;
                      handleDrop(currentDate, workOrder);
                    }
                  } catch (error) {
                    console.error('Error parsing dropped data:', error);
                  }
                }}
              >
                <div className="flex flex-wrap gap-2">
                  {getWorkOrdersForDate(currentDate).map((item) => (
                    <DraggableWorkOrder
                      key={item.id}
                      workOrder={item}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onClick={onWorkOrderClick}
                      compact={false}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Hour slots */}
            <div className="flex-1 overflow-auto max-h-[500px]">
              {HOURS.map((hour) => (
                <div key={hour} className="flex border-b border-gray-100">
                  <div className="w-20 shrink-0 py-4 px-2 text-xs text-gray-500 text-right border-r border-gray-200">
                    {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                  </div>
                  <div
                    className="flex-1 min-h-14 border-gray-200 hover:bg-gray-50"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('bg-blue-100');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('bg-blue-100');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('bg-blue-100');
                      try {
                        const data = e.dataTransfer.getData('application/json');
                        if (data) {
                          const workOrder = JSON.parse(data) as WorkOrderData;
                          const scheduledDate = new Date(currentDate);
                          scheduledDate.setHours(hour, 0, 0, 0);
                          handleDrop(scheduledDate, workOrder);
                        }
                      } catch (error) {
                        console.error('Error parsing dropped data:', error);
                      }
                    }}
                    onClick={() => {
                      const scheduledDate = new Date(currentDate);
                      scheduledDate.setHours(hour, 0, 0, 0);
                      onCreateWorkOrder?.(scheduledDate);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drag indicator */}
      {draggedWorkOrder && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span>Drop to reschedule: {draggedWorkOrder.title}</span>
        </div>
      )}
    </div>
  );
};

export default SchedulingCalendar;
