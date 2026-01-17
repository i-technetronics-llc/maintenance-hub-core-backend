import React from 'react';
import { ReportFilter, DataSourceColumn } from '../../services/api';

interface FilterBuilderProps {
  columns: DataSourceColumn[];
  filters: ReportFilter[];
  onChange: (filters: ReportFilter[]) => void;
}

const OPERATORS = [
  { value: 'eq', label: 'Equals' },
  { value: 'neq', label: 'Not Equals' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'gte', label: 'Greater Than or Equal' },
  { value: 'lt', label: 'Less Than' },
  { value: 'lte', label: 'Less Than or Equal' },
  { value: 'like', label: 'Contains' },
  { value: 'in', label: 'In List' },
  { value: 'between', label: 'Between' },
];

const getOperatorsForType = (type: string) => {
  switch (type) {
    case 'string':
    case 'text':
      return OPERATORS.filter(op => ['eq', 'neq', 'like', 'in'].includes(op.value));
    case 'number':
      return OPERATORS.filter(op => ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'between'].includes(op.value));
    case 'date':
      return OPERATORS.filter(op => ['eq', 'gt', 'gte', 'lt', 'lte', 'between'].includes(op.value));
    case 'boolean':
      return OPERATORS.filter(op => ['eq'].includes(op.value));
    case 'enum':
      return OPERATORS.filter(op => ['eq', 'neq', 'in'].includes(op.value));
    default:
      return OPERATORS;
  }
};

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  columns,
  filters,
  onChange,
}) => {
  const addFilter = () => {
    const newFilter: ReportFilter = {
      field: columns[0]?.field || '',
      operator: 'eq',
      value: '',
    };
    onChange([...filters, newFilter]);
  };

  const updateFilter = (index: number, updates: Partial<ReportFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    onChange(newFilters);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  const getColumnType = (field: string): string => {
    const column = columns.find(c => c.field === field);
    return column?.type || 'string';
  };

  const renderValueInput = (filter: ReportFilter, index: number) => {
    const columnType = getColumnType(filter.field);

    if (filter.operator === 'between') {
      const values = Array.isArray(filter.value) ? filter.value : ['', ''];
      return (
        <div className="flex space-x-2">
          <input
            type={columnType === 'date' ? 'date' : columnType === 'number' ? 'number' : 'text'}
            value={values[0] || ''}
            onChange={(e) => updateFilter(index, { value: [e.target.value, values[1]] })}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="From"
          />
          <input
            type={columnType === 'date' ? 'date' : columnType === 'number' ? 'number' : 'text'}
            value={values[1] || ''}
            onChange={(e) => updateFilter(index, { value: [values[0], e.target.value] })}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="To"
          />
        </div>
      );
    }

    if (filter.operator === 'in') {
      return (
        <input
          type="text"
          value={Array.isArray(filter.value) ? filter.value.join(', ') : filter.value}
          onChange={(e) => updateFilter(index, { value: e.target.value.split(',').map(v => v.trim()) })}
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Value1, Value2, ..."
        />
      );
    }

    if (columnType === 'boolean') {
      return (
        <select
          value={String(filter.value)}
          onChange={(e) => updateFilter(index, { value: e.target.value === 'true' })}
          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }

    return (
      <input
        type={columnType === 'date' ? 'date' : columnType === 'number' ? 'number' : 'text'}
        value={filter.value || ''}
        onChange={(e) => updateFilter(index, { value: e.target.value })}
        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        placeholder="Enter value"
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">Filters</h4>
        <button
          type="button"
          onClick={addFilter}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Filter
        </button>
      </div>

      {filters.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No filters applied. Click "Add Filter" to add one.</p>
      ) : (
        <div className="space-y-3">
          {filters.map((filter, index) => (
            <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <select
                value={filter.field}
                onChange={(e) => {
                  const newField = e.target.value;
                  const newType = getColumnType(newField);
                  const operators = getOperatorsForType(newType);
                  updateFilter(index, {
                    field: newField,
                    operator: operators[0]?.value as ReportFilter['operator'] || 'eq',
                    value: '',
                  });
                }}
                className="w-40 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {columns.map((col) => (
                  <option key={col.field} value={col.field}>
                    {col.label}
                  </option>
                ))}
              </select>

              <select
                value={filter.operator}
                onChange={(e) => updateFilter(index, { operator: e.target.value as ReportFilter['operator'], value: '' })}
                className="w-36 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                {getOperatorsForType(getColumnType(filter.field)).map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.label}
                  </option>
                ))}
              </select>

              {renderValueInput(filter, index)}

              <button
                type="button"
                onClick={() => removeFilter(index)}
                className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterBuilder;
