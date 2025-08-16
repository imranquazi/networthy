# Creator Dashboard

A unified dashboard for content creators to track revenue and analytics across multiple platforms including YouTube, Twitch, TikTok, Instagram, and Kick.

## 🚀 Features

- **Multi-Platform Revenue Tracking**: Monitor earnings from YouTube, Twitch, TikTok, Instagram, and Kick in one place
- **Real-time Analytics**: View revenue trends, growth metrics, and platform performance
- **Interactive Charts**: Beautiful visualizations using Recharts
- **Responsive Design**: Modern UI that works on desktop and mobile
- **Platform Icons**: Easy-to-recognize platform branding
- **Growth Metrics**: Track follower/subscriber growth across platforms

## 🛠️ Tech Stack

### Backend
- **Node.js** (v18+) with Express.js
- **ES Modules** for modern JavaScript
- **CORS** enabled for cross-origin requests
- **RESTful API** endpoints

### Frontend
- **Next.js 15** with TypeScript
- **React 19** with modern hooks
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons

## 📦 Installation

### Prerequisites
- Node.js v18 or higher
- npm v10 or higher

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd creator-dashboard
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install --legacy-peer-deps
   ```

## 🚀 Running the Application

### Start the Backend Server
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:4000`

### Start the Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:3000`

## 🧪 Testing

### Backend Testing

#### Unit Tests
```bash
cd backend
npm test
```

#### Integration Tests
```bash
cd backend
npm run test:integration
```

#### End-to-End Tests
```bash
cd backend
npm run test:e2e
```

#### Test Coverage
```bash
cd backend
npm run test:coverage
```

### Frontend Testing

#### Unit Tests
```bash
cd frontend
npm test
```

#### End-to-End Tests (Playwright)
```bash
cd frontend
npm run test:e2e
```

#### E2E Tests with UI
```bash
cd frontend
npm run test:e2e:ui
```

### Test Structure

#### Backend Tests
```
backend/
├── tests/
│   ├── unit/
│   │   ├── auth.test.js          # Authentication tests
│   │   └── platform.test.js      # Platform management tests
│   ├── integration/
│   │   └── api.test.js           # API integration tests
│   └── e2e/
│       └── user-journey.test.js  # End-to-end user flows
├── jest.config.js                # Jest configuration
├── jest.e2e.config.js            # E2E test configuration
└── env.test                      # Test environment variables
```

#### Frontend Tests
```
frontend/
├── tests/
│   ├── unit/
│   │   └── components.test.tsx   # Component unit tests
│   └── e2e/
│       └── user-journey.spec.ts  # Playwright E2E tests
├── jest.config.js                # Jest configuration
└── playwright.config.ts          # Playwright configuration
```

### Test Types

#### Unit Tests
- **Backend**: Test individual service functions and utilities
- **Frontend**: Test React components in isolation
- **Coverage**: Test business logic, error handling, and edge cases

#### Integration Tests
- **API Endpoints**: Test complete request-response flows
- **Database Operations**: Test data persistence and retrieval
- **External API Integration**: Test platform API connections

#### End-to-End Tests
- **User Journeys**: Complete user workflows from registration to dashboard
- **Cross-Platform**: Test frontend-backend integration
- **Real Scenarios**: Test with actual browser interactions

### Test Environment Setup

#### Backend Test Environment
1. Create test database:
   ```sql
   CREATE DATABASE networthy_test;
   ```

2. Set up test environment variables in `backend/env.test`

3. Run database migrations for test database

#### Frontend Test Environment
1. Install Playwright browsers:
   ```bash
   cd frontend
   npx playwright install
   ```

2. Ensure backend is running for E2E tests

### Running Tests in CI/CD

#### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd backend && npm install
      - run: cd backend && npm test
      - run: cd backend && npm run test:integration
      - run: cd backend && npm run test:e2e

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm test
      - run: cd frontend && npm run test:e2e
```

### Test Best Practices

#### Writing Tests
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear test descriptions
3. **Isolation**: Each test should be independent
4. **Mocking**: Mock external dependencies appropriately
5. **Coverage**: Aim for high test coverage

#### Test Data
1. **Fixtures**: Use consistent test data
2. **Cleanup**: Clean up test data after tests
3. **Randomization**: Use unique identifiers to avoid conflicts

#### Performance
1. **Fast Execution**: Keep tests fast and efficient
2. **Parallel Execution**: Run tests in parallel when possible
3. **Resource Management**: Clean up resources properly

## 📊 API Endpoints

### Revenue Data
- `GET /api/revenue` - Returns revenue data for all platforms
- `GET /api/platforms` - Returns detailed platform statistics
- `GET /api/analytics` - Returns aggregated analytics data

### Authentication
- `GET /api/auth/status` - Returns authentication status

## 🎨 Dashboard Features

### Overview Cards
- **Total Revenue**: Combined earnings across all platforms
- **Total Followers**: Combined follower count across platforms
- **Total Views**: Combined view count across platforms
- **Growth Rate**: Overall growth percentage

### Platform Cards
Each platform displays:
- Platform icon and name
- Current follower/subscriber count
- Total views
- Estimated revenue
- Growth trend indicator

### Analytics Charts
- **Revenue Trends**: Line chart showing revenue over time
- **Platform Comparison**: Bar chart comparing platform performance
- **Growth Metrics**: Area chart showing follower growth

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Security Headers**: Helmet.js protection
- **Input Validation**: All inputs are validated
- **Error Handling**: Graceful error responses
- **CORS**: Configured for frontend access

## 📈 Data Flow

1. **Scheduled Updates**: Every 5 minutes, the system fetches fresh data from all connected platforms
2. **Caching**: Data is cached for 5 minutes to reduce API calls
3. **Fallback**: If APIs fail, the system returns cached data or mock data
4. **Real-time**: Manual refresh endpoint for immediate updates

## 🔍 Monitoring

### Health Check
```bash
curl http://localhost:4000/api/health
```

### Cache Statistics
```bash
curl http://localhost:4000/api/refresh
```

## 🚨 Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure all API keys are correctly set in `.env`
2. **Rate Limiting**: Check if you've exceeded API rate limits
3. **CORS Issues**: Ensure frontend URL is allowed in CORS settings
4. **Cache Issues**: Use `/api/refresh` to clear cache

### Debug Mode

Set `NODE_ENV=development` in your `.env` for detailed logging.

## 📝 Notes

- **Revenue Estimation**: Revenue is estimated based on views/followers since platforms don't provide direct revenue APIs
- **Growth Rates**: Growth rates are calculated based on historical data (placeholder for now)
- **API Limits**: Be aware of platform-specific API rate limits
- **Data Accuracy**: Real-time data depends on platform API availability

## 🔄 Updates

The system automatically updates data every 5 minutes. You can also manually trigger updates using the `/api/refresh` endpoint.

## 📚 Additional Resources

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Twitch API Documentation](https://dev.twitch.tv/docs/api/)
- [TikTok API Documentation](https://developers.tiktok.com/doc/)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)

## 🛡️ OAuth & Database Setup

### Environment Variables
Add the following to your `.env` file:

```
# PostgreSQL
PG_CONNECTION_STRING=postgresql://user:password@localhost:5432/networthy

# Google OAuth (YouTube)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback

# Twitch OAuth
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret
TWITCH_REDIRECT_URI=http://localhost:4000/api/auth/twitch/callback

# TikTok OAuth
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
TIKTOK_REDIRECT_URI=http://localhost:4000/api/auth/tiktok/callback
```

### Quickstart
1. Create a PostgreSQL database and user.
2. Register your app with Google, Twitch, and TikTok to obtain client IDs and secrets.
3. Set the above environment variables in your `.env` file.
4. Run database migrations (see below).
5. Start the backend server. 
