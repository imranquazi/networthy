# Networthy Backend - Real API Integrations

This backend now supports real API integrations with YouTube, Twitch, TikTok, and Instagram to fetch actual creator statistics and analytics.

## 🚀 Features

- **Real API Integrations**: Connect to actual platform APIs
- **Caching System**: 5-minute cache to reduce API calls
- **Rate Limiting**: Protect against API abuse
- **Security**: Helmet.js for security headers
- **Scheduled Updates**: Automatic data refresh every 5 minutes
- **Error Handling**: Graceful fallbacks when APIs fail
- **Health Monitoring**: Built-in health check endpoints

## 📋 Prerequisites

- Node.js 18+ 
- API keys for the platforms you want to integrate

## 🔧 Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the environment template and configure your API keys:

```bash
cp env.example .env
```

Edit `.env` with your actual API keys:

```env
# YouTube API Configuration
YOUTUBE_API_KEY=your_youtube_api_key_here

# Twitch API Configuration
TWITCH_CLIENT_ID=your_twitch_client_id_here
TWITCH_CLIENT_SECRET=your_twitch_client_secret_here

# TikTok API Configuration
TIKTOK_CLIENT_KEY=your_tiktok_client_key_here
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret_here

# Instagram API Configuration
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_APP_ID=your_instagram_app_id_here
INSTAGRAM_APP_SECRET=your_instagram_app_secret_here
INSTAGRAM_REDIRECT_URI=http://localhost:3000/auth/instagram/callback

# Server Configuration
PORT=4000
NODE_ENV=development
```

### 3. API Key Setup

#### YouTube API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add the API key to your `.env` file

#### Twitch API
1. Go to [Twitch Developer Console](https://dev.twitch.tv/console)
2. Create a new application
3. Get Client ID and Client Secret
4. Add them to your `.env` file

#### TikTok API
1. Go to [TikTok for Developers](https://developers.tiktok.com/)
2. Create a new app
3. Get Client Key and Client Secret
4. Add them to your `.env` file

#### Instagram API
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Instagram Basic Display product
4. Get App ID and App Secret
5. Generate access token
6. Add them to your `.env` file

### 4. Start the Server

```bash
npm run dev
```

## 📊 API Endpoints

### Platform Management

- `GET /api/platforms` - Get all platform statistics
- `POST /api/platforms` - Connect a new platform
- `DELETE /api/platforms/:name` - Remove a platform
- `GET /api/platforms/:name/stats` - Get specific platform stats

### Analytics

- `GET /api/analytics` - Get aggregated analytics
- `POST /api/refresh` - Manually refresh all data

### System

- `GET /api/health` - Health check
- `GET /api/auth/status` - Authentication status

## 🔌 Adding Platforms

To connect a platform, send a POST request to `/api/platforms`:

```json
{
  "name": "youtube",
  "identifier": "UC_x5XG1OV2P6uZZ5FSM9Ttw"
}
```

### Supported Platforms

| Platform | Name | Identifier Type | Example |
|----------|------|-----------------|---------|
| YouTube | `youtube` | Channel ID | `UC_x5XG1OV2P6uZZ5FSM9Ttw` |
| Twitch | `twitch` | Username | `shroud` |
| TikTok | `tiktok` | Username | `charlidamelio` |
| Instagram | `instagram` | Username | `cristiano` |

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