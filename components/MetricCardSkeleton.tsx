import React from 'react';

const MetricCardSkeleton = () => {
  return (
    <div className='metric-card animate-pulse h-full flex flex-col justify-between'>
      <div className='flex items-center justify-between mb-2'>
        <div className='h-4 bg-gray-200 rounded w-1/3'></div>
        <div className='h-6 w-6 bg-gray-200 rounded-full'></div>
      </div>
      <div className='flex items-end gap-3 mb-1'>
        <div className='h-8 bg-gray-200 rounded w-1/2'></div>
      </div>
      <div className='mt-2 h-4 bg-gray-200 rounded w-1/4'></div>
    </div>
  );
};

export default MetricCardSkeleton;
