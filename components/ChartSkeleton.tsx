import React from 'react';

const ChartSkeleton = () => {
  return (
    <div className='card animate-pulse'>
      <div className='h-8 bg-gray-200 rounded w-3/4 mb-4'></div>
      <div className='h-64 bg-gray-200 rounded'></div>
    </div>
  );
};

export default ChartSkeleton;
