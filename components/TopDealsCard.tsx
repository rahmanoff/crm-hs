import React from 'react';
import { DollarSign } from 'lucide-react';

interface TopDeal {
  company?: string | null;
  contacts: string[];
  name: string;
  amount: number;
}

interface TopDealsCardProps {
  title: string;
  deals: TopDeal[];
}

const TopDealsCard: React.FC<TopDealsCardProps> = ({
  title,
  deals,
}) => (
  <div className='card h-full flex flex-col'>
    <div className='flex items-center justify-between mb-4'>
      <h4 className='text-lg font-semibold text-gray-800'>{title}</h4>
      <div className='p-2 rounded-lg text-primary-600 bg-primary-50'>
        <DollarSign className='w-5 h-5' />
      </div>
    </div>
    {deals.length === 0 ? (
      <p className='text-gray-500 text-sm'>No deals found</p>
    ) : (
      <ul className='divide-y divide-gray-200 flex-1 overflow-y-auto'>
        {deals.map((deal, idx) => (
          <li
            key={idx}
            className='py-1 flex items-center justify-between'>
            <span className='text-base text-gray-900'>
              {deal.company ? (
                <span className='font-semibold text-black text-base'>
                  {deal.company}
                </span>
              ) : deal.contacts.length > 0 ? (
                <span className='text-black text-base'>
                  {deal.contacts.join(', ')}
                </span>
              ) : null}
              {(deal.company || deal.contacts.length > 0) &&
                deal.name &&
                ', '}
              <span className='text-base text-gray-900'>
                {deal.name}
              </span>
            </span>
            <span className='text-base text-gray-700 font-mono font-bold text-right min-w-[80px]'>
              $
              {deal.amount.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default TopDealsCard;
