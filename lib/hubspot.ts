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
      console.warn('HubSpot API key not found. Please set HUBSPOT_API_KEY environment variable.');
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay between requests
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': this.isPrivateApp ? `Bearer ${this.apiKey}` : `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        params,
        timeout: 10000,
      });
      
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.log('Rate limit hit, waiting 2 seconds before retry...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        // Retry once
        try {
          const response = await axios.get(url, {
            headers: {
              'Authorization': this.isPrivateApp ? `Bearer ${this.apiKey}` : `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            params,
            timeout: 10000,
          });
          return response.data;
        } catch (retryError: any) {
          console.error('Retry failed:', retryError.response?.data || retryError.message);
          throw retryError;
        }
      }
      
      console.error('API request failed:', error.response?.data || error.message);
      throw error;
    }
  }

  async getContacts(limit = 100): Promise<HubSpotContact[]> {
    console.log('Fetching contacts with limit:', limit);
    let allContacts: HubSpotContact[] = [];
    let after: string | undefined;
    let hasMore = true;
    let pageCount = 0;
    
    while (hasMore && pageCount < 10) { // Safety limit to prevent infinite loops
      pageCount++;
      const params: any = {
        limit: Math.min(limit, 100), // HubSpot max is 100 per page
        properties: 'firstname,lastname,email,phone,company,createdate,lastmodifieddate,lifecyclestage,lead_status',
      };
      
      if (after) {
        params.after = after;
      }
      
      const data = await this.makeRequest('/crm/v3/objects/contacts', params);
      console.log(`Contacts API response (page ${pageCount}):`, data);
      
      if (data.results && data.results.length > 0) {
        allContacts = allContacts.concat(data.results);
        if (pageCount === 1) {
          console.log('First contact properties:', JSON.stringify(data.results[0].properties, null, 2));
        }
      }
      
      // Check if there are more pages
      hasMore = data.paging && data.paging.next && data.paging.next.after;
      after = data.paging?.next?.after;
      
      // If we've reached the requested limit, stop
      if (allContacts.length >= limit) {
        break;
      }
    }
    
    console.log(`Total contacts fetched: ${allContacts.length}`);
    return allContacts;
  }

  async getCompanies(limit = 100): Promise<HubSpotCompany[]> {
    console.log('Fetching companies with limit:', limit);
    let allCompanies: HubSpotCompany[] = [];
    let after: string | undefined;
    let hasMore = true;
    let pageCount = 0;
    
    while (hasMore && pageCount < 10) { // Safety limit to prevent infinite loops
      pageCount++;
      const params: any = {
        limit: Math.min(limit, 100), // HubSpot max is 100 per page
        properties: 'name,domain,industry,createdate,lastmodifieddate,lifecyclestage,annualrevenue,numberofemployees',
      };
      
      if (after) {
        params.after = after;
      }
      
      const data = await this.makeRequest('/crm/v3/objects/companies', params);
      console.log(`Companies API response (page ${pageCount}):`, data);
      
      if (data.results && data.results.length > 0) {
        allCompanies = allCompanies.concat(data.results);
        if (pageCount === 1) {
          console.log('First company properties:', JSON.stringify(data.results[0].properties, null, 2));
        }
      }
      
      // Check if there are more pages
      hasMore = data.paging && data.paging.next && data.paging.next.after;
      after = data.paging?.next?.after;
      
      // If we've reached the requested limit, stop
      if (allCompanies.length >= limit) {
        break;
      }
    }
    
    console.log(`Total companies fetched: ${allCompanies.length}`);
    return allCompanies;
  }

  async countAllDeals(): Promise<number> {
    console.log('Counting ALL deals in CRM...');
    let totalCount = 0;
    let after: string | undefined;
    let hasMore = true;
    let pageNum = 0;
    
    while (hasMore && pageNum < 50) { // Higher safety limit for counting
      pageNum++;
      console.log(`Counting deals page ${pageNum}...`);
      
      const params: any = {
        limit: 100, // HubSpot max is 100 per page
        properties: 'dealname', // Only get minimal properties for counting
      };
      
      if (after) {
        params.after = after;
      }
      
      const data = await this.makeRequest('/crm/v3/objects/deals', params);
      const dealsInPage = data.results?.length || 0;
      totalCount += dealsInPage;
      
      console.log(`Page ${pageNum}: ${dealsInPage} deals, Total so far: ${totalCount}`);
      
      // Check if there are more pages
      hasMore = data.paging && data.paging.next && data.paging.next.after;
      after = data.paging?.next?.after;
      
      if (hasMore) {
        console.log(`More pages available, next cursor: ${after}`);
      } else {
        console.log('No more pages available');
      }
    }
    
    console.log(`FINAL TOTAL DEALS COUNT: ${totalCount}`);
    return totalCount;
  }

  async getDeals(limit = 100): Promise<HubSpotDeal[]> {
    console.log('Fetching deals with limit:', limit);
    let allDeals: HubSpotDeal[] = [];
    let after: string | undefined;
    let hasMore = true;
    let pageCount = 0;
    
    // Use a very high limit for unlimited fetching (instead of 0)
    const isUnlimited = limit === 0;
    const actualLimit = isUnlimited ? 100000 : limit; // Use 100k for unlimited
    
    while (hasMore && pageCount < 50) { // Increased safety limit to get ALL deals
      pageCount++;
      console.log(`Fetching deals page ${pageCount}...`);
      
      const params: any = {
        limit: Math.min(actualLimit, 100), // HubSpot max is 100 per page
        properties: 'dealname,amount,dealstage,closedate,createdate,lastmodifieddate,pipeline,hs_is_closed,hs_is_closed_won,hs_is_closed_lost',
      };
      
      if (after) {
        params.after = after;
        console.log(`Using pagination cursor: ${after}`);
      }
      
      const data = await this.makeRequest('/crm/v3/objects/deals', params);
      console.log(`Deals API response (page ${pageCount}): ${data.results?.length || 0} deals returned`);
      
      if (data.results && data.results.length > 0) {
        allDeals = allDeals.concat(data.results);
        console.log(`Page ${pageCount} deals added. Total deals so far: ${allDeals.length}`);
        
        if (pageCount === 1) {
          console.log('First deal properties:', JSON.stringify(data.results[0].properties, null, 2));
        }
        
        // Log deal stages from this page
        const pageStages = Array.from(new Set(data.results.map((deal: any) => deal.properties.dealstage)));
        console.log(`Page ${pageCount} deal stages:`, pageStages);
      }
      
      // Check if there are more pages
      hasMore = data.paging && data.paging.next && data.paging.next.after;
      after = data.paging?.next?.after;
      
      console.log(`Page ${pageCount} has more pages: ${hasMore}`);
      if (hasMore) {
        console.log(`Next page cursor: ${after}`);
      }
      
      // Only stop if we've reached the requested limit AND it's not unlimited
      if (!isUnlimited && allDeals.length >= limit) {
        console.log(`Reached limit of ${limit} deals, stopping pagination`);
        break;
      }
    }
    
    console.log(`Total deals fetched: ${allDeals.length}`);
    
    // Log final deal stage distribution
    const finalStages = Array.from(new Set(allDeals.map(deal => deal.properties.dealstage)));
    console.log('Final deal stages found:', finalStages);
    
    return allDeals;
  }

  async getTasks(limit = 100): Promise<HubSpotTask[]> {
    try {
      const data = await this.makeRequest('/crm/v3/objects/tasks', {
        limit: Math.min(limit, 100), // HubSpot max is 100 per request
        properties: 'hs_timestamp,hs_task_subject,hs_task_body,hs_task_status,hs_task_priority,hs_task_completion_date,hs_task_type',
      });
      return data.results || [];
    } catch (error) {
      console.warn('Tasks API not available or failed:', error);
      return [];
    }
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Fetch data sequentially to avoid rate limiting
      let contacts: any[] = [];
      let companies: any[] = [];
      let deals: any[] = [];
      let tasks: any[] = [];

      console.log('Fetching contacts...');
      try {
        contacts = await this.getContacts(1000);
        console.log(`Successfully fetched ${contacts.length} contacts`);
      } catch (error) {
        console.warn('Failed to fetch contacts:', error);
      }

      // Add delay between API calls
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Fetching companies...');
      try {
        companies = await this.getCompanies(1000);
        console.log(`Successfully fetched ${companies.length} companies`);
      } catch (error) {
        console.warn('Failed to fetch companies:', error);
      }

      // Add delay between API calls
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Fetching deals...');
      try {
        // First, count ALL deals in the CRM
        const totalDealsCount = await this.countAllDeals();
        console.log(`Total deals in CRM: ${totalDealsCount}`);
        
        // Now fetch ALL deals (pass 0 for unlimited)
        deals = await this.getDeals(0);
        console.log(`Successfully fetched ${deals.length} deals`);
      } catch (error) {
        console.warn('Failed to fetch deals:', error);
      }

      // Add delay between API calls
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Fetching tasks...');
      try {
        tasks = await this.getTasks(1000);
        console.log(`Successfully fetched ${tasks.length} tasks`);
      } catch (error) {
        console.warn('Failed to fetch tasks:', error);
      }

      // Debug: Log all deal stages to understand the data
      if (deals.length > 0) {
        console.log('All deal stages found:');
        const dealStages = Array.from(new Set(deals.map(deal => deal.properties.dealstage)));
        console.log(dealStages);
        
        console.log('Sample deals with stages:');
        deals.slice(0, 5).forEach((deal, index) => {
          console.log(`Deal ${index + 1}: ${deal.properties.dealname} - Stage: ${deal.properties.dealstage}`);
        });
      }

      // Fix deal filtering based on actual HubSpot properties
      const activeDeals = deals.filter(deal => {
        const stage = deal.properties.dealstage;
        return stage && !['closedwon', 'closedlost'].includes(stage);
      });
      
      const wonDeals = deals.filter(deal => {
        const stage = deal.properties.dealstage;
        return stage === 'closedwon';
      });
      
      const lostDeals = deals.filter(deal => {
        const stage = deal.properties.dealstage;
        return stage === 'closedlost';
      });
      
      const totalRevenue = wonDeals.reduce((sum, deal) => {
        const amount = parseFloat(deal.properties.amount || '0');
        return sum + amount;
      }, 0);

      const averageDealSize = deals.length > 0 
        ? deals.reduce((sum, deal) => sum + parseFloat(deal.properties.amount || '0'), 0) / deals.length 
        : 0;

      const conversionRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;

      const tasksCompleted = tasks.filter(task => task.properties.hs_task_status === 'COMPLETED').length;
      const tasksOverdue = tasks.filter(task => {
        const completionDate = task.properties.hs_task_completion_date;
        return completionDate && new Date(completionDate) < new Date() && task.properties.hs_task_status !== 'COMPLETED';
      }).length;

      // Debug logging
      console.log('Dashboard Metrics Calculation:');
      console.log(`- Total contacts: ${contacts.length}`);
      console.log(`- Total companies: ${companies.length}`);
      console.log(`- Total deals: ${deals.length}`);
      console.log(`- Active deals: ${activeDeals.length}`);
      console.log(`- Won deals: ${wonDeals.length}`);
      console.log(`- Lost deals: ${lostDeals.length}`);
      console.log(`- Total revenue: ${totalRevenue}`);
      console.log(`- Average deal size: ${averageDealSize}`);

      return {
        totalContacts: contacts.length,
        totalCompanies: companies.length,
        totalDeals: deals.length,
        totalTasks: tasks.length,
        activeDeals: activeDeals.length,
        wonDeals: wonDeals.length,
        lostDeals: lostDeals.length,
        totalRevenue,
        averageDealSize,
        conversionRate,
        tasksCompleted,
        tasksOverdue,
      };
    } catch (error) {
      console.error('Error in getDashboardMetrics:', error);
      // Return default metrics if everything fails
      return {
        totalContacts: 0,
        totalCompanies: 0,
        totalDeals: 0,
        totalTasks: 0,
        activeDeals: 0,
        wonDeals: 0,
        lostDeals: 0,
        totalRevenue: 0,
        averageDealSize: 0,
        conversionRate: 0,
        tasksCompleted: 0,
        tasksOverdue: 0,
      };
    }
  }

  async getTrendData(days = 30): Promise<TrendData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Fetch data with individual error handling
      let contacts: any[] = [];
      let companies: any[] = [];
      let deals: any[] = [];

      try {
        contacts = await this.getContacts(1000);
      } catch (error) {
        console.warn('Failed to fetch contacts for trends:', error);
      }

      try {
        companies = await this.getCompanies(1000);
      } catch (error) {
        console.warn('Failed to fetch companies for trends:', error);
      }

      try {
        deals = await this.getDeals(1000);
      } catch (error) {
        console.warn('Failed to fetch deals for trends:', error);
      }

      const trendData: TrendData[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        
        const contactsOnDate = contacts.filter(contact => {
          const createdDate = contact.properties.createdate;
          return createdDate && createdDate.startsWith(dateStr);
        }).length;

        const companiesOnDate = companies.filter(company => {
          const createdDate = company.properties.createdate;
          return createdDate && createdDate.startsWith(dateStr);
        }).length;

        const dealsOnDate = deals.filter(deal => {
          const createdDate = deal.properties.createdate;
          return createdDate && createdDate.startsWith(dateStr);
        });

        const revenueOnDate = dealsOnDate.reduce((sum, deal) => {
          const amount = parseFloat(deal.properties.amount || '0');
          return sum + amount;
        }, 0);

        trendData.push({
          date: dateStr,
          contacts: contactsOnDate,
          companies: companiesOnDate,
          deals: dealsOnDate.length,
          revenue: revenueOnDate,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return trendData;
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
        this.getDeals(limit),
        this.getTasks(limit),
      ]);

      const allActivities = [
        ...contacts.map(contact => ({
          type: 'contact',
          id: contact.id,
          title: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim() || 'New Contact',
          date: contact.properties.lastmodifieddate || contact.properties.createdate,
          description: contact.properties.email || 'Contact created/updated',
        })),
        ...companies.map(company => ({
          type: 'company',
          id: company.id,
          title: company.properties.name || 'New Company',
          date: company.properties.lastmodifieddate || company.properties.createdate,
          description: company.properties.industry || 'Company created/updated',
        })),
        ...deals.map(deal => ({
          type: 'deal',
          id: deal.id,
          title: deal.properties.dealname || 'New Deal',
          date: deal.properties.lastmodifieddate || deal.properties.createdate,
          description: `$${parseFloat(deal.properties.amount || '0').toLocaleString()} - ${deal.properties.dealstage || 'Deal created/updated'}`,
        })),
        ...tasks.map(task => ({
          type: 'task',
          id: task.id,
          title: task.properties.hs_task_subject || 'New Task',
          date: task.properties.hs_timestamp || task.properties.hs_task_completion_date,
          description: task.properties.hs_task_status || 'Task created/updated',
        })),
      ];

      return allActivities
        .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      return [];
    }
  }
}

export const hubSpotService = new HubSpotService(); 