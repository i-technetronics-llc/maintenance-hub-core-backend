import React, { useState } from 'react';
import { DataSourceColumn } from '../../services/api';

interface ColumnSelectorProps {
  availableColumns: DataSourceColumn[];
  selectedColumns: string[];
  onChange: (columns: string[]) => void;
}

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  availableColumns,
  selectedColumns,
  onChange,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const toggleColumn = (field: string) => {
    if (selectedColumns.includes(field)) {
      onChange(selectedColumns.filter(c => c !== field));
    } else {
      onChange([...selectedColumns, field]);
    }
  };

  const selectAll = () => {
    onChange(availableColumns.map(c => c.field));
  };

  const deselectAll = () => {
    onChange([]);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newColumns = [...selectedColumns];
    const draggedItem = newColumns[draggedIndex];
    newColumns.splice(draggedIndex, 1);
    newColumns.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    onChange(newColumns);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedColumns.length) return;

    const newColumns = [...selectedColumns];
    const [removed] = newColumns.splice(index, 1);
    newColumns.splice(newIndex, 0, removed);
    onChange(newColumns);
  };

  const getColumnLabel = (field: string): string => {
    const column = availableColumns.find(c => c.field === field);
    return column?.label || field;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">Columns</h4>
        <div className="space-x-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={deselectAll}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Deselect All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Available Columns */}
        <div>
          <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">Available</h5>
          <div className="border rounded-lg p-2 bg-gray-50 max-h-64 overflow-y-auto">
            {availableColumns
              .filter(col => !selectedColumns.includes(col.field))
              .map((column) => (
                <div
                  key={column.field}
                  onClick={() => toggleColumn(column.field)}
                  className="flex items-center justify-between p-2 hover:bg-white cursor-pointer rounded transition-colors"
                >
                  <div className="flex items-center">
                    <span className="text-sm text-gray-700">{column.label}</span>
                    <span className="ml-2 text-xs text-gray-400 capitalize">({column.type})</span>
                  </div>
                  <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              ))}
            {availableColumns.filter(col => !selectedColumns.includes(col.field)).length === 0 && (
              <p className="text-xs text-gray-400 italic p-2">All columns selected</p>
            )}
          </div>
        </div>

        {/* Selected Columns (draggable) */}
        <div>
          <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">
            Selected ({selectedColumns.length}) - Drag to reorder
          </h5>
          <div className="border rounded-lg p-2 bg-white max-h-64 overflow-y-auto">
            {selectedColumns.length === 0 ? (
              <p className="text-xs text-gray-400 italic p-2">No columns selected</p>
            ) : (
              selectedColumns.map((field, index) => (
                <div
                  key={field}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center justify-between p-2 rounded transition-colors cursor-move ${
                    draggedIndex === index ? 'bg-blue-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center">
                    <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                    <span className="text-sm text-gray-700">{getColumnLabel(field)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveColumn(index, 'up'); }}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); moveColumn(index, 'down'); }}
                      disabled={index === selectedColumns.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleColumn(field); }}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnSelector;
