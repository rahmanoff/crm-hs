import { hubSpotService } from '@/lib/hubspot';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HubSpotService', () => {
  beforeEach(() => {
    mockedAxios.post.mockClear();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.warn as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
  });

  describe('getDashboardMetrics', () => {
    it('should fetch and calculate dashboard metrics correctly', async () => {
      mockedAxios.post.mockImplementation((url: string, data: any) => {
        if (url.includes('/crm/v3/objects/contacts/search')) {
          return Promise.resolve({ data: { total: 150 } });
        }
        if (url.includes('/crm/v3/objects/companies/search')) {
          return Promise.resolve({ data: { total: 50 } });
        }
        if (url.includes('/crm/v3/objects/deals/search')) {
          const filterProp =
            data.filterGroups[0]?.filters[0]?.propertyName;
          if (data.properties?.includes('amount')) {
            return Promise.resolve({
              data: {
                results: [
                  { properties: { amount: '1000' } },
                  { properties: { amount: '1500' } },
                ],
              },
            });
          }
          if (filterProp === 'hs_is_closed_won') {
            return Promise.resolve({ data: { total: 25 } });
          }
          if (filterProp === 'hs_is_closed_lost') {
            return Promise.resolve({ data: { total: 10 } });
          }
          if (filterProp === 'dealstage') {
            return Promise.resolve({ data: { total: 5 } });
          }
          // Default for totalDeals
          return Promise.resolve({ data: { total: 40 } });
        }
        if (url.includes('/crm/v3/objects/tasks/search')) {
          const status = data.filterGroups[0]?.filters[0]?.value;
          if (status === 'COMPLETED') {
            return Promise.resolve({ data: { total: 80 } });
          }
          return Promise.resolve({ data: { total: 20 } }); // Overdue
        }
        return Promise.reject(
          new Error(`Unhandled mock for URL: ${url}`)
        );
      });

      const metrics = await hubSpotService.getDashboardMetrics();

      expect(metrics.totalContacts).toBe(150);
      expect(metrics.totalCompanies).toBe(50);
      expect(metrics.totalDeals).toBe(40);
      expect(metrics.wonDeals).toBe(25);
      expect(metrics.lostDeals).toBe(10);
      expect(metrics.activeDeals).toBe(5);
      expect(metrics.totalRevenue).toBe(2500);
      expect(metrics.averageDealSize).toBe(100);
      expect(metrics.conversionRate).toBeCloseTo(62.5);
      expect(metrics.tasksCompleted).toBe(80);
      expect(metrics.tasksOverdue).toBe(20);
    });
  });

  describe('getTrendData', () => {
    it('should fetch and format trend data correctly', async () => {
      mockedAxios.post.mockImplementation((url: string, data: any) => {
        if (url.includes('/crm/v3/objects/contacts/search')) {
          return Promise.resolve({ data: { total: 10 } });
        }
        if (url.includes('/crm/v3/objects/companies/search')) {
          return Promise.resolve({ data: { total: 5 } });
        }
        if (url.includes('/crm/v3/objects/deals/search')) {
          if (data.properties?.includes('amount')) {
            return Promise.resolve({
              data: { results: [{ properties: { amount: '200' } }] },
            });
          }
          return Promise.resolve({ data: { total: 2 } });
        }
        return Promise.reject(
          new Error(`Unhandled mock for URL: ${url}`)
        );
      });

      const trendData = await hubSpotService.getTrendData({
        from: '2023-01-01T00:00:00.000Z',
        to: '2023-01-02T00:00:00.000Z',
      });

      expect(trendData).toHaveLength(2);
      expect(trendData[0].date).toBe('2023-01-01');
      expect(trendData[0].contacts).toBe(10);
      expect(trendData[0].companies).toBe(5);
      expect(trendData[0].deals).toBe(2);
      expect(trendData[0].revenue).toBe(200);
    });
  });
});
