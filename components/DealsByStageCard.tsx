import React from 'react';
import DealsByStageSkeleton from './DealsByStageSkeleton';

export interface StageMetric {
  stage: string;
  count: number;
  sum: number;
  trend: {
    current: { count: number; sum: number };
    previous: { count: number; sum: number };
  };
}

interface DealsByStageCardProps {
  stages: StageMetric[];
  loading?: boolean;
  error?: string | null;
}

function getTrendArrow(current: number, previous: number) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0 && current > 0)
    return <span className='text-green-600'>▲</span>;
  const diff = current - previous;
  if (diff === 0) return <span className='text-gray-400'>→</span>;
  if (diff > 0) return <span className='text-green-600'>▲</span>;
  return <span className='text-red-600'>▼</span>;
}

const STAGE_LABELS: Record<string, string> = {
  appointmentscheduled: 'New',
  qualifiedtobuy: 'Negotiation',
  presentationscheduled: 'Proporsal',
  decisionmakerboughtin: 'Shipped',
  contractsent: 'Payed',
};

const STAGE_ORDER = [
  'appointmentscheduled', // New
  'qualifiedtobuy', // Negotiation
  'presentationscheduled', // Proporsal
  'decisionmakerboughtin', // Shipped
  'contractsent', // Payed
];

const DealsByStageCard: React.FC<DealsByStageCardProps> = ({
  stages,
  loading,
  error,
}) => {
  if (loading) {
    return <DealsByStageSkeleton />;
  }
  if (error) {
    return (
      <div className='card p-6 text-center text-red-600'>{error}</div>
    );
  }
  if (!stages || stages.length === 0) {
    return (
      <div className='card p-6 text-center text-gray-500'>
        No open deals found.
      </div>
    );
  }

  // Sort stages according to STAGE_ORDER
  const sortedStages = [...stages].sort((a, b) => {
    const aIdx = STAGE_ORDER.indexOf(a.stage);
    const bIdx = STAGE_ORDER.indexOf(b.stage);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
  });

  return (
    <div className='card'>
      <h4 className='text-lg font-semibold text-gray-800 mb-4'>
        Open Deals by Stage
      </h4>
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
            {sortedStages.map((stage) => (
              <tr
                key={stage.stage}
                className='border-b last:border-0'>
                <td className='py-2 px-2 font-medium text-base text-gray-900'>
                  {STAGE_LABELS[stage.stage] || stage.stage}
                </td>
                <td className='text-xl py-2 px-2 text-right'>
                  {stage.count.toLocaleString()}
                </td>
                <td className='text-2xl py-2 px-2 text-right'>
                  ${stage.sum.toLocaleString()}
                </td>
                <td className='text-xl py-2 px-2 text-right'>
                  {getTrendArrow(
                    stage.trend.current.count,
                    stage.trend.previous.count
                  )}{' '}
                  <span
                    className={
                      stage.trend.current.count >
                      stage.trend.previous.count
                        ? 'text-green-600'
                        : stage.trend.current.count <
                          stage.trend.previous.count
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }>
                    {stage.trend.previous.count === 0
                      ? stage.trend.current.count
                      : (stage.trend.current.count -
                          stage.trend.previous.count >
                        0
                          ? '+'
                          : '') +
                        (stage.trend.current.count -
                          stage.trend.previous.count)}
                  </span>
                </td>
                <td className='text-xl py-2 px-2 text-right'>
                  {getTrendArrow(
                    stage.trend.current.sum,
                    stage.trend.previous.sum
                  )}{' '}
                  <span
                    className={
                      stage.trend.current.sum > stage.trend.previous.sum
                        ? 'text-green-600'
                        : stage.trend.current.sum <
                          stage.trend.previous.sum
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }>
                    {stage.trend.previous.sum === 0
                      ? `$${stage.trend.current.sum.toLocaleString()}`
                      : (stage.trend.current.sum -
                          stage.trend.previous.sum >
                        0
                          ? '+'
                          : '') +
                        `$${(
                          stage.trend.current.sum -
                          stage.trend.previous.sum
                        ).toLocaleString()}`}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DealsByStageCard;
