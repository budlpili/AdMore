import React from 'react';

interface StatusDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  statusOptions: string[];
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  optionClassName?: string;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  isOpen,
  onToggle,
  selectedStatus,
  onStatusChange,
  statusOptions,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  optionClassName = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={onToggle}
        className={`flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 ${buttonClassName}`}
      >
        <span>{selectedStatus}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className={`absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg ${dropdownClassName}`}>
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => {
                onStatusChange(status);
                onToggle();
              }}
              className={`w-full text-left px-3 py-2 hover:bg-gray-100 text-xs font-semibold ${
                selectedStatus === status ? 'bg-orange-50 text-orange-600' : 'text-gray-700'
              } ${optionClassName}`}
            >
              {status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusDropdown; 