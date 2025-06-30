import React from 'react';

const ActivityFeedSkeleton = () => {
  return (
    <div className='card animate-pulse'>
      <div className='h-6 bg-gray-200 rounded w-1/2 mb-6'></div>
      <div className='space-y-4'>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className='flex items-start space-x-3'>
            <div className='h-8 w-8 bg-gray-200 rounded-full'></div>
            <div className='flex-1 space-y-2 py-1'>
              <div className='h-4 bg-gray-200 rounded w-3/4'></div>
              <div className='h-4 bg-gray-200 rounded w-5/6'></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeedSkeleton;
