import React from 'react';

const skeletonRows = Array.from({ length: 5 });

const DealsByStageSkeleton: React.FC = () => (
  <div className='card'>
    <div className='h-6 w-48 bg-gray-200 rounded mb-4 animate-pulse' />
    <div className='overflow-x-auto'>
      <table className='min-w-full text-sm'>
        <thead>
          <tr className='text-gray-600 border-b'>
            <th className='py-2 px-2 text-left'>Stage</th>
            <th className='py-2 px-2 text-right'>Count</th>
            <th className='py-2 px-2 text-right'>Sum</th>
            <th className='py-2 px-2 text-right'>Count Trend</th>
            <th className='py-2 px-2 text-right'>Sum Trend</th>
          </tr>
        </thead>
        <tbody>
          {skeletonRows.map((_, idx) => (
            <tr
              key={idx}
              className='border-b last:border-0'>
              <td className='py-2 px-2'>
                <div className='h-4 w-24 bg-gray-200 rounded animate-pulse' />
              </td>
              <td className='py-2 px-2 text-right'>
                <div className='h-4 w-10 bg-gray-200 rounded animate-pulse ml-auto' />
              </td>
              <td className='py-2 px-2 text-right'>
                <div className='h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto' />
              </td>
              <td className='py-2 px-2 text-right'>
                <div className='h-4 w-12 bg-gray-200 rounded animate-pulse ml-auto' />
              </td>
              <td className='py-2 px-2 text-right'>
                <div className='h-4 w-12 bg-gray-200 rounded animate-pulse ml-auto' />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default DealsByStageSkeleton;
