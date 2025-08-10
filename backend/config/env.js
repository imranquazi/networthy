import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation
const requiredEnvVars = {
  // Database
  PG_CONNECTION_STRING: 'Database connection string is required',
  
  // Security
  SESSION_SECRET: 'Session secret is required for security',
  ENCRYPTION_KEY: 'Encryption key is required for token storage',
  
  // OAuth - Google/YouTube
  GOOGLE_CLIENT_ID: 'Google OAuth client ID is required',
  GOOGLE_CLIENT_SECRET: 'Google OAuth client secret is required',
  YOUTUBE_API_KEY: 'YouTube API key is required',
  
  // OAuth - Twitch
  TWITCH_CLIENT_ID: 'Twitch OAuth client ID is required',
  TWITCH_CLIENT_SECRET: 'Twitch OAuth client secret is required',
  
  // OAuth - TikTok
  TIKTOK_CLIENT_KEY: 'TikTok OAuth client key is required',
  TIKTOK_CLIENT_SECRET: 'TikTok OAuth client secret is required',
  
  // Webhook Secrets
  YOUTUBE_WEBHOOK_SECRET: 'YouTube webhook secret is required',
  TWITCH_WEBHOOK_SECRET: 'Twitch webhook secret is required',
  TIKTOK_WEBHOOK_SECRET: 'TikTok webhook secret is required'
};

// Optional environment variables with defaults
const optionalEnvVars = {
  PORT: 4000,
  NODE_ENV: 'development',
  RATE_LIMIT_WINDOW_MS: 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
  LOG_LEVEL: 'info',
  LOG_FILE: 'logs/app.log',
  FRONTEND_URL: 'http://localhost:3000',
  CACHE_DURATION: 300000 // 5 minutes
};

// Validate required environment variables
function validateEnvironment() {
  const missingVars = [];
  
  for (const [varName, errorMessage] of Object.entries(requiredEnvVars)) {
    if (!process.env[varName]) {
      missingVars.push({ name: varName, message: errorMessage });
    }
  }
  
  if (missingVars.length > 0) {
    console.error('❌ Environment validation failed!');
    console.error('Missing required environment variables:');
    missingVars.forEach(({ name, message }) => {
      console.error(`  - ${name}: ${message}`);
    });
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    console.error('You can copy env.example to .env and fill in your values.');
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
}

// Get environment configuration
function getConfig() {
  const config = {
    // Server
    port: parseInt(process.env.PORT) || optionalEnvVars.PORT,
    nodeEnv: process.env.NODE_ENV || optionalEnvVars.NODE_ENV,
    isProduction: process.env.NODE_ENV === 'production',
    
    // Database
    database: {
      connectionString: process.env.PG_CONNECTION_STRING
    },
    
    // Security
    session: {
      secret: process.env.SESSION_SECRET,
      secure: false, // Allow cookies in development without HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // Use lax for development
      cookie: {
        secure: false, // Allow cookies in development without HTTPS
        httpOnly: true,
        sameSite: 'lax', // Use lax for development
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    },
    encryption: {
      key: process.env.ENCRYPTION_KEY
    },
    
    // Rate Limiting
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || optionalEnvVars.RATE_LIMIT_WINDOW_MS,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || optionalEnvVars.RATE_LIMIT_MAX_REQUESTS
    },
    
    // OAuth - Google/YouTube
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      apiKey: process.env.YOUTUBE_API_KEY
    },
    
    // OAuth - Twitch
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET
    },
    
    // OAuth - TikTok
    tiktok: {
      clientKey: process.env.TIKTOK_CLIENT_KEY,
      clientSecret: process.env.TIKTOK_CLIENT_SECRET
    },
    
    // Webhook Secrets
    webhooks: {
      youtube: process.env.YOUTUBE_WEBHOOK_SECRET,
      twitch: process.env.TWITCH_WEBHOOK_SECRET,
      tiktok: process.env.TIKTOK_WEBHOOK_SECRET
    },
    
    // Logging
    logging: {
      level: process.env.LOG_LEVEL || optionalEnvVars.LOG_LEVEL,
      file: process.env.LOG_FILE || optionalEnvVars.LOG_FILE
    },
    
    // CORS
    cors: {
      origin: process.env.FRONTEND_URL || optionalEnvVars.FRONTEND_URL,
      credentials: true
    },
    
    // Cache
    cache: {
      duration: parseInt(process.env.CACHE_DURATION) || optionalEnvVars.CACHE_DURATION
    }
  };
  
  return config;
}

export { validateEnvironment, getConfig }; 