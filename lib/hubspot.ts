import axios from 'axios';

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
  totalCompanies: number;
  totalDeals: number;
  totalTasks: number;
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalRevenue: number;
  averageDealSize: number;
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
        'API GET request failed:',
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
          `POST Rate limit hit. Retrying in ${
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

  private async searchObjects(
    objectType: string,
    filterGroups: any[],
    properties: string[] = []
  ): Promise<{ total: number; results: any[] }> {
    const endpoint = `/crm/v3/objects/${objectType}/search`;
    const body = {
      filterGroups,
      properties,
      limit: 1,
    };
    const response = await this.makePostRequest(endpoint, body);
    return { total: response.total, results: response.results || [] };
  }

  async getContacts(limit = 100): Promise<HubSpotContact[]> {
    console.log('Fetching contacts with limit:', limit);
    let allContacts: HubSpotContact[] = [];
    let after: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const params: any = {
        limit: Math.min(limit, 100),
        properties:
          'firstname,lastname,email,phone,company,createdate,lastmodifieddate,lifecyclestage,lead_status',
      };
      if (after) {
        params.after = after;
      }
      const data = await this.makeRequest(
        '/crm/v3/objects/contacts',
        params
      );
      if (data.results && data.results.length > 0) {
        allContacts = allContacts.concat(data.results);
      }
      hasMore = data.paging?.next?.after;
      after = data.paging?.next?.after;
      if (limit > 0 && allContacts.length >= limit) break;
    }
    return allContacts;
  }

  async getCompanies(limit = 100): Promise<HubSpotCompany[]> {
    console.log('Fetching companies with limit:', limit);
    let allCompanies: HubSpotCompany[] = [];
    let after: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const params: any = {
        limit: Math.min(limit, 100),
        properties:
          'name,domain,industry,createdate,lastmodifieddate,lifecyclestage,annualrevenue,numberofemployees',
      };
      if (after) {
        params.after = after;
      }
      const data = await this.makeRequest(
        '/crm/v3/objects/companies',
        params
      );
      if (data.results && data.results.length > 0) {
        allCompanies = allCompanies.concat(data.results);
      }
      hasMore = data.paging?.next?.after;
      after = data.paging?.next?.after;
      if (limit > 0 && allCompanies.length >= limit) break;
    }
    return allCompanies;
  }

  async getDeals(limit = 0): Promise<HubSpotDeal[]> {
    console.log('Fetching deals...');
    let allDeals: HubSpotDeal[] = [];
    let after: string | undefined;
    let hasMore = true;

    while (hasMore) {
      const params: any = {
        limit: 100,
        properties:
          'dealname,amount,dealstage,closedate,createdate,lastmodifieddate,pipeline,hs_is_closed_won',
      };
      if (after) {
        params.after = after;
      }
      const data = await this.makeRequest(
        '/crm/v3/objects/deals',
        params
      );
      if (data.results && data.results.length > 0) {
        allDeals = allDeals.concat(data.results);
      }
      hasMore = data.paging?.next?.after;
      after = data.paging?.next?.after;
      if (limit > 0 && allDeals.length >= limit) break;
    }
    return allDeals;
  }

  async getTasks(limit = 100): Promise<HubSpotTask[]> {
    let allTasks: HubSpotTask[] = [];
    let after: string | undefined;
    let hasMore = true;
    while (hasMore) {
      const params: any = {
        limit: Math.min(limit, 100),
        properties:
          'hs_timestamp,hs_task_subject,hs_task_body,hs_task_status,hs_task_priority,hs_task_completion_date,hs_task_type',
      };
      if (after) {
        params.after = after;
      }
      const data = await this.makeRequest(
        '/crm/v3/objects/tasks',
        params
      );
      if (data.results && data.results.length > 0) {
        allTasks = allTasks.concat(data.results);
      }
      hasMore = data.paging?.next?.after;
      after = data.paging?.next?.after;
      if (limit > 0 && allTasks.length >= limit) break;
    }
    return allTasks;
  }

  async getDashboardMetrics({
    from,
    to,
  }: {
    from?: string;
    to?: string;
  } = {}): Promise<DashboardMetrics> {
    const dateFilter = (propertyName: string) => {
      const filters = [];
      if (from) {
        filters.push({
          propertyName,
          operator: 'GTE',
          value: new Date(from).getTime(),
        });
      }
      if (to) {
        filters.push({
          propertyName,
          operator: 'LTE',
          value: new Date(to).getTime(),
        });
      }
      return filters;
    };

    const contactFilters = dateFilter('createdate');
    const dealFilters = dateFilter('createdate');

    const totalContactsPromise = this.searchObjects(
      'contacts',
      contactFilters.length > 0 ? [{ filters: contactFilters }] : []
    );
    const totalCompaniesPromise = this.searchObjects('companies', []);
    const totalDealsPromise = this.searchObjects(
      'deals',
      dealFilters.length > 0 ? [{ filters: dealFilters }] : []
    );

    const wonDealsFilterGroup = {
      filters: [
        {
          propertyName: 'hs_is_closed_won',
          operator: 'EQ',
          value: 'true',
        },
        ...dateFilter('closedate'),
      ],
    };

    const wonDealsPromise = this.searchObjects('deals', [
      wonDealsFilterGroup,
    ]);
    const totalRevenuePromise = this.searchObjects(
      'deals',
      [wonDealsFilterGroup],
      ['amount']
    );

    const lostDealsPromise = this.searchObjects('deals', [
      {
        filters: [
          {
            propertyName: 'hs_is_closed_lost',
            operator: 'EQ',
            value: 'true',
          },
          ...dateFilter('closedate'),
        ],
      },
    ]);

    const tasksCompletedPromise = this.searchObjects('tasks', [
      {
        filters: [
          {
            propertyName: 'hs_task_status',
            operator: 'EQ',
            value: 'COMPLETED',
          },
        ],
      },
    ]);

    const tasksOverduePromise = this.searchObjects('tasks', [
      {
        filters: [
          {
            propertyName: 'hs_task_status',
            operator: 'EQ',
            value: 'NOT_STARTED',
          },
        ],
      },
    ]);

    const [
      totalContactsData,
      totalCompaniesData,
      totalDealsData,
      wonDealsData,
      lostDealsData,
      tasksCompletedData,
      tasksOverdueData,
      totalRevenueData,
    ] = await Promise.all([
      totalContactsPromise,
      totalCompaniesPromise,
      totalDealsPromise,
      wonDealsPromise,
      lostDealsPromise,
      tasksCompletedPromise,
      tasksOverduePromise,
      totalRevenuePromise,
    ]);

    const totalRevenue = totalRevenueData.results.reduce(
      (sum: number, deal: any) =>
        sum + parseFloat(deal.properties.amount || '0'),
      0
    );

    const metrics: DashboardMetrics = {
      totalContacts: totalContactsData.total,
      totalCompanies: totalCompaniesData.total,
      totalDeals: totalDealsData.total,
      totalTasks: tasksCompletedData.total + tasksOverdueData.total,
      activeDeals:
        totalDealsData.total - wonDealsData.total - lostDealsData.total,
      wonDeals: wonDealsData.total,
      lostDeals: lostDealsData.total,
      totalRevenue: totalRevenue,
      averageDealSize:
        wonDealsData.total > 0 ? totalRevenue / wonDealsData.total : 0,
      conversionRate:
        totalDealsData.total > 0
          ? (wonDealsData.total / totalDealsData.total) * 100
          : 0,
      tasksCompleted: tasksCompletedData.total,
      tasksOverdue: tasksOverdueData.total,
    };

    return metrics;
  }

  async getTrendData({
    from,
    to,
  }: {
    from?: string;
    to?: string;
  } = {}): Promise<TrendData[]> {
    const startDate = from
      ? new Date(from)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const endDate = to ? new Date(to) : new Date();

    const trendData: TrendData[] = [];
    const dateChunks: { start: Date; end: Date }[] = [];

    let current = new Date(startDate);

    while (current <= endDate) {
      const next = new Date(current);
      next.setDate(next.getDate() + 1);
      dateChunks.push({
        start: new Date(current),
        end: new Date(next.setMilliseconds(next.getMilliseconds() - 1)),
      });
      current.setDate(current.getDate() + 1);
    }

    for (const chunk of dateChunks) {
      const from_timestamp = chunk.start.getTime();
      const to_timestamp = chunk.end.getTime();

      const contactsPromise = this.searchObjects('contacts', [
        {
          filters: [
            {
              propertyName: 'createdate',
              operator: 'BETWEEN',
              value: from_timestamp,
              highValue: to_timestamp,
            },
          ],
        },
      ]);
      const companiesPromise = this.searchObjects('companies', [
        {
          filters: [
            {
              propertyName: 'createdate',
              operator: 'BETWEEN',
              value: from_timestamp,
              highValue: to_timestamp,
            },
          ],
        },
      ]);
      const dealsPromise = this.searchObjects('deals', [
        {
          filters: [
            {
              propertyName: 'createdate',
              operator: 'BETWEEN',
              value: from_timestamp,
              highValue: to_timestamp,
            },
          ],
        },
      ]);
      const revenuePromise = this.searchObjects(
        'deals',
        [
          {
            filters: [
              {
                propertyName: 'hs_is_closed_won',
                operator: 'EQ',
                value: 'true',
              },
              {
                propertyName: 'closedate',
                operator: 'BETWEEN',
                value: from_timestamp,
                highValue: to_timestamp,
              },
            ],
          },
        ],
        ['amount']
      );

      const [contacts, companies, deals, revenueResult] =
        await Promise.all([
          contactsPromise,
          companiesPromise,
          dealsPromise,
          revenuePromise,
        ]);

      const totalRevenue = revenueResult.results.reduce(
        (sum: number, deal: any) =>
          sum + parseFloat(deal.properties.amount || '0'),
        0
      );

      trendData.push({
        date: chunk.start.toISOString().split('T')[0],
        contacts: contacts.total,
        companies: companies.total,
        deals: deals.total,
        revenue: totalRevenue,
      });
    }

    return trendData;
  }

  async getRecentActivity(limit = 10) {
    const [contacts, companies, deals, tasks] = await Promise.all([
      this.getContacts(limit),
      this.getCompanies(limit),
      this.getDeals(limit),
      this.getTasks(limit),
    ]);

    const allActivities = [
      ...contacts.map((contact) => ({
        type: 'contact',
        id: contact.id,
        title:
          `${contact.properties.firstname || ''} ${
            contact.properties.lastname || ''
          }`.trim() || 'New Contact',
        date:
          contact.properties.lastmodifieddate ||
          contact.properties.createdate,
        description:
          contact.properties.email || 'Contact created/updated',
      })),
      ...companies.map((company) => ({
        type: 'company',
        id: company.id,
        title: company.properties.name || 'New Company',
        date:
          company.properties.lastmodifieddate ||
          company.properties.createdate,
        description:
          company.properties.industry || 'Company created/updated',
      })),
      ...deals.map((deal) => ({
        type: 'deal',
        id: deal.id,
        title: deal.properties.dealname || 'New Deal',
        date:
          deal.properties.lastmodifieddate ||
          deal.properties.createdate,
        description: `$${parseFloat(
          deal.properties.amount || '0'
        ).toLocaleString()} - ${
          deal.properties.dealstage || 'Deal created/updated'
        }`,
      })),
      ...tasks.map((task) => ({
        type: 'task',
        id: task.id,
        title: task.properties.hs_task_subject || 'New Task',
        date:
          task.properties.hs_timestamp ||
          task.properties.hs_task_completion_date,
        description:
          task.properties.hs_task_status || 'Task created/updated',
      })),
    ];

    return allActivities
      .sort(
        (a, b) =>
          new Date(b.date || '').getTime() -
          new Date(a.date || '').getTime()
      )
      .slice(0, limit);
  }
}

export const hubSpotService = new HubSpotService();
