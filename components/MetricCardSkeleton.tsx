import React from 'react';

const MetricCardSkeleton = () => {
  return (
    <div className='card animate-pulse'>
      <div className='flex items-center justify-between'>
        <div className='h-4 bg-gray-200 rounded w-1/3'></div>
        <div className='h-6 w-6 bg-gray-200 rounded-full'></div>
      </div>
      <div className='mt-4 h-8 bg-gray-200 rounded w-1/2'></div>
      <div className='mt-2 h-4 bg-gray-200 rounded w-1/4'></div>
    </div>
  );
};

export default MetricCardSkeleton;
