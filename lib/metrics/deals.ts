import { HubSpotDeal } from '../hubspot';

export interface DealMetrics {
  totalDeals: number;
  newDeals: number;
  wonDeals: number;
  lostDeals: number;
  openDeals: number;
  revenue: number;
  lostRevenue: number;
  averageDealSize: number;
  averageWonDealSize: number;
  createdPrevPeriod: number;
  newDealsValue: number;
  averageNewDealSize: number;
  activeDealsValue: number;
}

/**
 * Calculates deal metrics for all-time and a given period.
 * @param deals - Array of all HubSpot deals
 * @param days - Number of days for the period (0 = all time)
 * @param now - Current timestamp (ms)
 */
export function getDealMetrics(
  deals: HubSpotDeal[],
  days: number,
  now: number = Date.now()
): DealMetrics {
  const PERIOD = days * 24 * 60 * 60 * 1000;
  const start = now - PERIOD;
  const prevStart = start - PERIOD;
  const prevEnd = start;

  let totalDeals = deals.length;
  let newDeals = 0;
  let wonDeals = 0;
  let lostDeals = 0;
  let openDeals = 0;
  let revenue = 0;
  let lostRevenue = 0;
  let wonDealSizes: number[] = [];
  let allDealSizes: number[] = [];
  let createdPrevPeriod = 0;
  let newDealsValue = 0;
  let activeDealsValue = 0;

  for (const deal of deals) {
    const created = deal.properties.createdate
      ? new Date(deal.properties.createdate).getTime()
      : null;
    const closed = deal.properties.closedate
      ? new Date(deal.properties.closedate).getTime()
      : null;
    const stage = deal.properties.dealstage;
    const amount = deal.properties.amount
      ? parseFloat(deal.properties.amount)
      : 0;

    if (amount) allDealSizes.push(amount);

    // Period-based metrics
    if (days === 0) {
      if (created) newDeals++;
      if (amount && created) newDealsValue += amount;
      if (stage === 'closedwon') {
        wonDeals++;
        if (amount) {
          revenue += amount;
          wonDealSizes.push(amount);
        }
      }
      if (stage === 'closedlost') {
        lostDeals++;
        if (amount) lostRevenue += amount;
      }
    } else {
      if (created && created >= start && created <= now) {
        newDeals++;
        if (amount) newDealsValue += amount;
      }
      if (
        stage === 'closedwon' &&
        closed &&
        closed >= start &&
        closed <= now
      ) {
        wonDeals++;
        if (amount) {
          revenue += amount;
          wonDealSizes.push(amount);
        }
      }
      if (
        stage === 'closedlost' &&
        closed &&
        closed >= start &&
        closed <= now
      ) {
        lostDeals++;
        if (amount) lostRevenue += amount;
      }
      if (created && created >= prevStart && created < prevEnd)
        createdPrevPeriod++;
    }
    // All-time open
    if (stage !== 'closedwon' && stage !== 'closedlost') {
      openDeals++;
      if (amount) {
        activeDealsValue += amount;
      }
    }
  }

  const averageDealSize = allDealSizes.length
    ? allDealSizes.reduce((a, b) => a + b, 0) / allDealSizes.length
    : 0;
  const averageWonDealSize = wonDealSizes.length
    ? wonDealSizes.reduce((a, b) => a + b, 0) / wonDealSizes.length
    : 0;
  const averageNewDealSize =
    newDeals > 0 ? newDealsValue / newDeals : 0;

  return {
    totalDeals,
    newDeals,
    wonDeals,
    lostDeals,
    openDeals,
    revenue,
    lostRevenue,
    averageDealSize,
    averageWonDealSize,
    createdPrevPeriod,
    newDealsValue,
    averageNewDealSize,
    activeDealsValue,
  };
}
