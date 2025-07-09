import { getDealMetrics, DealMetrics } from '@/lib/metrics/deals';
import { HubSpotDeal } from '@/lib/hubspot';

describe('getDealMetrics', () => {
  const now = Date.UTC(2023, 0, 31); // Jan 31, 2023
  const msInDay = 24 * 60 * 60 * 1000;

  const makeDeal = (
    props: Partial<HubSpotDeal['properties']>
  ): HubSpotDeal => ({
    id: Math.random().toString(36).slice(2),
    properties: {
      createdate: undefined,
      closedate: undefined,
      dealstage: undefined,
      amount: undefined,
      lastmodifieddate: undefined,
      pipeline: undefined,
      hs_is_closed: undefined,
      hs_is_closed_won: undefined,
      hs_is_closed_lost: undefined,
      ...props,
    },
  });

  it('calculates all-time metrics', () => {
    const deals: HubSpotDeal[] = [
      makeDeal({
        createdate: new Date(now - 10 * msInDay).toISOString(),
        dealstage: 'appointmentscheduled',
        amount: '100',
      }),
      makeDeal({
        createdate: new Date(now - 5 * msInDay).toISOString(),
        dealstage: 'closedwon',
        closedate: new Date(now - 2 * msInDay).toISOString(),
        amount: '200',
      }),
      makeDeal({
        createdate: new Date(now - 40 * msInDay).toISOString(),
        dealstage: 'closedlost',
        closedate: new Date(now - 1 * msInDay).toISOString(),
        amount: '300',
      }),
    ];
    const metrics = getDealMetrics(deals, 0, now);
    expect(metrics.totalDeals).toBe(3);
    expect(metrics.openDeals).toBe(1);
    expect(metrics.wonDeals).toBe(1);
    expect(metrics.lostDeals).toBe(1);
    expect(metrics.revenue).toBe(200);
    expect(metrics.lostRevenue).toBe(300);
    expect(metrics.newDeals).toBe(3);
    expect(metrics.averageDealSize).toBeCloseTo((100 + 200 + 300) / 3);
    expect(metrics.averageWonDealSize).toBe(200);
  });

  it('calculates period-based metrics', () => {
    const deals: HubSpotDeal[] = [
      makeDeal({
        createdate: new Date(now - 10 * msInDay).toISOString(),
        dealstage: 'appointmentscheduled',
        amount: '100',
      }), // in period
      makeDeal({
        createdate: new Date(now - 35 * msInDay).toISOString(),
        dealstage: 'appointmentscheduled',
        amount: '50',
      }), // prev period
      makeDeal({
        createdate: new Date(now - 5 * msInDay).toISOString(),
        dealstage: 'closedwon',
        closedate: new Date(now - 2 * msInDay).toISOString(),
        amount: '200',
      }), // in period
      makeDeal({
        createdate: new Date(now - 40 * msInDay).toISOString(),
        dealstage: 'closedlost',
        closedate: new Date(now - 1 * msInDay).toISOString(),
        amount: '300',
      }), // prev period
    ];
    const metrics = getDealMetrics(deals, 30, now);
    expect(metrics.totalDeals).toBe(4);
    expect(metrics.newDeals).toBe(2);
    expect(metrics.wonDeals).toBe(1);
    expect(metrics.lostDeals).toBe(1); // closedlost in period
    expect(metrics.createdPrevPeriod).toBe(2);
  });

  it('handles empty deal list', () => {
    const metrics = getDealMetrics([], 30, now);
    expect(metrics.totalDeals).toBe(0);
    expect(metrics.openDeals).toBe(0);
    expect(metrics.wonDeals).toBe(0);
    expect(metrics.lostDeals).toBe(0);
    expect(metrics.revenue).toBe(0);
    expect(metrics.lostRevenue).toBe(0);
    expect(metrics.newDeals).toBe(0);
    expect(metrics.averageDealSize).toBe(0);
    expect(metrics.averageWonDealSize).toBe(0);
    expect(metrics.createdPrevPeriod).toBe(0);
  });

  it('counts open deals correctly', () => {
    const deals: HubSpotDeal[] = [
      makeDeal({ dealstage: 'appointmentscheduled' }),
      makeDeal({ dealstage: 'closedwon' }),
      makeDeal({ dealstage: 'closedlost' }),
    ];
    const metrics = getDealMetrics(deals, 0, now);
    expect(metrics.openDeals).toBe(1);
  });
});
