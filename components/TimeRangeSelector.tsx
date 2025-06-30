'use client';

import React from 'react';
import { useCrmStore } from '@/lib/store';
import { ChevronDown } from 'lucide-react';

const options = [
  { label: 'Last 30 Days', value: 30 },
  { label: 'Last 90 Days', value: 90 },
  { label: 'All Time', value: 0 }, // Using 0 for all time
];

export function TimeRangeSelector() {
  const { timeRange, setTimeRange } = useCrmStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedLabel = options.find(
    (opt) => opt.value === timeRange
  )?.label;

  const handleSelect = (value: number) => {
    setTimeRange(value);
    setIsOpen(false);
  };

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='w-48 justify-between text-left font-normal bg-white border border-gray-300 rounded-md px-3 py-2 text-sm flex items-center shadow-sm hover:bg-gray-50'>
        <span>{selectedLabel}</span>
        <ChevronDown
          className={`w-4 h-4 ml-2 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className='absolute z-10 top-full mt-1 w-48 bg-white border border-gray-300 rounded-lg shadow-lg py-1'>
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className='block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
