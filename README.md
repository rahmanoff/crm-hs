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

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **HTTP Client**: Axios
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
│   └── hubspot.ts         # HubSpot API service
└── public/                # Static assets
```

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
- **Coverage reports** are output in the terminal and as HTML in the `coverage/` directory.

## 📈 Performance

- **Server-side rendering** for fast initial loads
- **API response caching** to reduce API calls
- **Optimized bundle size** with tree shaking
- **Compression enabled** for faster loading

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

### Debug Mode

Enable detailed logging by setting:

```env
DEBUG=true
```

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

---

**Built with ❤️ using Next.js and HubSpot API**
