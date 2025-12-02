'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange, DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import { useCrmStore } from '@/lib/store';

export function DatePicker() {
  // Date range selection is local to this component. We'll compute a ``days`` value
  // based on the selected range and call the store's `fetchData(days)` so we do
  // not rely on the global store shape containing `dateRange` / `setDateRange`.
  const { fetchData } = useCrmStore();
  const [dateRange, setDateRange] = React.useState<
    DateRange | undefined
  >(undefined);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateChange = (newDateRange?: DateRange) => {
    if (newDateRange?.from && newDateRange?.to) {
      setDateRange(newDateRange);
      // Convert the selected date range to number of days and call fetchData
      // with that number so the store's fetch handler remains stable.
      const msPerDay = 24 * 60 * 60 * 1000;
      const days = Math.ceil(
        (newDateRange.to.getTime() - newDateRange.from.getTime()) /
          msPerDay
      );
      // If days is 0 (same-day range), use 1 as the smallest meaningful range.
      fetchData(Math.max(days, 1));
      setIsOpen(false);
    }
  };

  return (
    <div className='relative'>
      <button
        id='date'
        onClick={() => setIsOpen(!isOpen)}
        className='w-[300px] justify-start text-left font-normal bg-white border border-gray-300 rounded-md px-3 py-2 text-sm flex items-center shadow-sm hover:bg-gray-50'>
        <CalendarIcon className='mr-2 h-4 w-4' />
        {dateRange?.from ? (
          dateRange.to ? (
            <>
              {format(dateRange.from, 'LLL dd, y')} -{' '}
              {format(dateRange.to, 'LLL dd, y')}
            </>
          ) : (
            format(dateRange.from, 'LLL dd, y')
          )
        ) : (
          <span>Pick a date</span>
        )}
      </button>
      {isOpen && (
        <div className='absolute z-10 top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg'>
          <style>{`.rdp { --rdp-cell-size: 36px; }`}</style>
          <DayPicker
            initialFocus
            mode='range'
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </div>
      )}
    </div>
  );
}
