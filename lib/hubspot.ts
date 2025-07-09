import axios from 'axios';
import {
  getDateRange,
  getPreviousDateRange,
  buildBetweenFilter,
  buildEqualsFilter,
  buildAndFilter,
} from './dateUtils';
import { cache } from './cache';
import pLimit from 'p-limit';
import { Client as HubSpotClient } from '@hubspot/api-client';

const HUBSPOT_API_BASE = 'https://api.hubapi.com';
const HUBSPOT_RATE_LIMIT = 3; // 3 requests per second (adjust as needed)
const limit = pLimit(HUBSPOT_RATE_LIMIT);

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

/**
 * HubSpotService provides methods to fetch and aggregate CRM data from HubSpot.
 *
 * - Caching: Expensive methods (getDashboardMetrics, getTrendData) use in-memory caching (5 min TTL).
 *   Use the 'forceRefresh' option to bypass cache.
 * - Batching/Concurrency: searchObjects fetches all pages in parallel with a concurrency limit (p-limit).
 */
class HubSpotService {
  private apiKey: string;
  private isPrivateApp: boolean;
  private baseUrl: string;
  private hubspotClient: HubSpotClient;

  constructor() {
    this.apiKey = process.env.HUBSPOT_API_KEY || '';
    this.isPrivateApp = this.apiKey.startsWith('pat-');
    this.baseUrl = HUBSPOT_API_BASE;
    this.hubspotClient = new HubSpotClient({
      accessToken: this.apiKey,
    });
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
        const retryAfter = error.response.headers['retry-after'];
        const waitTime = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : backoff;
        console.warn(
          `[HubSpot] Rate limited (GET). Retrying after ${waitTime}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.makeRequest(
          endpoint,
          params,
          retries - 1,
          backoff * 2
        );
      }
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
        const retryAfter = error.response.headers['retry-after'];
        const waitTime = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : backoff;
        console.warn(
          `[HubSpot] Rate limited (POST). Retrying after ${waitTime}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.makePostRequest(
          endpoint,
          body,
          retries - 1,
          backoff * 2
        );
      }
      throw error;
    }
  }

  /**
   * Fetches all objects of a given type from HubSpot, handling pagination.
   * Uses batching with concurrency limit (3) for performance and rate limit safety.
   * Results are deduplicated by ID.
   */
  public async searchObjects(
    objectType: string,
    filterGroups: any[],
    properties: string[] = [],
    sorts?: any[]
  ): Promise<{ total: number; results: any[] }> {
    const endpoint = `/crm/v3/objects/${objectType}/search`;

    let allResults: any[] = [];
    let after: string | undefined = undefined;
    const defaultSorts = [
      { propertyName: 'createdate', direction: 'ASCENDING' },
    ];
    const useSorts = sorts || defaultSorts;

    let page = 1;
    while (true) {
      const body: any = {
        filterGroups,
        properties,
        limit: 100,
        sorts: useSorts,
      };
      if (after) {
        body.after = after;
      }
      const response = await this.makePostRequest(endpoint, body);
      if (response.results && response.results.length > 0) {
        allResults = allResults.concat(response.results);
      }
      if (
        response.paging &&
        response.paging.next &&
        response.paging.next.after
      ) {
        after = response.paging.next.after;
        page++;
      } else {
        break;
      }
    }

    // Defensive deduplication by ID
    const dedupedResults = Array.from(
      new Map(allResults.map((obj) => [obj.id, obj])).values()
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
    // Use the @hubspot/api-client SDK to fetch all deals with pagination
    const properties = [
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
    ];
    let after: string | undefined = undefined;
    let allDeals: HubSpotDeal[] = [];
    do {
      const response =
        await this.hubspotClient.crm.deals.basicApi.getPage(
          100,
          after,
          properties
        );
      const deals = response.results.map((deal: any) => ({
        id: deal.id,
        properties: deal.properties,
      }));
      allDeals = allDeals.concat(deals);
      after = response.paging?.next?.after;
    } while (after);
    return allDeals;
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
      return 0;
    }
  }

  private async throttledBatch<T>(
    tasks: (() => Promise<T>)[],
    batchDelayMs = 400
  ): Promise<T[]> {
    const results: T[] = [];
    for (let i = 0; i < tasks.length; i += HUBSPOT_RATE_LIMIT) {
      const batch = tasks.slice(i, i + HUBSPOT_RATE_LIMIT);
      results.push(
        ...(await Promise.all(batch.map((fn) => limit(fn))))
      );
      if (i + HUBSPOT_RATE_LIMIT < tasks.length) {
        await new Promise((res) => setTimeout(res, batchDelayMs));
      }
    }
    return results;
  }

  /**
   * Returns dashboard metrics for the given time range.
   * Results are cached for 5 minutes by default.
   * Pass { forceRefresh: true } to bypass cache.
   */
  async getDashboardMetrics(
    days = 30,
    startTimestamp?: number,
    endTimestamp?: number,
    options?: { forceRefresh?: boolean }
  ): Promise<DashboardMetrics & { stale?: boolean }> {
    const cacheKey = `metrics:${days}`;
    if (!options?.forceRefresh) {
      const cached = cache.get<DashboardMetrics & { stale?: boolean }>(
        cacheKey
      );
      if (cached) {
        console.log(`[DashboardMetrics] Cache hit for days=${days}`);
        return cached;
      }
    }
    try {
      // Bulk fetch all objects (with pagination)
      const [allContacts, allCompanies, allDeals, allTasks] =
        await Promise.all([
          this.searchObjects('contacts', [], ['createdate']),
          this.searchObjects('companies', [], ['createdate']),
          this.searchObjects(
            'deals',
            [],
            [
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
          ),
          this.searchObjects(
            'tasks',
            [],
            [
              'hs_task_status',
              'hs_task_completion_date',
              'hs_timestamp',
              'hs_createdate',
            ]
          ),
        ]);
      // Compute date ranges
      let startTs: number, endTs: number;
      if (startTimestamp !== undefined && endTimestamp !== undefined) {
        startTs = startTimestamp;
        endTs = endTimestamp;
      } else {
        const range = getDateRange(days);
        startTs = range.start;
        endTs = range.end;
      }
      // Compute metrics in-memory
      // Contacts
      const totalContacts =
        days === 0
          ? allContacts.total
          : allContacts.results.filter((c) => {
              const created = c.properties.createdate
                ? new Date(c.properties.createdate).getTime()
                : null;
              return created && created >= startTs && created <= endTs;
            }).length;
      const allTimeContacts = allContacts.total;
      // Companies
      const totalCompanies =
        days === 0
          ? allCompanies.total
          : allCompanies.results.filter((c) => {
              const created = c.properties.createdate
                ? new Date(c.properties.createdate).getTime()
                : null;
              return created && created >= startTs && created <= endTs;
            }).length;
      const allTimeCompanies = allCompanies.total;
      // Deals
      const deals = allDeals.results;
      const PERIOD = days * 24 * 60 * 60 * 1000;
      const now = endTs;
      let newDeals = 0,
        wonDeals = 0,
        lostDeals = 0,
        openDeals = 0,
        revenue = 0,
        lostRevenue = 0,
        wonDealSizes: number[] = [],
        allDealSizes: number[] = [],
        newDealsValue = 0,
        activeDealsValue = 0;
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
          if (created && created >= startTs && created <= now) {
            newDeals++;
            if (amount) newDealsValue += amount;
          }
          if (
            stage === 'closedwon' &&
            closed &&
            closed >= startTs &&
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
            closed >= startTs &&
            closed <= now
          ) {
            lostDeals++;
            if (amount) lostRevenue += amount;
          }
        }
        if (stage !== 'closedwon' && stage !== 'closedlost') {
          openDeals++;
          if (amount) activeDealsValue += amount;
        }
      }
      const totalDeals = newDeals;
      const averageDealSize = allDealSizes.length
        ? allDealSizes.reduce((a, b) => a + b, 0) / allDealSizes.length
        : 0;
      const averageWonDealSize = wonDealSizes.length
        ? wonDealSizes.reduce((a, b) => a + b, 0) / wonDealSizes.length
        : 0;
      const conversionRate =
        wonDeals + lostDeals > 0
          ? (wonDeals / (wonDeals + lostDeals)) * 100
          : 0;
      // Tasks
      const tasks = allTasks.results;
      const totalTasks = tasks.length;
      const tasksCompleted = tasks.filter(
        (t) =>
          t.properties.hs_task_status === 'COMPLETED' &&
          t.properties.hs_task_completion_date
      ).length;
      // Compose result
      const result = {
        totalContacts,
        allTimeContacts,
        totalCompanies,
        allTimeCompanies,
        totalDeals,
        newDealsValue,
        totalTasks,
        activeDeals: openDeals,
        activeDealsValue,
        wonDeals,
        lostDeals,
        totalRevenue: revenue,
        averageDealSize,
        averageWonDealSize,
        conversionRate,
        tasksCompleted,
        tasksOverdue: 0,
      };
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error(
        `[DashboardMetrics] Error for days=${days}:`,
        error
      );
      // Try to return the last cached value if available
      const cached = cache.get<DashboardMetrics & { stale?: boolean }>(
        cacheKey
      );
      if (cached) {
        console.warn(
          `[DashboardMetrics] Returning stale cached value for days=${days}`
        );
        return { ...cached, stale: true };
      }
      // Only return zeros if nothing is cached
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
        stale: true,
      };
    }
  }

  /**
   * Returns trend data for the given time range.
   * Results are cached for 5 minutes by default.
   * Pass { forceRefresh: true } to bypass cache.
   */
  async getTrendData(
    days = 30,
    options?: { forceRefresh?: boolean }
  ): Promise<TrendData[]> {
    const cacheKey = `trends:${days}`;
    if (!options?.forceRefresh) {
      const cached = cache.get<TrendData[]>(cacheKey);
      if (cached) return cached;
    }
    try {
      const range = getDateRange(days);
      const startTimestamp = range.start;
      const endTimestamp = range.end;
      console.log(
        `[TrendData] Calculating trends for days=${days}, start=${new Date(
          startTimestamp
        ).toISOString()}, end=${new Date(endTimestamp).toISOString()}`
      );
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
      console.log(
        `[TrendData] Contacts fetched: ${contactsData.results.length}, Companies fetched: ${companiesData.results.length}, Deals fetched: ${dealsData.results.length}`
      );
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
      const result = Array.from(trendMap.values());
      cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('[TrendData] Error calculating trends:', error);
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
