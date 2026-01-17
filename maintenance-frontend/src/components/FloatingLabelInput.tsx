import { useState, InputHTMLAttributes, SelectHTMLAttributes } from 'react';

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

interface FloatingLabelSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
}

interface FloatingLabelTextareaProps extends InputHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  rows?: number;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = props.value !== undefined && props.value !== '';

  return (
    <div className="form-group relative mb-4">
      <input
        {...props}
        className={`
          peer w-full px-3 pt-5 pb-2 border rounded-md
          focus:outline-none focus:ring-2 transition-all
          ${error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
          ${className}
        `}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        placeholder=" "
      />
      <label
        className={`
          absolute left-3 transition-all pointer-events-none
          ${isFocused || hasValue || props.placeholder === ' '
            ? 'top-1.5 text-xs'
            : 'top-3.5 text-base'}
          ${error
            ? isFocused ? 'text-red-600' : 'text-red-500'
            : isFocused ? 'text-blue-600' : 'text-gray-500'}
        `}
      >
        {label}
      </label>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export const FloatingLabelSelect: React.FC<FloatingLabelSelectProps> = ({
  label,
  error,
  className = '',
  children,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = props.value !== undefined && props.value !== '';

  return (
    <div className="form-group relative mb-4">
      <select
        {...props}
        className={`
          peer w-full px-3 pt-5 pb-2 border rounded-md
          focus:outline-none focus:ring-2 transition-all
          ${error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
          ${className}
        `}
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
      >
        {children}
      </select>
      <label
        className={`
          absolute left-3 transition-all pointer-events-none
          ${isFocused || hasValue ? 'top-1.5 text-xs' : 'top-3.5 text-base'}
          ${error
            ? isFocused ? 'text-red-600' : 'text-red-500'
            : isFocused ? 'text-blue-600' : 'text-gray-500'}
        `}
      >
        {label}
      </label>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export const FloatingLabelTextarea: React.FC<FloatingLabelTextareaProps> = ({
  label,
  error,
  className = '',
  rows = 3,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = props.value !== undefined && props.value !== '';

  return (
    <div className="form-group relative mb-4">
      <textarea
        {...(props as any)}
        rows={rows}
        className={`
          peer w-full px-3 pt-5 pb-2 border rounded-md
          focus:outline-none focus:ring-2 transition-all resize-vertical
          ${error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
          ${className}
        `}
        onFocus={(e: any) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e: any) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        placeholder=" "
      />
      <label
        className={`
          absolute left-3 transition-all pointer-events-none
          ${isFocused || hasValue || props.placeholder === ' '
            ? 'top-1.5 text-xs'
            : 'top-3.5 text-base'}
          ${error
            ? isFocused ? 'text-red-600' : 'text-red-500'
            : isFocused ? 'text-blue-600' : 'text-gray-500'}
        `}
      >
        {label}
      </label>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};
