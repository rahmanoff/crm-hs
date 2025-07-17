# HubSpot CRM Dashboard

A modern, interactive dashboard for HubSpot CRM that provides real-time insights into your contacts, companies, deals, and tasks.

## 🚀 Features

- **Real-time Metrics**: Live data from your HubSpot CRM
- **Interactive Charts**: Beautiful visualizations using Recharts
- **Responsive Design**: Works perfectly on desktop and mobile
- **Rate Limiting**: Built-in API rate limiting and retry logic
- **Production Ready**: Optimized for deployment

## 📊 Dashboard Metrics

- **Contacts**: Total contacts with growth trends
- **Companies**: Company count and industry distribution
- **Deals**: Deal pipeline, revenue, and conversion rates
- **Tasks**: Task completion and overdue tracking
- **Revenue Analytics**: Total revenue and average deal size
- **Activity Feed**: Recent CRM activities

### Robust Metrics Calculation (All-Time & Period-Based)

- All-time and period-based metrics (e.g., Tasks, Deals) now fetch **all pages** from HubSpot using direct HTTP requests (Axios) and the HubSpot Search API, ensuring complete and accurate data for large datasets.
- The backend handles HubSpot API pagination, batching, and rate limiting automatically—no SDK is used.
- This robust pattern is used for all CRM objects (Tasks, Deals, Contacts, Companies, etc.) to ensure data integrity and accurate reporting.
- Metrics such as "Open Tasks" or "Open Deals" are always calculated from the full dataset, not just a time slice.
- Period-based metrics (e.g., "New", "Completed", "Closed") are filtered by the selected period in the dashboard.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **HTTP Client**: Axios (for all HubSpot API calls)
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+
- npm 8+
- HubSpot account with API access
- HubSpot Private App or API Key

## 🔧 Installation

1. **Clone the repository**

   ```bash
   git clone <your-repo-url>
   cd hubspot-crm-dashboard
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   - Copy `.env.example` to `.env.local` (or `.env` for production):
     ```bash
     cp .env.example .env.local
     ```
   - Edit `.env.local` and fill in your real values.

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 HubSpot API Setup

### Option 1: Private App (Recommended)

1. Go to HubSpot Settings → Account Setup → Integrations → Private Apps
2. Create a new Private App
3. Add the following scopes:
   - `crm.objects.contacts.read`
   - `crm.objects.companies.read`
   - `crm.objects.deals.read`
   - `crm.objects.tasks.read`
4. Copy the Private App token (starts with `pat-`)

### Option 2: API Key

1. Go to HubSpot Settings → Account Setup → Integrations → API Keys
2. Create a new API Key
3. Copy the API Key

## 🚀 Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Node.js:

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 📁 Project Structure

```
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── activity/      # Recent activity endpoint
│   │   ├── metrics/       # Dashboard metrics endpoint
│   │   └── trends/        # Trend data endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Dashboard page
├── components/            # React components
│   ├── ActivityFeed.tsx   # Activity feed component
│   ├── MetricCard.tsx     # Metric card component
│   └── TrendChart.tsx     # Trend chart component
├── lib/                   # Utility libraries
│   └── hubspot.ts         # HubSpot API service (HTTP-based)
└── public/                # Static assets
```

## 🎨 UI Style Guide

To ensure a consistent and professional look across the dashboard, all card-like UI components must follow these conventions:

- **Card Container:**

  - Use the `.card` class for all card components. This applies a white background, rounded corners, border, shadow, and padding.
  - Example: `<div className="card">...</div>`

- **Font Sizes & Typography:**

  - **Card Headers:** Use `text-lg font-semibold` for all card titles/headers.
  - **Main Values (e.g., metrics):** Use `text-3xl font-bold` for primary numbers or values.
  - **Sub-labels, Table Text, Details:** Use `text-sm` or `text-base` for supporting information, table rows, and sub-labels.
  - **Activity Titles, List Items:** Use `text-base font-medium` for list or activity titles.
  - **Consistency:** All font sizes should be set explicitly using Tailwind classes, not inherited or left to defaults.

- **Color & Accent:**

  - Use Tailwind color utility classes for semantic meaning (e.g., `text-green-600` for positive trends, `text-red-600` for negative trends).

- **Adding New Cards:**
  - All new card components must use the `.card` class and follow the above font size conventions.
  - For loading states, use skeleton components that visually match the loaded card's layout and font sizes.

This style guide helps maintain a cohesive and scalable UI as the dashboard grows.

## 🔧 Configuration

### Environment Variables

- `HUBSPOT_API_KEY`: Your HubSpot API key or Private App token
- See `.env.example` for all required variables and documentation.

### API Rate Limiting

The app includes built-in rate limiting to respect HubSpot's API limits:

- 100ms delay between requests
- 500ms delay between different data types
- Automatic retry on rate limit errors

## 🧪 Testing & Coverage

- **Run all tests:**
  ```bash
  npm test
  ```
- **Run tests with coverage report:**
  ```bash
  npm test -- --coverage
  ```
- **Test types:**
  - Unit tests for business logic (mocked, no real API calls)
  - Integration tests for API endpoints (with Next.js polyfills)
  - Component tests for UI
- **Testing Note:**
  - All tests now mock the service layer (e.g., `searchObjects`) instead of the SDK or raw HTTP, reflecting the new HTTP-based integration.
- **Coverage reports** are output in the terminal and as HTML in the `coverage/` directory.

## 📈 Performance

- **Server-side rendering** for fast initial loads
- **API response caching** to reduce API calls
- **Optimized bundle size** with tree shaking
- **Compression enabled** for faster loading
- **Efficient task metrics processing** for large datasets (3000+ tasks)
- **Optimized rendering logic** for consistent data display

## 🔧 Recent Optimizations

### Task & Deal Metrics Performance

- **Unified HTTP Approach**: All CRM objects (Tasks, Deals, Contacts, Companies) are now fetched using direct HTTP requests and the HubSpot Search API, with robust pagination and batching. The SDK is no longer used.
- **Large Dataset Handling**: Optimized for accounts with 3000+ tasks or deals
- **Batch Processing**: Objects are processed in memory-efficient batches
- **Filtered API Calls**: Uses HubSpot's filtering capabilities to reduce data transfer
- **Progress Logging**: Server logs show processing progress for large datasets

### Rendering Improvements

- **Consistent Data Display**: Fixed race conditions in loading states
- **Independent Loading States**: Task metrics load independently from main metrics
- **Graceful Fallbacks**: Handles API failures without breaking the dashboard
- **Real-time Updates**: Data appears as soon as it's available

### API Optimizations

- **Concurrent Requests**: Uses Promise.all for parallel API calls
- **Rate Limit Handling**: Built-in retry logic with exponential backoff
- **Error Recovery**: Graceful handling of API timeouts and failures

## 📝 Changelog

### [Unreleased]

- **Removed @hubspot/api-client SDK**: All HubSpot data is now fetched using direct HTTP requests (Axios) and the Search API, with robust pagination, batching, and rate limiting.
- **Unified Service Layer**: All business logic and tests now use the HTTP-based service layer for all CRM objects.
- **Test Updates**: Tests now mock the service layer (e.g., `searchObjects`) instead of the SDK or raw HTTP.

## 🔒 Security

- **Security headers** configured
- **Environment variables** for sensitive data
- **Input validation** on API endpoints
- **Rate limiting** to prevent abuse

## 🐛 Troubleshooting

### Common Issues

1. **401 Unauthorized Error**

   - Check your HubSpot API key/token
   - Ensure proper scopes are configured

2. **429 Rate Limit Error**

   - The app handles this automatically
   - Check logs for retry attempts

3. **Empty Dashboard**

   - Verify your HubSpot account has data
   - Check API permissions

4. **Task Metrics Showing 0 or Loading Slowly**

   - **Large datasets**: For accounts with 3000+ tasks, initial load may take 30-60 seconds
   - **Progress tracking**: Check server logs for processing progress
   - **Memory optimization**: The app processes tasks in batches to handle large datasets
   - **Caching**: Subsequent loads will be faster due to caching

5. **Inconsistent Data Display**

   - **Fixed**: Rendering logic now shows data as soon as it's available
   - **Independent loading**: Task metrics load separately from main metrics
   - **Refresh**: Try refreshing the page if data seems stale

6. **SWC/Babel Configuration Warnings**
   - **Normal**: These warnings appear due to Jest testing setup
   - **No impact**: Development and production builds work correctly
   - **Testing**: Babel is only used for Jest tests, not for the main application

### Debug Mode

Enable detailed logging by setting:

```env
DEBUG=true
```

**Console Debug Logs:**

- `[STORE]` - Store state changes and API calls
- `[DEBUG]` - Component state and data flow
- `[activity/metrics]` - Task metrics processing progress

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.

## Testing with ESM, TypeScript, and Jest

This project uses modern ESM-only dependencies (e.g., `p-limit`) and TypeScript. By default, Jest does not natively support ESM in node_modules, so the following setup is used:

- **Babel Transpilation:** A `babel.config.js` is provided to allow Jest to transpile both TypeScript and ESM JavaScript files, including ESM-only node_modules.
- **Jest Transform Settings:** The Jest config (`jest.config.js`) is set to:
  - Use `ts-jest` for `.ts`/`.tsx` files
  - Use `babel-jest` for `.js` files (including ESM node_modules)
  - Allowlist ESM node_modules (like `p-limit` and `yocto-queue`) for transformation
- **Why?** Some dependencies ship only as ESM, which Node.js and Next.js support natively, but Jest (as of v30) requires extra config to test them.

**Best Practices:**

- Keep Babel, Jest, and related presets up to date.
- If you add new ESM-only dependencies, add them to the `transformIgnorePatterns` allowlist in `jest.config.js`.
- For even better ESM support in the future, consider Vitest or Node's native test runner as they mature.

**Production Note:**

- This setup is only for testing. Your production build (Next.js/Node.js) runs ESM natively and does not use Babel at runtime.

## Scalability Roadmap: Caching

This project currently uses in-memory caching for performance. This is suitable for:

- Local development
- Single-instance deployments
- Early-stage or moderate-traffic production

### When to Add Distributed Caching (e.g., Redis)

Add Redis or another distributed cache when:

- You deploy to multiple server instances (horizontal scaling, serverless, containers)
- You notice cache misses or inconsistent data due to requests hitting different instances
- You want to persist cache across restarts or deployments
- You need to share cache between services (API, background jobs, etc.)

**How to Add Redis:**

1. Install a Redis client (e.g., `ioredis` or `node-redis`)
2. Replace in-memory cache logic with Redis get/set (with TTL)
3. Use cache keys that include query params, user, and time range
4. Optionally, set up cache warming or background pre-fetching for common queries

**Monitoring:**

- Track cache hit rates and API response times
- Add logging/alerts for slow queries or cache failures

**Note:**

- In-memory cache is fast and simple, but not shared between instances. Redis is recommended for production at scale.

---

**Built with ❤️ using Next.js and HubSpot API**
