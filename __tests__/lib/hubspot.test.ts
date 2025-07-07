import { hubSpotService } from '@/lib/hubspot';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock p-limit to just run all promises immediately for test simplicity
jest.mock('p-limit', () => () => (fn: any) => fn());

describe('HubSpotService', () => {
  beforeEach(() => {
    mockedAxios.post.mockClear();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.warn as jest.Mock).mockRestore();
    (console.error as jest.Mock).mockRestore();
    jest.clearAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('returns correct metrics for normal data', async () => {
      (axios.post as jest.Mock)
        .mockResolvedValueOnce({
          data: {
            results: [
              { id: '1', properties: { createdate: '2023-01-01' } },
            ],
            paging: undefined,
          },
        }) // contacts
        .mockResolvedValueOnce({
          data: {
            results: [
              { id: '2', properties: { createdate: '2023-01-01' } },
            ],
            paging: undefined,
          },
        }) // companies
        .mockResolvedValue({
          data: { results: [], paging: undefined },
        }); // all others

      const metrics = await hubSpotService.getDashboardMetrics();

      expect(metrics.totalContacts).toBe(1);
      expect(metrics.totalCompanies).toBe(1);
      // ...assert all other fields as needed
    });

    it('handles empty results gracefully', async () => {
      (axios.post as jest.Mock).mockResolvedValue({
        data: { results: [], paging: undefined },
      });

      const metrics = await hubSpotService.getDashboardMetrics();

      expect(metrics.totalContacts).toBe(0);
      expect(metrics.totalCompanies).toBe(0);
      // ...assert all other fields as needed
    });

    it('handles API errors gracefully', async () => {
      (axios.post as jest.Mock).mockRejectedValue(
        new Error('API error')
      );

      const metrics = await hubSpotService.getDashboardMetrics();

      expect(metrics.totalContacts).toBe(0);
      expect(metrics.totalCompanies).toBe(0);
      // ...assert all other fields as needed
    });
  });

  describe('getTrendData', () => {
    it('returns correct trend data for mocked API', async () => {
      // Mock contacts, companies, deals responses
      (axios.post as jest.Mock)
        .mockResolvedValueOnce({
          data: {
            results: [
              { id: '1', properties: { createdate: '2023-01-01' } },
              { id: '2', properties: { createdate: '2023-01-02' } },
            ],
            paging: undefined,
          },
        }) // contacts
        .mockResolvedValueOnce({
          data: {
            results: [
              { id: '3', properties: { createdate: '2023-01-01' } },
            ],
            paging: undefined,
          },
        }) // companies
        .mockResolvedValueOnce({
          data: {
            results: [
              {
                id: '4',
                properties: {
                  createdate: '2023-01-01',
                  amount: '100',
                  closedate: '2023-01-01',
                  hs_is_closed_won: 'true',
                  hs_is_closed_lost: 'false',
                  dealstage: 'closedwon',
                },
              },
              {
                id: '5',
                properties: {
                  createdate: '2023-01-02',
                  amount: '200',
                  closedate: '2023-01-02',
                  hs_is_closed_won: 'false',
                  hs_is_closed_lost: 'true',
                  dealstage: 'closedlost',
                },
              },
            ],
            paging: undefined,
          },
        }); // deals

      const trendData = await hubSpotService.getTrendData(1); // 2 days

      expect(trendData.length).toBeGreaterThanOrEqual(2);
      expect(trendData[0]).toHaveProperty('date');
      expect(trendData[0]).toHaveProperty('contacts');
      expect(trendData[0]).toHaveProperty('companies');
      expect(trendData[0]).toHaveProperty('deals');
      expect(trendData[0]).toHaveProperty('revenue');
      expect(trendData[0]).toHaveProperty('lostRevenue');
      // Optionally, check specific values if needed
    });
  });

  describe('searchObjects batching/concurrency', () => {
    it('fetches and deduplicates results from multiple pages', async () => {
      // Simulate two pages of results
      const page1 = {
        results: [
          { id: '1', properties: { name: 'A' } },
          { id: '2', properties: { name: 'B' } },
        ],
        paging: { next: { after: 'page2' } },
      };
      const page2 = {
        results: [
          { id: '2', properties: { name: 'B' } }, // duplicate
          { id: '3', properties: { name: 'C' } },
        ],
        paging: undefined,
      };
      const makePostRequest = jest.spyOn(
        hubSpotService as any,
        'makePostRequest'
      );
      makePostRequest
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2);

      const { results, total } = await hubSpotService.searchObjects(
        'contacts',
        [],
        ['name']
      );
      expect(total).toBe(3);
      expect(results.map((r: any) => r.id).sort()).toEqual([
        '1',
        '2',
        '3',
      ]);
      makePostRequest.mockRestore();
    });
  });
});
