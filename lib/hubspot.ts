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
import { getDealMetrics } from './metrics/deals';
// REMOVE: import { Client as HubSpotClient } from '@hubspot/api-client';

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
  newDeals: number;
  newDealsValue: number;
  averageNewDealSize: number;
  totalTasks: number;
  activeDeals: number;
  activeDealsValue: number;
  wonDeals: number;
  lostDeals: number;
  totalRevenue: number;
  averageDealSize: number;
  averageWonDealSize: number;
  conversionRate: number;
  valueCloseRate: number; // value-based close rate
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
  // REMOVE: private hubspotClient: HubSpotClient;

  constructor() {
    this.apiKey = process.env.HUBSPOT_API_KEY || '';
    this.isPrivateApp = this.apiKey.startsWith('pat-');
    this.baseUrl = HUBSPOT_API_BASE;
    // REMOVE: this.hubspotClient = new HubSpotClient({ accessToken: this.apiKey });
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

  // REPLACE SDK-based getDeals with HTTP-based version
  async getDeals(limit = 100): Promise<HubSpotDeal[]> {
    const data = await this.makeRequest('/crm/v3/objects/deals', {
      limit,
      properties:
        'dealname,amount,dealstage,closedate,createdate,lastmodifieddate,pipeline,hs_is_closed,hs_is_closed_won,hs_is_closed_lost',
    });
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

  /**
   * Fetches associated company for a deal by dealId.
   */
  private async getDealCompany(dealId: string): Promise<string | null> {
    try {
      const assoc = await this.makeRequest(
        `/crm/v3/objects/deals/${dealId}/associations/companies`,
        {}
      );
      const companyId = assoc.results?.[0]?.id;
      if (!companyId) return null;
      const company = await this.makeRequest(
        `/crm/v3/objects/companies/${companyId}`,
        { properties: 'name' }
      );
      return company.properties?.name || null;
    } catch {
      return null;
    }
  }

  /**
   * Fetches associated contacts for a deal by dealId.
   */
  private async getDealContacts(dealId: string): Promise<string[]> {
    try {
      const assoc = await this.makeRequest(
        `/crm/v3/objects/deals/${dealId}/associations/contacts`,
        {}
      );
      const contactIds = assoc.results?.map((r: any) => r.id) || [];
      if (contactIds.length === 0) return [];
      // Fetch all contacts in parallel (limit concurrency)
      const contactFetches = contactIds.map(
        (id: string) => () =>
          this.makeRequest(`/crm/v3/objects/contacts/${id}`, {
            properties: 'firstname,lastname',
          })
      );
      const contacts = await this.throttledBatch(contactFetches);
      return contacts
        .map((c: any) =>
          `${c.properties?.firstname || ''} ${
            c.properties?.lastname || ''
          }`.trim()
        )
        .filter(Boolean);
    } catch {
      return [];
    }
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
   * Returns dashboard metrics for the given time range, and also calculates previous period metrics in-memory.
   * Results are cached for 5 minutes by default.
   * Pass { forceRefresh: true } to bypass cache.
   */
  async getDashboardMetrics(
    days = 30,
    startTimestamp?: number,
    endTimestamp?: number,
    options?: { forceRefresh?: boolean }
  ): Promise<{
    current: DashboardMetrics;
    previous: DashboardMetrics;
  }> {
    const cacheKey = `metrics:${days}`;
    if (!options?.forceRefresh) {
      const cached = cache.get<{
        current: DashboardMetrics;
        previous: DashboardMetrics;
      }>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    try {
      // Fetch all objects (no date filter)
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
      const now = endTimestamp ?? Date.now();
      const period = days * 24 * 60 * 60 * 1000;
      const start = now - period;
      const prevStart = start - period;
      const prevEnd = start;

      // Helper to filter by createdate
      const inCurrentPeriod = (created: number | null) =>
        created !== null && created >= start && created <= now;
      const inPrevPeriod = (created: number | null) =>
        created !== null && created >= prevStart && created < prevEnd;

      // Contacts
      let currentContacts, prevContacts;
      let currentCompanies, prevCompanies;
      let currentDeals, prevDeals;
      if (days === 0) {
        currentContacts = allContacts.results;
        prevContacts = [];
        currentCompanies = allCompanies.results;
        prevCompanies = [];
        currentDeals = allDeals.results;
        prevDeals = [];
      } else {
        currentContacts = allContacts.results.filter((c) =>
          inCurrentPeriod(
            c.properties.createdate
              ? new Date(c.properties.createdate).getTime()
              : null
          )
        );
        prevContacts = allContacts.results.filter((c) =>
          inPrevPeriod(
            c.properties.createdate
              ? new Date(c.properties.createdate).getTime()
              : null
          )
        );
        currentCompanies = allCompanies.results.filter((c) =>
          inCurrentPeriod(
            c.properties.createdate
              ? new Date(c.properties.createdate).getTime()
              : null
          )
        );
        prevCompanies = allCompanies.results.filter((c) =>
          inPrevPeriod(
            c.properties.createdate
              ? new Date(c.properties.createdate).getTime()
              : null
          )
        );
        currentDeals = allDeals.results.filter((d) =>
          inCurrentPeriod(
            d.properties.createdate
              ? new Date(d.properties.createdate).getTime()
              : null
          )
        );
        prevDeals = allDeals.results.filter((d) =>
          inPrevPeriod(
            d.properties.createdate
              ? new Date(d.properties.createdate).getTime()
              : null
          )
        );
      }
      // Deals
      const tasks = allTasks.results;
      // Use getDealMetrics to get all deal metrics, including averageNewDealSize
      const currentDealMetrics = getDealMetrics(
        allDeals.results,
        days,
        now
      );
      const prevDealMetrics = getDealMetrics(
        allDeals.results,
        days,
        prevEnd
      );
      // Tasks (for compatibility)
      const totalTasks = tasks.length;
      const tasksCompleted = tasks.filter(
        (t) =>
          t.properties.hs_task_status === 'COMPLETED' &&
          t.properties.hs_task_completion_date
      ).length;
      // Compose metrics
      const current: DashboardMetrics = {
        totalContacts: currentContacts.length,
        allTimeContacts: allContacts.total,
        totalCompanies: currentCompanies.length,
        allTimeCompanies: allCompanies.total,
        totalDeals: currentDealMetrics.totalDeals,
        newDeals: currentDealMetrics.newDeals,
        newDealsValue: currentDealMetrics.newDealsValue,
        averageNewDealSize: currentDealMetrics.averageNewDealSize,
        totalTasks,
        activeDeals: currentDealMetrics.openDeals,
        activeDealsValue: currentDealMetrics.activeDealsValue,
        wonDeals: currentDealMetrics.wonDeals,
        lostDeals: currentDealMetrics.lostDeals,
        totalRevenue: currentDealMetrics.revenue,
        averageDealSize: currentDealMetrics.averageDealSize,
        averageWonDealSize: currentDealMetrics.averageWonDealSize,
        conversionRate: currentDealMetrics.conversionRate,
        valueCloseRate: currentDealMetrics.valueCloseRate, // Add valueCloseRate
        tasksCompleted,
        tasksOverdue: 0,
      };
      const previous: DashboardMetrics = {
        totalContacts: prevContacts.length,
        allTimeContacts: allContacts.total,
        totalCompanies: prevCompanies.length,
        allTimeCompanies: allCompanies.total,
        totalDeals: prevDealMetrics.totalDeals,
        newDeals: prevDealMetrics.newDeals,
        newDealsValue: prevDealMetrics.newDealsValue,
        averageNewDealSize: prevDealMetrics.averageNewDealSize,
        totalTasks,
        activeDeals: prevDealMetrics.openDeals,
        activeDealsValue: prevDealMetrics.activeDealsValue,
        wonDeals: prevDealMetrics.wonDeals,
        lostDeals: prevDealMetrics.lostDeals,
        totalRevenue: prevDealMetrics.revenue,
        averageDealSize: prevDealMetrics.averageDealSize,
        averageWonDealSize: prevDealMetrics.averageWonDealSize,
        conversionRate: prevDealMetrics.conversionRate,
        valueCloseRate: prevDealMetrics.valueCloseRate, // Add valueCloseRate
        tasksCompleted,
        tasksOverdue: 0,
      };
      cache.set(cacheKey, { current, previous });
      return { current, previous };
    } catch (error) {
      console.error(
        `[DashboardMetrics] Error for days=${days}:`,
        error
      );
      // Try to return the last cached value if available
      const cached = cache.get<{
        current: DashboardMetrics;
        previous: DashboardMetrics;
      }>(cacheKey);
      if (cached) {
        return cached;
      }
      // Only return zeros if nothing is cached
      const empty: DashboardMetrics = {
        totalContacts: 0,
        allTimeContacts: 0,
        totalCompanies: 0,
        allTimeCompanies: 0,
        totalDeals: 0,
        newDeals: 0,
        newDealsValue: 0,
        averageNewDealSize: 0,
        totalTasks: 0,
        activeDeals: 0,
        activeDealsValue: 0,
        wonDeals: 0,
        lostDeals: 0,
        totalRevenue: 0,
        averageDealSize: 0,
        averageWonDealSize: 0,
        conversionRate: 0,
        valueCloseRate: 0,
        tasksCompleted: 0,
        tasksOverdue: 0,
      };
      return { current: empty, previous: empty };
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
    // Fetch associations for each deal
    const newDeals = await Promise.all(
      dealsData.results.map(async (deal: any) => {
        const [companyName, contactNames] = await Promise.all([
          this.getDealCompany(deal.id),
          this.getDealContacts(deal.id),
        ]);
        return {
          company: companyName,
          contacts: contactNames,
          name: deal.properties.dealname || 'New Deal',
          amount: deal.properties.amount
            ? parseFloat(deal.properties.amount)
            : 0,
        };
      })
    );
    return {
      closedTasks: closedTasksData.total,
      newContacts: contactsData.total,
      newCompanies: companiesData.total,
      newDeals,
    };
  }

  /**
   * Returns top N won deals in the given period, ordered by amount descending.
   */
  async getTopWonDeals(start: number, end: number, limit = 10) {
    const dealsData = await this.searchObjects(
      'deals',
      [
        {
          filters: [
            {
              propertyName: 'dealstage',
              operator: 'EQ',
              value: 'closedwon',
            },
            {
              propertyName: 'closedate',
              operator: 'BETWEEN',
              value: start,
              highValue: end,
            },
          ],
        },
      ],
      ['dealname', 'amount', 'createdate', 'closedate']
    );
    // Sort by amount descending
    const sorted = dealsData.results
      .filter((d: any) => d.properties.amount)
      .sort(
        (a: any, b: any) =>
          parseFloat(b.properties.amount) -
          parseFloat(a.properties.amount)
      )
      .slice(0, limit);
    // Fetch associations for each deal
    return Promise.all(
      sorted.map(async (deal: any) => {
        const [company, contacts] = await Promise.all([
          this.getDealCompany(deal.id),
          this.getDealContacts(deal.id),
        ]);
        return {
          company,
          contacts,
          name: deal.properties.dealname || 'Deal',
          amount: deal.properties.amount
            ? parseFloat(deal.properties.amount)
            : 0,
        };
      })
    );
  }

  /**
   * Returns top N new deals (by createdate) in the given period, ordered by amount descending.
   */
  async getTopNewDeals(start: number, end: number, limit = 10) {
    const dealsData = await this.searchObjects(
      'deals',
      [
        {
          filters: [
            {
              propertyName: 'createdate',
              operator: 'BETWEEN',
              value: start,
              highValue: end,
            },
          ],
        },
      ],
      ['dealname', 'amount', 'createdate']
    );
    // Sort by amount descending
    const sorted = dealsData.results
      .filter((d: any) => d.properties.amount)
      .sort(
        (a: any, b: any) =>
          parseFloat(b.properties.amount) -
          parseFloat(a.properties.amount)
      )
      .slice(0, limit);
    // Fetch associations for each deal
    return Promise.all(
      sorted.map(async (deal: any) => {
        const [company, contacts] = await Promise.all([
          this.getDealCompany(deal.id),
          this.getDealContacts(deal.id),
        ]);
        return {
          company,
          contacts,
          name: deal.properties.dealname || 'Deal',
          amount: deal.properties.amount
            ? parseFloat(deal.properties.amount)
            : 0,
        };
      })
    );
  }

  /**
   * Returns top N open deals (all time), ordered by amount descending.
   */
  async getTopOpenDeals(_start: number, _end: number, limit = 10) {
    const dealsData = await this.searchObjects(
      'deals',
      [
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
      ],
      ['dealname', 'amount', 'createdate']
    );
    const sorted = dealsData.results
      .filter((d: any) => d.properties.amount)
      .sort(
        (a: any, b: any) =>
          parseFloat(b.properties.amount) -
          parseFloat(a.properties.amount)
      )
      .slice(0, limit);
    return Promise.all(
      sorted.map(async (deal: any) => {
        const [company, contacts] = await Promise.all([
          this.getDealCompany(deal.id),
          this.getDealContacts(deal.id),
        ]);
        return {
          company,
          contacts,
          name: deal.properties.dealname || 'Deal',
          amount: deal.properties.amount
            ? parseFloat(deal.properties.amount)
            : 0,
        };
      })
    );
  }

  /**
   * Returns top N lost deals in the given period, ordered by amount descending.
   */
  async getTopLostDeals(start: number, end: number, limit = 10) {
    const dealsData = await this.searchObjects(
      'deals',
      [
        {
          filters: [
            {
              propertyName: 'dealstage',
              operator: 'EQ',
              value: 'closedlost',
            },
            {
              propertyName: 'closedate',
              operator: 'BETWEEN',
              value: start,
              highValue: end,
            },
          ],
        },
      ],
      ['dealname', 'amount', 'createdate', 'closedate']
    );
    const sorted = dealsData.results
      .filter((d: any) => d.properties.amount)
      .sort(
        (a: any, b: any) =>
          parseFloat(b.properties.amount) -
          parseFloat(a.properties.amount)
      )
      .slice(0, limit);
    return Promise.all(
      sorted.map(async (deal: any) => {
        const [company, contacts] = await Promise.all([
          this.getDealCompany(deal.id),
          this.getDealContacts(deal.id),
        ]);
        return {
          company,
          contacts,
          name: deal.properties.dealname || 'Deal',
          amount: deal.properties.amount
            ? parseFloat(deal.properties.amount)
            : 0,
        };
      })
    );
  }

  /**
   * Returns top N companies (or contacts if no company) by sum of won deals in the given period.
   */
  async getTopWonCompaniesOrContacts(
    start: number,
    end: number,
    limit = 10
  ) {
    const dealsData = await this.searchObjects(
      'deals',
      [
        {
          filters: [
            {
              propertyName: 'dealstage',
              operator: 'EQ',
              value: 'closedwon',
            },
            {
              propertyName: 'closedate',
              operator: 'BETWEEN',
              value: start,
              highValue: end,
            },
          ],
        },
      ],
      ['dealname', 'amount', 'createdate', 'closedate']
    );
    // Aggregate by company or contact
    const entityMap = new Map();
    for (const deal of dealsData.results) {
      const amount = deal.properties.amount
        ? parseFloat(deal.properties.amount)
        : 0;
      if (!amount) continue;
      const company = await this.getDealCompany(deal.id);
      let key = company;
      let label = company;
      if (!company) {
        const contacts = await this.getDealContacts(deal.id);
        key = contacts.join(', ');
        label = key;
      }
      if (!key) continue;
      if (!entityMap.has(key)) {
        entityMap.set(key, { label, sum: 0 });
      }
      entityMap.get(key).sum += amount;
    }
    // Sort and return top N
    return Array.from(entityMap.values())
      .sort((a, b) => b.sum - a.sum)
      .slice(0, limit);
  }

  /**
   * Returns top N companies (or contacts if no company) by sum of lost deals in the given period.
   */
  async getTopLostCompaniesOrContacts(
    start: number,
    end: number,
    limit = 10
  ) {
    const dealsData = await this.searchObjects(
      'deals',
      [
        {
          filters: [
            {
              propertyName: 'dealstage',
              operator: 'EQ',
              value: 'closedlost',
            },
            {
              propertyName: 'closedate',
              operator: 'BETWEEN',
              value: start,
              highValue: end,
            },
          ],
        },
      ],
      ['dealname', 'amount', 'createdate', 'closedate']
    );
    // Aggregate by company or contact
    const entityMap = new Map();
    for (const deal of dealsData.results) {
      const amount = deal.properties.amount
        ? parseFloat(deal.properties.amount)
        : 0;
      if (!amount) continue;
      const company = await this.getDealCompany(deal.id);
      let key = company;
      let label = company;
      if (!company) {
        const contacts = await this.getDealContacts(deal.id);
        key = contacts.join(', ');
        label = key;
      }
      if (!key) continue;
      if (!entityMap.has(key)) {
        entityMap.set(key, { label, sum: 0 });
      }
      entityMap.get(key).sum += amount;
    }
    // Sort and return top N
    return Array.from(entityMap.values())
      .sort((a, b) => b.sum - a.sum)
      .slice(0, limit);
  }
}

export const hubSpotService = new HubSpotService();
