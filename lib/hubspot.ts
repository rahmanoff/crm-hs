import axios from 'axios';
import {
  getDateRange,
  getPreviousDateRange,
  buildBetweenFilter,
  buildEqualsFilter,
  buildAndFilter,
} from './dateUtils';

const HUBSPOT_API_BASE = 'https://api.hubapi.com';

export interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    company?: string;
    createdate?: string;
    lastmodifieddate?: string;
    lifecyclestage?: string;
    lead_status?: string;
  };
}

export interface HubSpotCompany {
  id: string;
  properties: {
    name?: string;
    domain?: string;
    industry?: string;
    createdate?: string;
    lastmodifieddate?: string;
    lifecyclestage?: string;
    annualrevenue?: string;
    numberofemployees?: string;
  };
}

export interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    amount?: string;
    dealstage?: string;
    closedate?: string;
    createdate?: string;
    lastmodifieddate?: string;
    pipeline?: string;
    hs_is_closed?: string;
    hs_is_closed_won?: string;
    hs_is_closed_lost?: string;
  };
}

export interface HubSpotTask {
  id: string;
  properties: {
    hs_timestamp?: string;
    hs_task_subject?: string;
    hs_task_body?: string;
    hs_task_status?: string;
    hs_task_priority?: string;
    hs_task_completion_date?: string;
    hs_task_type?: string;
  };
}

export interface DashboardMetrics {
  totalContacts: number;
  allTimeContacts: number;
  totalCompanies: number;
  allTimeCompanies: number;
  totalDeals: number;
  newDealsValue: number;
  totalTasks: number;
  activeDeals: number;
  activeDealsValue: number;
  wonDeals: number;
  lostDeals: number;
  totalRevenue: number;
  averageDealSize: number;
  averageWonDealSize: number;
  conversionRate: number;
  tasksCompleted: number;
  tasksOverdue: number;
}

export interface TrendData {
  date: string;
  contacts: number;
  companies: number;
  deals: number;
  revenue: number;
  lostRevenue: number;
}

class HubSpotService {
  private apiKey: string;
  private isPrivateApp: boolean;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.HUBSPOT_API_KEY || '';
    this.isPrivateApp = this.apiKey.startsWith('pat-');
    this.baseUrl = HUBSPOT_API_BASE;

    if (!this.apiKey) {
      throw new Error(
        'HubSpot API key not found. Please set HUBSPOT_API_KEY environment variable.'
      );
    }
  }

  private async makeRequest(
    endpoint: string,
    params: Record<string, any> = {},
    retries = 3,
    backoff = 2000
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        params,
        timeout: 10000,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429 && retries > 0) {
        console.warn(
          `Rate limit hit. Retrying in ${
            backoff / 1000
          }s... (${retries} retries left)`
        );
        await new Promise((resolve) => setTimeout(resolve, backoff));
        return this.makeRequest(
          endpoint,
          params,
          retries - 1,
          backoff * 2
        );
      }
      console.error(
        'API request failed:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  private async makePostRequest(
    endpoint: string,
    body: Record<string, any>,
    retries = 3,
    backoff = 2000
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await axios.post(url, body, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429 && retries > 0) {
        console.warn(
          `Rate limit hit on POST. Retrying in ${
            backoff / 1000
          }s... (${retries} retries left)`
        );
        await new Promise((resolve) => setTimeout(resolve, backoff));
        return this.makePostRequest(
          endpoint,
          body,
          retries - 1,
          backoff * 2
        );
      }
      console.error(
        'API POST request failed:',
        error.response?.data || error.message
      );
      throw error;
    }
  }

  public async searchObjects(
    objectType: string,
    filterGroups: any[],
    properties: string[] = [],
    sorts?: any[]
  ): Promise<{ total: number; results: any[] }> {
    const endpoint = `/crm/v3/objects/${objectType}/search`;
    let allResults: any[] = [];
    let hasMore = true;
    let after: string | undefined = undefined;
    let page = 1;

    // Always use a stable sort order for dashboard queries
    const defaultSorts = [
      { propertyName: 'createdate', direction: 'ASCENDING' },
    ];
    const useSorts = sorts || defaultSorts;

    while (hasMore) {
      const body: any = {
        filterGroups,
        properties,
        limit: 100,
        sorts: useSorts,
      };
      if (after) {
        body.after = after;
      }
      try {
        const response = await this.makePostRequest(endpoint, body);
        if (response.results && response.results.length > 0) {
          allResults = allResults.concat(response.results);
          const lastId =
            response.results[response.results.length - 1]?.id;
          console.log(
            `[searchObjects] Page ${page}: Fetched ${response.results.length} results. Last ID: ${lastId}`
          );
        } else {
          console.log(`[searchObjects] Page ${page}: No results.`);
        }
        if (response.paging && response.paging.next) {
          after = response.paging.next.after;
          hasMore = true;
        } else {
          hasMore = false;
        }
        page++;
      } catch (error) {
        console.error(`[searchObjects] Error on page ${page}:`, error);
        hasMore = false;
      }
    }
    // Defensive deduplication by ID
    const dedupedResults = Array.from(
      new Map(allResults.map((obj) => [obj.id, obj])).values()
    );
    console.log(
      `[searchObjects] Total results for ${objectType}: ${dedupedResults.length}`
    );
    return { total: dedupedResults.length, results: dedupedResults };
  }

  async getContacts(limit = 100): Promise<HubSpotContact[]> {
    const data = await this.makeRequest('/crm/v3/objects/contacts', {
      limit,
      properties:
        'firstname,lastname,email,phone,company,createdate,lastmodifieddate,lifecyclestage,lead_status',
    });
    return data.results || [];
  }

  async getCompanies(limit = 100): Promise<HubSpotCompany[]> {
    const data = await this.makeRequest('/crm/v3/objects/companies', {
      limit,
      properties:
        'name,domain,industry,createdate,lastmodifieddate,lifecyclestage,annualrevenue,numberofemployees',
    });
    return data.results || [];
  }

  async getDeals(): Promise<HubSpotDeal[]> {
    const data = await this.searchObjects(
      'deals',
      [],
      [
        'dealname',
        'amount',
        'dealstage',
        'closedate',
        'createdate',
        'lastmodifieddate',
        'pipeline',
        'hs_is_closed',
        'hs_is_closed_won',
        'hs_is_closed_lost',
      ]
    );
    return data.results || [];
  }

  async getTasks(limit = 100): Promise<HubSpotTask[]> {
    const data = await this.makeRequest('/crm/v3/objects/tasks', {
      limit,
      properties:
        'hs_timestamp,hs_task_subject,hs_task_body,hs_task_status,hs_task_priority,hs_task_completion_date,hs_task_type',
    });
    return data.results || [];
  }

  // Helper to get the true total count for an object type using the list endpoint
  private async getTotalCount(objectType: string): Promise<number> {
    const endpoint = `/crm/v3/objects/${objectType}`;
    try {
      const response = await this.makeRequest(endpoint, { limit: 1 });
      return response.total || 0;
    } catch (error) {
      console.error(`[getTotalCount] Error for ${objectType}:`, error);
      return 0;
    }
  }

  async getDashboardMetrics(
    days = 30,
    startTimestamp?: number,
    endTimestamp?: number
  ): Promise<DashboardMetrics> {
    try {
      let startTs: number, endTs: number;
      if (startTimestamp !== undefined && endTimestamp !== undefined) {
        startTs = startTimestamp;
        endTs = endTimestamp;
      } else {
        const range = getDateRange(days);
        startTs = range.start;
        endTs = range.end;
      }

      const stableSort = [
        { propertyName: 'createdate', direction: 'ASCENDING' },
      ];

      // Use searchObjects for all ranges, including All Time (empty filter for all time)
      const contactsFilter =
        days === 0
          ? []
          : buildBetweenFilter('createdate', startTs, endTs);
      const companiesFilter =
        days === 0
          ? []
          : buildBetweenFilter('createdate', startTs, endTs);
      const tasksFilter =
        days === 0
          ? []
          : buildBetweenFilter('hs_timestamp', startTs, endTs);
      const tasksCompletedFilter =
        days === 0
          ? buildEqualsFilter('hs_task_status', 'COMPLETED')
          : buildAndFilter([
              {
                propertyName: 'hs_task_status',
                operator: 'EQ',
                value: 'COMPLETED',
              },
              {
                propertyName: 'hs_task_completion_date',
                operator: 'BETWEEN',
                value: startTs,
                highValue: endTs,
              },
            ]);
      const wonDealsFilter =
        days === 0
          ? buildEqualsFilter('dealstage', 'closedwon')
          : buildAndFilter([
              {
                propertyName: 'dealstage',
                operator: 'EQ',
                value: 'closedwon',
              },
              {
                propertyName: 'closedate',
                operator: 'BETWEEN',
                value: startTs,
                highValue: endTs,
              },
            ]);
      const lostDealsFilter =
        days === 0
          ? buildEqualsFilter('dealstage', 'closedlost')
          : buildAndFilter([
              {
                propertyName: 'dealstage',
                operator: 'EQ',
                value: 'closedlost',
              },
              {
                propertyName: 'hs_lastmodifieddate',
                operator: 'BETWEEN',
                value: startTs,
                highValue: endTs,
              },
            ]);
      const activeDealsFilter = [
        {
          filters: [
            {
              propertyName: 'dealstage',
              operator: 'NEQ',
              value: 'closedwon',
            },
            {
              propertyName: 'dealstage',
              operator: 'NEQ',
              value: 'closedlost',
            },
          ],
        },
      ];
      const allDealsFilter =
        days === 0
          ? []
          : buildBetweenFilter('createdate', startTs, endTs);

      const [
        contactsData,
        companiesData,
        tasksData,
        tasksCompletedData,
        wonDealsData,
        lostDealsData,
        activeDealsData,
        allDealsInRangeData,
      ] = await Promise.all([
        this.searchObjects(
          'contacts',
          contactsFilter,
          ['createdate'],
          stableSort
        ),
        this.searchObjects(
          'companies',
          companiesFilter,
          ['createdate'],
          stableSort
        ),
        this.searchObjects(
          'tasks',
          tasksFilter,
          ['hs_task_status', 'hs_task_completion_date'],
          stableSort
        ),
        this.searchObjects(
          'tasks',
          tasksCompletedFilter,
          ['hs_task_status', 'hs_task_completion_date'],
          stableSort
        ),
        this.searchObjects(
          'deals',
          wonDealsFilter,
          ['amount'],
          stableSort
        ),
        this.searchObjects('deals', lostDealsFilter, [], stableSort),
        this.searchObjects('deals', activeDealsFilter, [], stableSort),
        this.searchObjects(
          'deals',
          allDealsFilter,
          ['amount'],
          stableSort
        ),
      ]);

      const totalContacts = contactsData.total;
      const totalCompanies = companiesData.total;
      const totalTasks = tasksData.total;
      const tasksCompleted = tasksCompletedData.total;
      const wonDeals = wonDealsData.total;
      const lostDeals = lostDealsData.total;
      const activeDeals = activeDealsData.total;
      const newDeals = allDealsInRangeData.total;
      const totalRevenue = wonDealsData.results.reduce(
        (sum, deal) => sum + parseFloat(deal.properties.amount || '0'),
        0
      );
      const averageDealSize =
        newDeals > 0
          ? allDealsInRangeData.results.reduce(
              (sum, deal) =>
                sum + parseFloat(deal.properties.amount || '0'),
              0
            ) / newDeals
          : 0;
      const averageWonDealSize =
        wonDeals > 0 ? totalRevenue / wonDeals : 0;
      const conversionRate =
        wonDeals + lostDeals > 0
          ? (wonDeals / (wonDeals + lostDeals)) * 100
          : 0;
      const activeDealsValue = activeDealsData.results.reduce(
        (sum, deal) => sum + parseFloat(deal.properties.amount || '0'),
        0
      );
      const newDealsValue = allDealsInRangeData.results.reduce(
        (sum, deal) => sum + parseFloat(deal.properties.amount || '0'),
        0
      );
      // For sublabels, always fetch all-time counts for contacts/companies
      const [allTimeContactsData, allTimeCompaniesData] =
        await Promise.all([
          this.searchObjects(
            'contacts',
            [],
            ['createdate'],
            stableSort
          ),
          this.searchObjects(
            'companies',
            [],
            ['createdate'],
            stableSort
          ),
        ]);
      const allTimeContacts = allTimeContactsData.total;
      const allTimeCompanies = allTimeCompaniesData.total;

      return {
        totalContacts,
        allTimeContacts,
        totalCompanies,
        allTimeCompanies,
        totalDeals: newDeals,
        newDealsValue,
        totalTasks,
        activeDeals,
        activeDealsValue,
        wonDeals,
        lostDeals,
        totalRevenue,
        averageDealSize,
        averageWonDealSize,
        conversionRate,
        tasksCompleted,
        tasksOverdue: 0,
      };
    } catch (error) {
      console.error('Error in getDashboardMetrics:', error);
      return {
        totalContacts: 0,
        allTimeContacts: 0,
        totalCompanies: 0,
        allTimeCompanies: 0,
        totalDeals: 0,
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
      };
    }
  }

  async getTrendData(days = 30): Promise<TrendData[]> {
    try {
      const range = getDateRange(days);
      const startTimestamp = range.start;
      const endTimestamp = range.end;
      const dateRangeFilter = buildBetweenFilter(
        'createdate',
        startTimestamp,
        endTimestamp
      );
      const dealClosedDateFilter = buildBetweenFilter(
        'closedate',
        startTimestamp,
        endTimestamp
      );
      const stableSort = [
        { propertyName: 'createdate', direction: 'ASCENDING' },
      ];
      const [contactsData, companiesData, dealsData] =
        await Promise.all([
          this.searchObjects(
            'contacts',
            dateRangeFilter,
            ['createdate'],
            stableSort
          ),
          this.searchObjects(
            'companies',
            dateRangeFilter,
            ['createdate'],
            stableSort
          ),
          this.searchObjects(
            'deals',
            dealClosedDateFilter,
            [
              'createdate',
              'amount',
              'closedate',
              'hs_is_closed_won',
              'hs_is_closed_lost',
              'dealstage',
            ],
            stableSort
          ),
        ]);

      const trendMap = new Map<string, TrendData>();
      const startDateObj = new Date(startTimestamp);
      for (let i = 0; i <= days; i++) {
        const date = new Date(startDateObj);
        date.setDate(startDateObj.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        trendMap.set(dateStr, {
          date: dateStr,
          contacts: 0,
          companies: 0,
          deals: 0,
          revenue: 0,
          lostRevenue: 0,
        });
      }

      contactsData.results.forEach((c) => {
        const dateStr = c.properties.createdate?.split('T')[0];
        if (dateStr && trendMap.has(dateStr))
          trendMap.get(dateStr)!.contacts++;
      });
      companiesData.results.forEach((c) => {
        const dateStr = c.properties.createdate?.split('T')[0];
        if (dateStr && trendMap.has(dateStr))
          trendMap.get(dateStr)!.companies++;
      });
      dealsData.results.forEach((d) => {
        // Won revenue (closedate)
        const isWon = d.properties.hs_is_closed_won === 'true';
        const closedateStr = d.properties.closedate?.split('T')[0];
        if (isWon && closedateStr && trendMap.has(closedateStr)) {
          const day = trendMap.get(closedateStr)!;
          day.revenue += parseFloat(d.properties.amount || '0');
        }
        // Lost revenue (closedate)
        const isLost = d.properties.hs_is_closed_lost === 'true';
        if (isLost && closedateStr && trendMap.has(closedateStr)) {
          const day = trendMap.get(closedateStr)!;
          day.lostRevenue += parseFloat(d.properties.amount || '0');
        }
        // Still count deals by createdate for the deals trend
        const createdateStr = d.properties.createdate?.split('T')[0];
        if (createdateStr && trendMap.has(createdateStr)) {
          trendMap.get(createdateStr)!.deals++;
        }
      });
      return Array.from(trendMap.values());
    } catch (error) {
      console.error('Error in getTrendData:', error);
      return [];
    }
  }

  async getRecentActivity(limit = 10) {
    try {
      const [contacts, companies, deals, tasks] = await Promise.all([
        this.getContacts(limit),
        this.getCompanies(limit),
        this.getDeals(),
        this.getTasks(limit),
      ]);
      const allActivities = [
        ...contacts.map((c) => ({
          type: 'contact',
          id: c.id,
          title:
            `${c.properties.firstname || ''} ${
              c.properties.lastname || ''
            }`.trim() || 'New Contact',
          date:
            c.properties.lastmodifieddate || c.properties.createdate,
          description: c.properties.email || 'Contact created/updated',
        })),
        ...companies.map((c) => ({
          type: 'company',
          id: c.id,
          title: c.properties.name || 'New Company',
          date:
            c.properties.lastmodifieddate || c.properties.createdate,
          description:
            c.properties.industry || 'Company created/updated',
        })),
        ...deals.map((d) => ({
          type: 'deal',
          id: d.id,
          title: d.properties.dealname || 'New Deal',
          date:
            d.properties.lastmodifieddate || d.properties.createdate,
          description: `$${parseFloat(
            d.properties.amount || '0'
          ).toLocaleString()} - ${
            d.properties.dealstage || 'Deal created/updated'
          }`,
        })),
        ...tasks.map((t) => ({
          type: 'task',
          id: t.id,
          title: t.properties.hs_task_subject || 'New Task',
          date:
            t.properties.hs_timestamp ||
            t.properties.hs_task_completion_date,
          description:
            t.properties.hs_task_status || 'Task created/updated',
        })),
      ];
      return allActivities
        .sort(
          (a, b) =>
            new Date(b.date || '').getTime() -
            new Date(a.date || '').getTime()
        )
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      return [];
    }
  }

  /**
   * Returns today's activity summary: closed tasks, new contacts, new companies, new deals (name and sum)
   */
  async getTodayActivitySummary() {
    const now = new Date();
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    ).getTime();
    const end = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    ).getTime();

    // Contacts created today
    const contactsData = await this.searchObjects(
      'contacts',
      buildBetweenFilter('createdate', start, end),
      ['createdate']
    );

    // Companies created today
    const companiesData = await this.searchObjects(
      'companies',
      buildBetweenFilter('createdate', start, end),
      ['createdate']
    );

    // Tasks closed today
    const closedTasksData = await this.searchObjects(
      'tasks',
      buildAndFilter([
        {
          propertyName: 'hs_task_status',
          operator: 'EQ',
          value: 'COMPLETED',
        },
        {
          propertyName: 'hs_task_completion_date',
          operator: 'BETWEEN',
          value: start,
          highValue: end,
        },
      ]),
      ['hs_task_status', 'hs_task_completion_date']
    );

    // Deals created today
    const dealsData = await this.searchObjects(
      'deals',
      buildBetweenFilter('createdate', start, end),
      ['dealname', 'amount', 'createdate']
    );
    const newDeals = dealsData.results.map((deal: any) => ({
      name: deal.properties.dealname || 'New Deal',
      amount: deal.properties.amount
        ? parseFloat(deal.properties.amount)
        : 0,
    }));

    return {
      closedTasks: closedTasksData.total,
      newContacts: contactsData.total,
      newCompanies: companiesData.total,
      newDeals,
    };
  }
}

export const hubSpotService = new HubSpotService();
