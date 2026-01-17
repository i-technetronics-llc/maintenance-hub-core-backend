import React, { useState, useEffect } from 'react';

export interface Technician {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  role?: string;
  skills?: string[];
  availability?: 'available' | 'busy' | 'off';
  workload?: {
    assigned: number;
    completed: number;
    percentage: number;
  };
}

interface TechnicianSelectorProps {
  technicians: Technician[];
  selectedTechnicianId?: string;
  onSelect: (technicianId: string | undefined) => void;
  showWorkload?: boolean;
  showAvailability?: boolean;
  multiSelect?: boolean;
  selectedIds?: string[];
  onMultiSelect?: (ids: string[]) => void;
}

const getAvailabilityColor = (availability?: string): string => {
  switch (availability) {
    case 'available':
      return 'bg-green-500';
    case 'busy':
      return 'bg-yellow-500';
    case 'off':
      return 'bg-gray-400';
    default:
      return 'bg-gray-300';
  }
};

const getAvailabilityLabel = (availability?: string): string => {
  switch (availability) {
    case 'available':
      return 'Available';
    case 'busy':
      return 'Busy';
    case 'off':
      return 'Off';
    default:
      return 'Unknown';
  }
};

const getWorkloadColor = (percentage?: number): string => {
  if (!percentage) return 'bg-gray-200';
  if (percentage < 50) return 'bg-green-500';
  if (percentage < 80) return 'bg-yellow-500';
  return 'bg-red-500';
};

export const TechnicianSelector: React.FC<TechnicianSelectorProps> = ({
  technicians,
  selectedTechnicianId,
  onSelect,
  showWorkload = true,
  showAvailability = true,
  multiSelect = false,
  selectedIds = [],
  onMultiSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredTechnicians = technicians.filter((tech) => {
    const fullName = `${tech.firstName} ${tech.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           tech.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const selectedTechnician = technicians.find((t) => t.id === selectedTechnicianId);

  const handleSelect = (techId: string) => {
    if (multiSelect && onMultiSelect) {
      if (selectedIds.includes(techId)) {
        onMultiSelect(selectedIds.filter((id) => id !== techId));
      } else {
        onMultiSelect([...selectedIds, techId]);
      }
    } else {
      if (selectedTechnicianId === techId) {
        onSelect(undefined);
      } else {
        onSelect(techId);
      }
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.technician-selector')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className="technician-selector relative">
      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {selectedTechnician ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
              {selectedTechnician.firstName[0]}{selectedTechnician.lastName[0]}
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">
                {selectedTechnician.firstName} {selectedTechnician.lastName}
              </p>
              {showAvailability && (
                <p className="text-xs text-gray-500">
                  {getAvailabilityLabel(selectedTechnician.availability)}
                </p>
              )}
            </div>
          </div>
        ) : multiSelect && selectedIds.length > 0 ? (
          <span className="text-gray-700">
            {selectedIds.length} technician{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
        ) : (
          <span className="text-gray-500">Select technician...</span>
        )}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search technicians..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* All Technicians Option */}
          {!multiSelect && (
            <button
              onClick={() => {
                onSelect(undefined);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100
                ${!selectedTechnicianId ? 'bg-blue-50' : ''}`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-gray-700">All Technicians</span>
            </button>
          )}

          {/* Technician List */}
          <div className="overflow-y-auto max-h-56">
            {filteredTechnicians.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No technicians found
              </div>
            ) : (
              filteredTechnicians.map((tech) => {
                const isSelected = multiSelect
                  ? selectedIds.includes(tech.id)
                  : selectedTechnicianId === tech.id;

                return (
                  <button
                    key={tech.id}
                    onClick={() => handleSelect(tech.id)}
                    className={`w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50
                      ${isSelected ? 'bg-blue-50' : ''}`}
                  >
                    {/* Avatar with availability indicator */}
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
                        {tech.firstName[0]}{tech.lastName[0]}
                      </div>
                      {showAvailability && (
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${getAvailabilityColor(tech.availability)}`}
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">
                        {tech.firstName} {tech.lastName}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {tech.role && <span>{tech.role}</span>}
                        {tech.skills && tech.skills.length > 0 && (
                          <span className="truncate">
                            {tech.skills.slice(0, 2).join(', ')}
                            {tech.skills.length > 2 && ` +${tech.skills.length - 2}`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Workload indicator */}
                    {showWorkload && tech.workload && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {tech.workload.assigned} assigned
                        </p>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1">
                          <div
                            className={`h-1.5 rounded-full ${getWorkloadColor(tech.workload.percentage)}`}
                            style={{ width: `${Math.min(tech.workload.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Selection indicator */}
                    {multiSelect && (
                      <div className={`w-5 h-5 rounded border flex items-center justify-center
                        ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}
                      >
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Compact version for sidebar or filter
export const TechnicianList: React.FC<{
  technicians: Technician[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  showWorkload?: boolean;
}> = ({ technicians, selectedId, onSelect, showWorkload = true }) => {
  return (
    <div className="space-y-1">
      <button
        onClick={() => onSelect(undefined)}
        className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-colors
          ${!selectedId ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="font-medium">All Technicians</span>
      </button>

      {technicians.map((tech) => (
        <button
          key={tech.id}
          onClick={() => onSelect(tech.id)}
          className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-colors
            ${selectedId === tech.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-blue-600">
              {tech.firstName[0]}{tech.lastName[0]}
            </div>
            <div
              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${getAvailabilityColor(tech.availability)}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">
              {tech.firstName} {tech.lastName}
            </p>
            {showWorkload && tech.workload && (
              <p className="text-xs text-gray-500">
                {tech.workload.assigned} tasks
              </p>
            )}
          </div>
          {showWorkload && tech.workload && (
            <div className="w-12 h-1.5 bg-gray-200 rounded-full">
              <div
                className={`h-1.5 rounded-full ${getWorkloadColor(tech.workload.percentage)}`}
                style={{ width: `${Math.min(tech.workload.percentage, 100)}%` }}
              />
            </div>
          )}
        </button>
      ))}
    </div>
  );
};

export default TechnicianSelector;
