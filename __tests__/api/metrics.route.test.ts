// Polyfill for global.Request in Node.js for Next.js API route tests
if (typeof global.Request === 'undefined') {
  global.Request = function (this: any, input: any, init?: any) {
    this.url = input;
    this.method = (init && init.method) || 'GET';
  } as any;
}

import { GET } from '../../app/api/metrics/route';
import { hubSpotService } from '../../lib/hubspot';

jest.mock('../../lib/hubspot');

describe('/api/metrics API route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns metrics for a valid request', async () => {
    (hubSpotService.getDashboardMetrics as jest.Mock)
      .mockResolvedValueOnce({
        totalContacts: 1,
        totalCompanies: 2,
        totalDeals: 3,
        allTimeContacts: 10,
        allTimeCompanies: 20,
        newDealsValue: 1000,
        totalTasks: 5,
        activeDeals: 2,
        activeDealsValue: 500,
        wonDeals: 1,
        lostDeals: 1,
        totalRevenue: 100,
        averageDealSize: 1000,
        averageWonDealSize: 1000,
        conversionRate: 50,
        tasksCompleted: 3,
        tasksOverdue: 0,
      })
      .mockResolvedValueOnce({
        totalContacts: 0,
        totalCompanies: 0,
        totalDeals: 0,
        allTimeContacts: 0,
        allTimeCompanies: 0,
        newDealsValue: 0,
        totalTasks: 0,
        activeDeals: 0,
        activeDealsValue: 0,
        wonDeals: 0,
        lostDeals: 0,
        totalRevenue: 0,
        averageDealSize: 0,
        averageWonDealSize: 0,
        conversionRate: 0,
        tasksCompleted: 0,
        tasksOverdue: 0,
      });

    const req = { url: 'http://localhost/api/metrics?days=30' } as any;
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.current.totalContacts).toBe(1);
    expect(json.previous.totalContacts).toBe(0);
    expect(json.current.totalCompanies).toBe(2);
    expect(json.previous.totalCompanies).toBe(0);
    // ...other assertions as needed
  });

  it('handles errors gracefully', async () => {
    (hubSpotService.getDashboardMetrics as jest.Mock).mockRejectedValue(
      new Error('API error')
    );

    const req = { url: 'http://localhost/api/metrics?days=30' } as any;
    const res = await GET(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toMatch(/internal error/i);
  });
});

describe('GET /api/activity/today', () => {
  it('should return new deals with company, contacts, name, and amount', async () => {
    const res = await fetch('http://localhost:3000/api/activity/today');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.newDeals)).toBe(true);
    if (data.newDeals.length > 0) {
      const deal = data.newDeals[0];
      expect(deal).toHaveProperty('company');
      expect(deal).toHaveProperty('contacts');
      expect(Array.isArray(deal.contacts)).toBe(true);
      expect(deal).toHaveProperty('name');
      expect(deal).toHaveProperty('amount');
    }
  });
});
