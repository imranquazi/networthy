// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import compression from "compression";
import cron from "node-cron";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import passport from "passport";
import session from "express-session";
import { Pool } from 'pg';

import PlatformManager from "./services/platformManager.js";
import logger from "./utils/logger.js";

// Database connection
const pool = new Pool({ 
  connectionString: process.env.PG_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});
import { googleClient, setupTwitchPassport, getTikTokToken, storeToken, getToken } from "./services/authService.js";
import { createUser, findUserByEmail, findUserById, verifyUser, updateUserPlatforms, getUserPlatforms, deleteUser } from "./services/userService.js";
import { google } from 'googleapis';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MANUAL_REVENUE_PATH = path.join(__dirname, "manualRevenue.json");

const app = express();

// Trust proxy for Railway deployment (fixes rate limit issues)
app.set('trust proxy', 1);

// Simple request deduplication to prevent infinite loops
const requestCache = new Map();
const DEDUP_WINDOW = 500; // Reduce to 500ms for better responsiveness

const deduplicateRequests = (req, res, next) => {
  // Better user identification
  let userId = 'anonymous';
  
  // Try to get user ID from session first
  if (req.session?.user?.id) {
    userId = req.session.user.id;
  } else if (req.session?.user?.email) {
    userId = req.session.user.email;
  } else {
    // Try to get from token in query or header
    const authHeader = req.headers.authorization;
    const tokenParam = req.query.token;
    
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (tokenParam) {
      token = tokenParam;
    }
    
    if (token) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [email, timestamp] = decoded.split(':');
        const tokenTime = parseInt(timestamp);
        const currentTime = Date.now();
        if (currentTime - tokenTime <= 24 * 60 * 60 * 1000) {
          userId = email;
        }
      } catch (decodeError) {
        // Keep userId as 'anonymous'
      }
    }
  }
  
  const endpoint = req.path;
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  
  const lastRequest = requestCache.get(key);
  if (lastRequest && (now - lastRequest) < DEDUP_WINDOW) {
    logger.debug(`Deduplicating request: ${endpoint} for user ${userId} (${now - lastRequest}ms since last)`);
    // Instead of blocking, just skip the request and let it proceed
    // This prevents infinite loops while allowing legitimate requests
    return next();
  }
  
  requestCache.set(key, now);
  
  // Clean up old entries every 10 seconds
  if (Math.random() < 0.1) { // 10% chance on each request
    const cutoff = now - 10000; // 10 seconds
    for (const [cacheKey, timestamp] of requestCache.entries()) {
      if (timestamp < cutoff) {
        requestCache.delete(cacheKey);
      }
    }
  }
  
  next();
};

// Add platform-specific rate limiting
const platformRateLimits = new Map();
const PLATFORM_RATE_LIMITS = {
  youtube: { maxCalls: 100, windowMs: 60 * 60 * 1000 }, // 100 calls per hour
  twitch: { maxCalls: 800, windowMs: 60 * 60 * 1000 },  // 800 calls per hour
  tiktok: { maxCalls: 200, windowMs: 60 * 60 * 1000 }   // 200 calls per hour
};

function checkPlatformRateLimit(platform) {
  const now = Date.now();
  const limit = PLATFORM_RATE_LIMITS[platform];
  
  if (!limit) return true; // No limit set
  
  if (!platformRateLimits.has(platform)) {
    platformRateLimits.set(platform, { calls: 0, resetTime: now + limit.windowMs });
  }
  
  const rateLimit = platformRateLimits.get(platform);
  
  // Reset if window has passed
  if (now > rateLimit.resetTime) {
    rateLimit.calls = 0;
    rateLimit.resetTime = now + limit.windowMs;
  }
  
  // Check if limit exceeded
  if (rateLimit.calls >= limit.maxCalls) {
    console.warn(`⚠️ Rate limit exceeded for ${platform}: ${rateLimit.calls}/${limit.maxCalls} calls`);
    return false;
  }
  
  // Increment call count
  rateLimit.calls++;
  return true;
}

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration - more flexible for development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost origins
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:')) {
      return callback(null, true);
    }
    
    // Allow specific production domain if set
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    
    // Allow Vercel domains in production
    if (process.env.NODE_ENV === 'production' && origin && origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Allow networthy.link domains in production
    if (process.env.NODE_ENV === 'production' && origin && (origin.includes('networthy.link') || origin.includes('www.networthy.link'))) {
      return callback(null, true);
    }
    
    // Allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Log blocked origins for debugging
    logger.warn('CORS blocked origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Pragma'],
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Handle preflight requests for all API routes
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  let allowedOrigin = 'http://localhost:3000'; // default for development
  
  // Allow production domains
  if (process.env.NODE_ENV === 'production') {
    if (origin && (origin.includes('vercel.app') || origin.includes('networthy.link'))) {
      allowedOrigin = origin;
    }
  } else if (origin) {
    // In development, allow the requesting origin
    allowedOrigin = origin;
  }
  
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Rate limiting - more lenient for production
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : (parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 2000), // Increased to 2000 for production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Fix for Railway/production deployment
  trustProxy: true,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Apply rate limiting to most endpoints, but exclude auth endpoints and OPTIONS requests
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for authentication endpoints, health check, and OPTIONS requests
  if (req.path.startsWith('/auth/') || req.path === '/health' || req.method === 'OPTIONS') {
    return next();
  }
  return limiter(req, res, next);
});

// Separate, more lenient rate limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 4000, // Increased to 4000 requests per 15 minutes for auth
  message: 'Too many authentication requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Apply auth rate limiting specifically to auth endpoints
app.use('/api/auth/', authLimiter);

// Session configuration with proper store for production
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'networthy', 
  resave: false, 
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
};

// Initialize session store
const initializeSessionStore = async () => {
  if (process.env.NODE_ENV === 'production') {
    try {
      // Use dynamic import for ES modules compatibility
      const pgSimple = await import('connect-pg-simple');
      const pgSession = pgSimple.default(session);
      sessionConfig.store = new pgSession({
        conObject: {
          connectionString: process.env.PG_CONNECTION_STRING,
          ssl: { rejectUnauthorized: false }
        },
        tableName: 'sessions',
        // Add error handling for session store
        errorLog: (err) => {
          logger.error('Session store error:', err);
        }
      });
      logger.startup('Using PostgreSQL session store for production');
    } catch (error) {
      logger.warn('Failed to setup PostgreSQL session store, falling back to MemoryStore:', error.message);
      logger.warn('Install connect-pg-simple for production session storage');
    }
  } else {
    logger.startup('Using MemoryStore for development');
  }
  
  app.use(session(sessionConfig));
  app.use(passport.initialize());
  app.use(passport.session());
};

// Initialize session store
await initializeSessionStore();

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

setupTwitchPassport();

app.use(express.json());

// Persistent manual revenue overrides
let manualRevenueOverrides = {};

// Load manual revenue overrides on startup
if (fs.existsSync(MANUAL_REVENUE_PATH)) {
  try {
    manualRevenueOverrides = JSON.parse(fs.readFileSync(MANUAL_REVENUE_PATH, "utf-8"));
  } catch (e) {
    console.error("Failed to load manual revenue overrides:", e);
    manualRevenueOverrides = {};
  }
}

function saveManualRevenueOverrides() {
  fs.writeFileSync(MANUAL_REVENUE_PATH, JSON.stringify(manualRevenueOverrides, null, 2));
}

// Initialize platform manager
const platformManager = new PlatformManager();

// -------------------- Data Store (with real API integration) --------------------

// Store connected platforms
let connectedPlatforms = [
  // Example platforms - these would be set by user through UI
  // { name: 'youtube', identifier: 'UC_x5XG1OV2P6uZZ5FSM9Ttw' }, // Google Developers
  // { name: 'twitch', identifier: 'shroud' },
  // { name: 'tiktok', identifier: 'charlidamelio' },
  // { name: 'instagram', identifier: 'cristiano' }
];

// User-specific cache for platform data
const userPlatformCache = new Map();
const userAnalyticsCache = new Map();
const userLastUpdate = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Add platform-specific cache durations
const PLATFORM_CACHE_DURATIONS = {
  youtube: 10 * 60 * 1000, // 10 minutes (YouTube data changes less frequently)
  twitch: 3 * 60 * 1000,   // 3 minutes (Twitch data changes more frequently)
  tiktok: 5 * 60 * 1000    // 5 minutes (TikTok data changes moderately)
};

// Add cache validation function
function isCacheValid(userId, platform = null) {
  const lastUpdate = userLastUpdate.get(userId);
  if (!lastUpdate) return false;
  
  const now = Date.now();
  const cacheAge = now - lastUpdate;
  
  if (platform && PLATFORM_CACHE_DURATIONS[platform]) {
    return cacheAge < PLATFORM_CACHE_DURATIONS[platform];
  }
  
  return cacheAge < CACHE_DURATION;
}

// Default mock data for unauthenticated users
const defaultMockData = [
  { name: "YouTube", subscribers: 125000, views: 2500000, revenue: 1200, growth: 12.5 },
  { name: "Twitch", followers: 45000, viewers: 180000, revenue: 850, growth: 8.2 },
  { name: "TikTok", followers: 89000, views: 1200000, revenue: 430, growth: 15.7 }
];

// -------------------- Helper Functions --------------------

async function updatePlatformData(userId = null) {
  try {
    // Use global connected platforms
    const platformsToUse = connectedPlatforms;
    
    if (platformsToUse.length === 0) {
          logger.debug('No platforms connected, skipping update');
    return;
    }

    // Check if cache is still valid
    if (isCacheValid('global')) {
          logger.debug('Using cached platform data');
    return;
    }

    logger.info('Updating platform data from APIs...');
    const platformStats = await platformManager.getAllPlatformStats(platformsToUse);
    
    // Update global cache
    userPlatformCache.set('global', platformStats);
    userLastUpdate.set('global', Date.now());
    
    logger.info('Platform data updated successfully');
  } catch (error) {
    console.error('❌ Error updating platform data:', error.message);
  }
}

async function updateAnalyticsData(userId = null) {
  try {
    const userPlatformData = userPlatformCache.get('global');
    
    if (!userPlatformData || userPlatformData.length === 0) {
          logger.debug('No platform data available for analytics');
    return;
    }

    const analytics = await platformManager.calculateAnalytics(userPlatformData);
    userAnalyticsCache.set('global', analytics);
    
    logger.info('Analytics data updated successfully');
  } catch (error) {
    console.error('❌ Error updating analytics:', error.message);
  }
}



// Schedule data updates with smart intervals
cron.schedule('*/5 * * * *', async () => {
  logger.info('Scheduled data update started...');
  
  try {
    // Simple approach: just update global platform data
    await updatePlatformData();
    await updateAnalyticsData();
  } catch (error) {
    console.error('❌ Error in scheduled update:', error);
  }
});

// Add cache cleanup function
function cleanupExpiredCache() {
  const now = Date.now();
  const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
  
  // Clean up global cache
  const globalLastUpdate = userLastUpdate.get('global');
  if (globalLastUpdate && (now - globalLastUpdate > maxCacheAge)) {
    userPlatformCache.delete('global');
    userAnalyticsCache.delete('global');
    userLastUpdate.delete('global');
    logger.debug('Cleaned up expired global cache');
  }
  
  // Clean up platform rate limits (keep only recent ones)
  for (const [platform, rateLimit] of platformRateLimits.entries()) {
    if (now > rateLimit.resetTime + (24 * 60 * 60 * 1000)) {
      platformRateLimits.delete(platform);
    }
  }
}

// Schedule cache cleanup every hour
cron.schedule('0 * * * *', () => {
  logger.debug('Running cache cleanup...');
  cleanupExpiredCache();
});

// -------------------- User Management --------------------

// User registration
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Create new user in database
    const newUser = await createUser(email, password);
    
    // Set session
    req.session.user = { email: newUser.email, id: newUser.id };
    req.session.authenticated = true;
    
    res.json({ 
      success: true, 
      user: { email: newUser.email, id: newUser.id },
      message: 'Account created successfully' 
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message === 'User already exists') {
      return res.status(400).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Handle preflight requests for login
app.options("/api/auth/login", (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// User login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Verify user credentials
    const user = await verifyUser(email, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Set session
    req.session.user = { email: user.email, id: user.id };
    req.session.authenticated = true;
    
    // Generate a simple token for development (base64 encoded email:timestamp)
    const token = Buffer.from(`${user.email}:${Date.now()}`).toString('base64');
    
    // Set HTTP-only cookie for production security
    res.cookie('authToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // Stricter than 'lax' for better security
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });
    
    res.json({ 
      success: true, 
      user: { email: user.email, id: user.id },
      token: token, // Still return token for localStorage fallback
      message: 'Login successful' 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get("/api/auth/me", deduplicateRequests, async (req, res) => {
  console.log('Session data for /api/auth/me:', {
    sessionId: req.sessionID,
    authenticated: req.session.authenticated,
    user: req.session.user,
    sessionExists: !!req.session
  });
  
  // Check if session exists and has user data
  if (!req.session || !req.session.authenticated || !req.session.user) {
    console.log('Session authentication failed - trying token-based auth');
    
    // Fallback to token-based authentication
    const authHeader = req.headers.authorization;
    const tokenParam = req.query.token;
    
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (tokenParam) {
      token = tokenParam;
    }
    
    if (token) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [email, timestamp] = decoded.split(':');
        
        const tokenTime = parseInt(timestamp);
        const currentTime = Date.now();
        if (currentTime - tokenTime <= 24 * 60 * 60 * 1000) {
          const user = await findUserByEmail(email);
          if (user) {
            return res.json({
              authenticated: true,
              user: {
                id: user.id,
                email: user.email,
                connectedPlatforms: user.connected_platforms || []
              }
            });
          }
        }
      } catch (decodeError) {
        console.error('Token decode error:', decodeError);
      }
    }
    
    return res.status(401).json({ authenticated: false, error: 'Not authenticated' });
  }
  
  try {
    const user = await findUserById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ authenticated: false, error: 'User not found' });
    }
  
    console.log('User data for /api/auth/me:', {
      email: user.email,
      connectedPlatforms: user.connected_platforms
    });
  
    res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        connectedPlatforms: user.connected_platforms || []
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ authenticated: false, error: 'Failed to get user data' });
  }
});

// -------------------- API Endpoints --------------------

app.get("/api/auth/status", (req, res) => {
  res.json({ 
    authenticated: req.session.authenticated || false,
    user: req.session.user || null,
    connectedPlatforms: connectedPlatforms.length,
    lastUpdate: Date.now()
  });
});

app.get("/api/auth/status-token", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const tokenParam = req.query.token;
    
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (tokenParam) {
      token = tokenParam;
    }
    
    if (!token) {
      return res.json({ authenticated: false });
    }
    
    // Decode the token (simple base64 for development)
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [email, timestamp] = decoded.split(':');
      
      // Check if token is not expired (24 hours)
      const tokenTime = parseInt(timestamp);
      const currentTime = Date.now();
      if (currentTime - tokenTime > 24 * 60 * 60 * 1000) {
        return res.json({ authenticated: false });
      }
      
      // Find user by email
      const user = await findUserByEmail(email);
      if (user) {
        return res.json({ 
          authenticated: true, 
          user: { email: user.email, platform: user.connected_platforms || [] }
        });
      }
    } catch (decodeError) {
      console.error('Token decode error:', decodeError);
    }
    
    res.json({ authenticated: false });
  } catch (error) {
    console.error('Status token error:', error);
    res.json({ authenticated: false });
  }
});

app.get("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Logout failed' });
    } else {
      // Clear the session cookie with same settings as session
      res.clearCookie('connect.sid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      // Clear the auth token cookie
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      res.json({ success: true });
    }
  });
});

// Delete account endpoint
app.delete("/api/auth/delete-account", async (req, res) => {
  try {
    // Check if user is authenticated via session or token
    let userEmail = null;
    let userId = null;
    
    // First try session-based authentication
    if (req.session.authenticated && req.session.user) {
      userEmail = req.session.user.email;
      userId = req.session.user.id;
    } else {
      // Try token-based authentication
      const authHeader = req.headers.authorization;
      const tokenParam = req.query.token;
      
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (tokenParam) {
        token = tokenParam;
      }
      
      if (token) {
        try {
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
          const [email, timestamp] = decoded.split(':');
          
          // Check if token is not expired (24 hours)
          const tokenTime = parseInt(timestamp);
          const currentTime = Date.now();
          if (currentTime - tokenTime <= 24 * 60 * 60 * 1000) {
            userEmail = email;
            // Find user ID from database
            const user = await findUserByEmail(email);
            if (user) {
              userId = user.id;
            }
          }
        } catch (decodeError) {
          console.error('Token decode error:', decodeError);
        }
      }
    }
    
    if (!userEmail || !userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Delete user and all associated data
    const success = await deleteUser(userId, userEmail);
    
    if (success) {
      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
      });
      
      // Clear all cookies
      res.clearCookie('connect.sid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      
      res.clearCookie('authToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });
      
      res.json({ success: true, message: 'Account deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete account' });
    }
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Delete account failed' });
  }
});

// Google OAuth (YouTube)
app.get("/api/auth/google", async (req, res) => {
  // Check if user is authenticated via session or token
  let userEmail = null;
  let userId = null;
  
  // First try session-based authentication
  if (req.session.authenticated && req.session.user) {
    userEmail = req.session.user.email;
    userId = req.session.user.id;
  } else {
    // Try token-based authentication
    const authHeader = req.headers.authorization;
    const tokenParam = req.query.token;
    
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (tokenParam) {
      token = tokenParam;
    }
    
    if (token) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [email, timestamp] = decoded.split(':');
        
        // Check if token is not expired (24 hours)
        const tokenTime = parseInt(timestamp);
        const currentTime = Date.now();
        if (currentTime - tokenTime <= 24 * 60 * 60 * 1000) {
          userEmail = email;
          // Find user ID from database
          const user = await findUserByEmail(email);
          if (user) {
            userId = user.id;
          }
        }
      } catch (decodeError) {
        console.error('Token decode error:', decodeError);
      }
    }
  }
  
  if (!userEmail || !userId) {
    return res.redirect('http://localhost:3000/login?error=not_logged_in');
  }
  
  // Store the user's info in a state parameter
  const state = Buffer.from(JSON.stringify({
    userId: userId,
    email: userEmail,
    timestamp: Date.now()
  })).toString('base64');
  
  const url = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube.readonly", "email", "profile"],
    prompt: "consent",
    state: state
  });
  res.redirect(url);
});

app.get("/api/auth/google/callback", async (req, res) => {
  const { code, state } = req.query;
  try {
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);
    // Get user email
    const oauth2 = googleClient;
    const userinfo = await oauth2.request({ url: 'https://www.googleapis.com/oauth2/v2/userinfo' });
    const email = userinfo.data.email;
    
    // Get user info from state parameter instead of session
    let userInfo;
    try {
      if (state) {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
        userInfo = decodedState;
        logger.debug('Google OAuth state decoded:', userInfo);
      } else {
        console.error('No state parameter in Google OAuth callback');
        return res.redirect('http://localhost:3000/login?error=google_oauth_failed');
      }
    } catch (stateError) {
      console.error('Error decoding Google OAuth state:', stateError);
      return res.redirect('http://localhost:3000/login?error=google_oauth_failed');
    }
    
    // Store token for the user from state parameter
    await storeToken(userInfo.email, 'youtube', tokens);
    
    // Get user's YouTube channel info
    const youtubeClient = google.youtube({ version: 'v3', auth: googleClient });
    const channelsResponse = await youtubeClient.channels.list({
      part: 'snippet,statistics',
      mine: true
    });
    
    const channelId = channelsResponse.data.items?.[0]?.id;
    const channelTitle = channelsResponse.data.items?.[0]?.snippet?.title;
    
    // Add platform to user's connected platforms
    const user = await findUserByEmail(userInfo.email);
    if (user) {
      const connectedPlatforms = user.connected_platforms || [];
      if (!connectedPlatforms.find(p => p.name === 'youtube')) {
        connectedPlatforms.push({ 
          name: 'youtube', 
          identifier: channelId || 'authenticated_user',
          title: channelTitle || 'YouTube Channel'
        });
        await updateUserPlatforms(user.id, connectedPlatforms);
        logger.info('Added YouTube platform to user:', user.email, 'Platforms:', connectedPlatforms);
      }
    }
    
    // Update platform data immediately
    await updatePlatformData(user.id);
    await updateAnalyticsData(user.id);
    
    // Redirect to frontend dashboard
    res.redirect('http://localhost:3000/dashboard?platform=youtube&email=' + encodeURIComponent(userInfo.email));
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect('http://localhost:3000/login?error=google_oauth_failed');
  }
});

// Twitch OAuth
app.get("/api/auth/twitch", async (req, res, next) => {
  // Check if user is authenticated via session or token
  let userEmail = null;
  let userId = null;
  
  // First try session-based authentication
  if (req.session.authenticated && req.session.user) {
    userEmail = req.session.user.email;
    userId = req.session.user.id;
  } else {
    // Try token-based authentication
    const authHeader = req.headers.authorization;
    const tokenParam = req.query.token;
    
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (tokenParam) {
      token = tokenParam;
    }
    
    if (token) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [email, timestamp] = decoded.split(':');
        
        // Check if token is not expired (24 hours)
        const tokenTime = parseInt(timestamp);
        const currentTime = Date.now();
        if (currentTime - tokenTime <= 24 * 60 * 60 * 1000) {
          userEmail = email;
          // Find user ID from database
          const user = await findUserByEmail(email);
          if (user) {
            userId = user.id;
          }
        }
      } catch (decodeError) {
        console.error('Token decode error:', decodeError);
      }
    }
  }
  
  if (!userEmail || !userId) {
    return res.redirect('http://localhost:3000/login?error=not_logged_in');
  }
  
  // Store the user's info in a state parameter
  const state = Buffer.from(JSON.stringify({
    userId: userId,
    email: userEmail,
    timestamp: Date.now()
  })).toString('base64');
  
  // Add state to the OAuth request
  passport.authenticate("twitch", { 
    scope: ["user:read:email", "analytics:read:games", "channel:read:subscriptions"],
    state: state
  })(req, res, next);
});

app.get("/api/auth/twitch/callback", passport.authenticate("twitch", { failureRedirect: "http://localhost:3000/login?error=twitch_oauth_failed" }), async (req, res) => {
  try {
    logger.debug('Twitch callback - req.user:', req.user);
    logger.debug('Twitch callback - state:', req.query.state);
    
    if (!req.user) {
      console.error('No user data in Twitch callback');
      return res.redirect('http://localhost:3000/login?error=twitch_oauth_failed');
    }
    
    const { accessToken, refreshToken, profile } = req.user;
    logger.debug('Twitch tokens received:', { accessToken: !!accessToken, refreshToken: !!refreshToken, profile: !!profile });
    
    if (!profile || !profile.email) {
      console.error('No email in Twitch profile:', profile);
      return res.redirect('http://localhost:3000/login?error=twitch_oauth_failed');
    }
    
    // Get user info from state parameter instead of session
    let userInfo;
    try {
      if (req.query.state) {
        userInfo = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
        logger.info('Retrieved user info from state:', userInfo.email);
      } else {
        throw new Error('No state parameter');
      }
    } catch (error) {
      console.error('Failed to parse state parameter:', error.message);
      return res.redirect('http://localhost:3000/login?error=state_invalid');
    }
    
    // Check if state is not too old (5 minutes max)
    if (Date.now() - userInfo.timestamp > 5 * 60 * 1000) {
      console.error('State parameter is too old');
      return res.redirect('http://localhost:3000/login?error=state_expired');
    }
    
    logger.debug('Storing Twitch token for user from state:', userInfo.email);
    
    await storeToken(userInfo.email, 'twitch', { accessToken, refreshToken });
    
    // Get user's Twitch channel info
    const twitchUser = profile.login; // Twitch username
    
    // Add platform to user's connected platforms
    const user = await findUserByEmail(userInfo.email);
    if (user) {
      const connectedPlatforms = user.connected_platforms || [];
      if (!connectedPlatforms.find(p => p.name === 'twitch')) {
        connectedPlatforms.push({ 
          name: 'twitch', 
          identifier: twitchUser || 'authenticated_user',
          title: profile.display_name || 'Twitch Channel'
        });
        await updateUserPlatforms(user.id, connectedPlatforms);
        logger.info('Added Twitch platform to user:', user.email, 'Platforms:', connectedPlatforms);
      }
    }
    
    logger.debug('User connected platforms after Twitch:', user && user.connected_platforms);
    
    // Update platform data immediately
    await updatePlatformData(user.id);
    await updateAnalyticsData(user.id);
    
    logger.info('Redirecting to dashboard with Twitch data');
    // Redirect to frontend dashboard
    res.redirect('http://localhost:3000/dashboard?platform=twitch&email=' + encodeURIComponent(userInfo.email));
  } catch (err) {
    console.error('Twitch OAuth error:', err);
    console.error('Error stack:', err.stack);
    res.redirect('http://localhost:3000/login?error=twitch_oauth_failed');
  }
});

// TikTok OAuth
app.get("/api/auth/tiktok", async (req, res) => {
  // Check if user is authenticated via session or token
  let userEmail = null;
  let userId = null;
  
  // First try session-based authentication
  if (req.session.authenticated && req.session.user) {
    userEmail = req.session.user.email;
    userId = req.session.user.id;
  } else {
    // Try token-based authentication
    const authHeader = req.headers.authorization;
    const tokenParam = req.query.token;
    
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (tokenParam) {
      token = tokenParam;
    }
    
    if (token) {
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf-8');
        const [email, timestamp] = decoded.split(':');
        
        // Check if token is not expired (24 hours)
        const tokenTime = parseInt(timestamp);
        const currentTime = Date.now();
        if (currentTime - tokenTime <= 24 * 60 * 60 * 1000) {
          userEmail = email;
          // Find user ID from database
          const user = await findUserByEmail(email);
          if (user) {
            userId = user.id;
          }
        }
      } catch (decodeError) {
        console.error('Token decode error:', decodeError);
      }
    }
  }
  
  if (!userEmail || !userId) {
    return res.redirect('http://localhost:3000/login?error=not_logged_in');
  }
  
  // Store the user's info in a state parameter
  const state = Buffer.from(JSON.stringify({
    userId: userId,
    email: userEmail,
    timestamp: Date.now()
  })).toString('base64');
  
  const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&response_type=code&scope=user.info.basic,video.list,video.stats&redirect_uri=${encodeURIComponent(process.env.TIKTOK_REDIRECT_URI)}&state=${encodeURIComponent(state)}`;
  res.redirect(url);
});

app.get("/api/auth/tiktok/callback", async (req, res) => {
  const { code, state } = req.query;
  try {
    const tokenData = await getTikTokToken(code);
    
    // Get user info from state parameter
    let userInfo;
    try {
      if (state) {
        userInfo = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
        logger.debug('TikTok OAuth state decoded:', userInfo);
      } else {
        console.error('No state parameter in TikTok OAuth callback');
        return res.redirect('http://localhost:3000/login?error=tiktok_oauth_failed');
      }
    } catch (stateError) {
      console.error('Error decoding TikTok OAuth state:', stateError);
      return res.redirect('http://localhost:3000/login?error=tiktok_oauth_failed');
    }
    
    // Store token for the user from state parameter
    await storeToken(userInfo.email, 'tiktok', tokenData);
    
    // Get user's TikTok info (if available in token data)
    const tiktokUser = tokenData.open_id || 'authenticated_user';
    
    // Add platform to user's connected platforms
    const user = await findUserByEmail(userInfo.email);
    if (user) {
      const connectedPlatforms = user.connected_platforms || [];
      if (!connectedPlatforms.find(p => p.name === 'tiktok')) {
        connectedPlatforms.push({ 
          name: 'tiktok', 
          identifier: tiktokUser,
          title: 'TikTok Account'
        });
        await updateUserPlatforms(user.id, connectedPlatforms);
        logger.info('Added TikTok platform to user:', user.email, 'Platforms:', connectedPlatforms);
      }
    }
    
    // Update platform data immediately
    await updatePlatformData(user.id);
    await updateAnalyticsData(user.id);
    
    // Redirect to frontend dashboard
    res.redirect('http://localhost:3000/dashboard?platform=tiktok&email=' + encodeURIComponent(userInfo.email));
  } catch (err) {
    console.error('TikTok OAuth error:', err);
    res.redirect('http://localhost:3000/login?error=tiktok_oauth_failed');
  }
});

// Platform Management
app.get("/api/platforms", deduplicateRequests, async (req, res) => {
  let userConnectedPlatforms = [];
  let user = null;
  try {
    // If user is authenticated, fetch their tokens
    let userTokens = {};
    
          // First try session-based authentication
      if (req.session && req.session.user && req.session.user.email) {
        logger.debug('Session user:', req.session.user);
        user = await findUserByEmail(req.session.user.email);
        logger.debug('Found user:', user ? user.email : 'not found');
        if (user) {
          userConnectedPlatforms = user.connected_platforms || [];
          logger.debug('User connected platforms:', userConnectedPlatforms);
        }
        
        const [youtubeToken, twitchToken, tiktokToken] = await Promise.all([
          getToken(req.session.user.email, 'youtube').catch(() => null),
          getToken(req.session.user.email, 'twitch').catch(() => null),
          getToken(req.session.user.email, 'tiktok').catch(() => null)
        ]);
        
        if (youtubeToken) userTokens.youtube = youtubeToken;
        if (twitchToken) userTokens.twitch = twitchToken;
        if (tiktokToken) userTokens.tiktok = tiktokToken;
        
        logger.debug('User tokens found:', Object.keys(userTokens));
    } else {
      // Try token-based authentication
      const authHeader = req.headers.authorization;
      const tokenParam = req.query.token;
      
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (tokenParam) {
        token = tokenParam;
      }
      
      if (token) {
        try {
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
          const [email, timestamp] = decoded.split(':');
          
          // Check if token is not expired (24 hours)
          const tokenTime = parseInt(timestamp);
          const currentTime = Date.now();
          if (currentTime - tokenTime <= 24 * 60 * 60 * 1000) {
            user = await findUserByEmail(email);
            logger.debug('Token user:', user ? user.email : 'not found');
            if (user) {
              userConnectedPlatforms = user.connected_platforms || [];
              logger.debug('User connected platforms:', userConnectedPlatforms);
              
              const [youtubeToken, twitchToken, tiktokToken] = await Promise.all([
                getToken(email, 'youtube').catch(() => null),
                getToken(email, 'twitch').catch(() => null),
                getToken(email, 'tiktok').catch(() => null)
              ]);
              
              if (youtubeToken) userTokens.youtube = youtubeToken;
              if (twitchToken) userTokens.twitch = twitchToken;
              if (tiktokToken) userTokens.tiktok = tiktokToken;
              
              logger.debug('User tokens found:', Object.keys(userTokens));
            }
          }
        } catch (decodeError) {
          console.error('Token decode error:', decodeError);
        }
      }
    }

    // Get user-specific cache data
    const userId = user ? user.id : null;
    const userCacheKey = userId || 'anonymous';
    
    // Check if cache is stale or if user has connected platforms (force refresh)
    const forceRefresh = req.query.refresh === 'true';
    const userLastUpdateTime = userLastUpdate.get(userCacheKey) || 0;
    const shouldRefresh = !userLastUpdateTime || 
                         Date.now() - userLastUpdateTime > CACHE_DURATION ||
                         userConnectedPlatforms.length > 0 ||
                         forceRefresh;
    
    logger.debug('Should refresh:', shouldRefresh);
    logger.debug('User connected platforms length:', userConnectedPlatforms.length);
    
    if (shouldRefresh) {
      // For platforms with user tokens, pass them to PlatformManager
      const platformsWithTokens = [];
      const platformsWithoutTokens = [];
      
      // Use user's connected platforms if authenticated, otherwise use global connectedPlatforms
      const platformsToCheck = userConnectedPlatforms.length > 0 ? userConnectedPlatforms : connectedPlatforms;
      
      for (const platform of platformsToCheck) {
        const platformName = platform.name.toLowerCase();
        if (userTokens[platformName]) {
          platformsWithTokens.push({ ...platform, token: userTokens[platformName] });
        } else {
          platformsWithoutTokens.push(platform);
        }
      }
      
      if (platformsWithTokens.length > 0) {
        // Get stats for platforms with user tokens - handle API quota errors gracefully
        const authenticatedStats = await Promise.allSettled(
          platformsWithTokens.map(async (platform) => {
            const platformName = platform.name.toLowerCase();
            try {
              if (platformName === 'youtube') {
                return await platformManager.services.youtube.getChannelStats(platform.identifier, platform.token.access_token, user.id);
              } else if (platformName === 'twitch') {
                return await platformManager.services.twitch.getChannelStats(platform.identifier, platform.token.accessToken, user.id);
              } else if (platformName === 'tiktok') {
                return await platformManager.services.tiktok.getCreatorStats(platform.identifier, user.id);
              }
            } catch (error) {
              console.error(`Error fetching ${platformName} data:`, error.message);
              // Return empty data for this platform if API fails
              return {
                name: platform.name,
                subscribers: 0,
                followers: 0,
                views: 0,
                viewers: 0,
                revenue: 0,
                growth: 0,
                channelId: platform.identifier,
                channelName: platform.title || platform.name,
                error: error.message
              };
            }
          })
        );
        
        // Extract successful results and handle failed ones
        const successfulStats = authenticatedStats
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
        
        const failedStats = authenticatedStats
          .filter(result => result.status === 'rejected')
          .map((result, index) => {
            const platform = platformsWithTokens[index];
            return {
              name: platform.name,
              subscribers: 0,
              followers: 0,
              views: 0,
              viewers: 0,
              revenue: 0,
              growth: 0,
              channelId: platform.identifier,
              channelName: platform.title || platform.name,
              error: result.reason?.message || 'API request failed'
            };
          });
        
        const allStats = [...successfulStats, ...failedStats];
        
        // Get stats for platforms without tokens
        const otherStats = platformsWithoutTokens.length > 0 
          ? await platformManager.getAllPlatformStats(platformsWithoutTokens, user.id)
          : [];
        
        const newData = [...allStats, ...otherStats];
        userPlatformCache.set(userCacheKey, newData);
        userLastUpdate.set(userCacheKey, Date.now());
        logger.debug('Updated user cache with authenticated data:', newData);
      } else if (userConnectedPlatforms.length > 0) {
        // User has connected platforms but no tokens yet - return empty data for those platforms
        const emptyData = userConnectedPlatforms.map(platform => ({
          name: platform.name,
          subscribers: 0,
          followers: 0,
          views: 0,
          viewers: 0,
          revenue: 0,
          growth: 0
        }));
        userPlatformCache.set(userCacheKey, emptyData);
        userLastUpdate.set(userCacheKey, Date.now());
        logger.debug('Updated user cache with empty data for connected platforms:', emptyData);
      } else {
        // No user platforms connected - use mock data
        await updatePlatformData(userId);
      }
    }
    
    // Get data from user-specific cache
    let data = userPlatformCache.get(userCacheKey);
    
    // If no cached data, use default mock data for unauthenticated users
    if (!data) {
      data = defaultMockData;
    }
    
    // Inject manual revenue overrides
    data = data.map(platform => {
      if (manualRevenueOverrides[platform.name]) {
        return { ...platform, revenue: manualRevenueOverrides[platform.name] };
      }
      return platform;
    });
    
    logger.debug('Returning platform data for user:', userCacheKey, data);
    res.json(data);
  } catch (error) {
    console.error('Error fetching platforms:', error);
      logger.debug('User connected platforms in catch:', userConnectedPlatforms);
      // Always return an array for the frontend
      if (userConnectedPlatforms && userConnectedPlatforms.length > 0) {
        const emptyData = userConnectedPlatforms.map(platform => ({
          name: platform.name,
          subscribers: 0,
          followers: 0,
          views: 0,
          viewers: 0,
          revenue: 0,
          growth: 0
        }));
        logger.debug('Returning empty data due to error:', emptyData);
        res.json(emptyData);
      } else {
        // Return default mock data for unauthenticated users
        res.json(defaultMockData);
      }
  }
});

app.post("/api/platforms", async (req, res) => {
  try {
    const { name, identifier } = req.body;
    
    if (!name || !identifier) {
      return res.status(400).json({ error: 'Platform name and identifier are required' });
    }

    // Test the platform connection
    try {
      await platformManager.getPlatformStats(name, identifier);
    } catch (error) {
      return res.status(400).json({ error: `Failed to connect to ${name}: ${error.message}` });
    }

    // Add to connected platforms
    const existingIndex = connectedPlatforms.findIndex(p => p.name === name);
    if (existingIndex >= 0) {
      connectedPlatforms[existingIndex] = { name, identifier };
    } else {
      connectedPlatforms.push({ name, identifier });
    }

    // Update data immediately
    await updatePlatformData();
    await updateAnalyticsData();

    res.json({ 
      success: true, 
      message: `${name} platform connected successfully`,
      data: "Platform connected successfully" 
    });
  } catch (error) {
    console.error('Error adding platform:', error);
    res.status(500).json({ error: 'Failed to add platform' });
  }
});

app.delete("/api/platforms/:name", async (req, res) => {
  try {
    const { name } = req.params;
    connectedPlatforms = connectedPlatforms.filter(p => p.name !== name);
    
    await updatePlatformData();
    await updateAnalyticsData();

    res.json({ 
      success: true, 
      message: `${name} platform removed successfully` 
    });
  } catch (error) {
    console.error('Error removing platform:', error);
    res.status(500).json({ error: 'Failed to remove platform' });
  }
});

// New endpoint: Set manual revenue for a platform
app.post("/api/platforms/:name/revenue", async (req, res) => {
  try {
    const { name } = req.params;
    const { revenue } = req.body;
    if (typeof revenue !== "number" || revenue < 0) {
      return res.status(400).json({ error: "Revenue must be a non-negative number" });
    }
    
    // Add safety check for extremely high values
    if (revenue > 1000000000) { // 1 billion limit
      return res.status(400).json({ error: "Revenue cannot exceed 1,000,000,000" });
    }
    manualRevenueOverrides[name] = revenue;
    saveManualRevenueOverrides();
    
    // Clear all caches to ensure manual revenue changes are reflected immediately
    userPlatformCache.clear();
    userLastUpdate.clear();
    platformManager.clearCache();
    
    // Update cache immediately for all users
    for (const [userKey, userData] of userPlatformCache.entries()) {
      const updatedData = userData.map(platform =>
        platform.name === name ? { ...platform, revenue } : platform
      );
      userPlatformCache.set(userKey, updatedData);
    }
    
    await updateAnalyticsData();
    res.json({ success: true, revenue });
  } catch (error) {
    console.error("Error setting manual revenue:", error);
    res.status(500).json({ error: "Failed to set manual revenue" });
  }
});

// Analytics
app.get("/api/analytics", async (req, res) => {
  try {
    // Get user authentication (session or token-based)
    let user = null;
    let userConnectedPlatforms = [];
    
    // Try session-based authentication first
    if (req.session && req.session.user && req.session.user.email) {
      user = await findUserByEmail(req.session.user.email);
      if (user) {
        userConnectedPlatforms = user.connected_platforms || [];
      }
    } else {
      // Try token-based authentication
      const authHeader = req.headers.authorization;
      const tokenParam = req.query.token;
      
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (tokenParam) {
        token = tokenParam;
      }
      
      if (token) {
        try {
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
          const [email, timestamp] = decoded.split(':');
          
          const tokenTime = parseInt(timestamp);
          const currentTime = Date.now();
          if (currentTime - tokenTime <= 24 * 60 * 60 * 1000) {
            user = await findUserByEmail(email);
            if (user) {
              userConnectedPlatforms = user.connected_platforms || [];
            }
          }
        } catch (decodeError) {
          console.error('Token decode error:', decodeError);
        }
      }
    }
    
    // Get user-specific cache data
    const userId = user ? user.id : null;
    const userCacheKey = userId || 'anonymous';
    
    // Get platform data from user-specific cache
    let platformData = userPlatformCache.get(userCacheKey);
    
    // If no cached data, fetch it using the same logic as the platforms endpoint
    if (!platformData) {
      // Use the same logic as the platforms endpoint
      if (userConnectedPlatforms.length > 0) {
        // User has connected platforms, fetch real data
        try {
          platformData = await platformManager.getAllPlatformStats(userConnectedPlatforms, userId);
          // Cache the result
          userPlatformCache.set(userCacheKey, platformData);
          userLastUpdate.set(userCacheKey, Date.now());
        } catch (error) {
          console.error('Error fetching platform data for analytics:', error);
          platformData = defaultMockData;
        }
      } else {
        // No connected platforms, use default mock data
        platformData = defaultMockData;
      }
    }
    
    // Apply manual revenue overrides to platform data before calculating analytics
    const platformDataWithOverrides = platformData.map(platform => {
      if (manualRevenueOverrides[platform.name]) {
        return { ...platform, revenue: manualRevenueOverrides[platform.name] };
      }
      return platform;
    });
    
    // Calculate analytics based on the platform data with manual overrides
    const analytics = await platformManager.calculateAnalytics(platformDataWithOverrides, userId);
    
    console.log('GET /api/analytics returning monthlyTrend:', analytics.monthlyTrend);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});

// Analytics cache version - increment this when trend calculation logic changes
const ANALYTICS_CACHE_VERSION = 'v2'; // Changed from v1 due to trend calculation fix

// Clear analytics cache to fix trend calculation issues
app.post("/api/cache/clear-analytics", async (req, res) => {
  try {
    platformManager.clearAnalyticsCache();
    res.json({ success: true, message: 'Analytics cache cleared. Next request will use new trend calculation.' });
  } catch (error) {
    console.error('Error clearing analytics cache:', error);
    res.status(500).json({ error: 'Failed to clear analytics cache' });
  }
});

// Recalculate analytics with custom platform data
app.post("/api/analytics", async (req, res) => {
  try {
    console.log('POST /api/analytics called with platforms:', req.body.platforms?.length || 0);
    const { platforms } = req.body;
    
    if (!platforms || !Array.isArray(platforms)) {
      return res.status(400).json({ error: 'Platforms data is required and must be an array' });
    }
    
    // Get user authentication (session or token-based)
    let user = null;
    
    // Try session-based authentication first
    if (req.session && req.session.user && req.session.user.email) {
      user = await findUserByEmail(req.session.user.email);
    } else {
      // Try token-based authentication
      const authHeader = req.headers.authorization;
      const tokenParam = req.query.token;
      
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      } else if (tokenParam) {
        token = tokenParam;
      }
      
      if (token) {
        try {
          const decoded = Buffer.from(token, 'base64').toString('utf-8');
          const [email, timestamp] = decoded.split(':');
          
          const tokenTime = parseInt(timestamp);
          const currentTime = Date.now();
          if (currentTime - tokenTime <= 24 * 60 * 60 * 1000) {
            user = await findUserByEmail(email);
          }
        } catch (decodeError) {
          console.error('Token decode error:', decodeError);
        }
      }
    }
    
    const userId = user ? user.id : null;
    
    // Apply manual revenue overrides to platform data before calculating analytics
    const platformsWithOverrides = platforms.map(platform => {
      if (manualRevenueOverrides[platform.name]) {
        return { ...platform, revenue: manualRevenueOverrides[platform.name] };
      }
      return platform;
    });
    
    // Calculate analytics based on the provided platform data with manual overrides
    const analytics = await platformManager.calculateAnalytics(platformsWithOverrides, userId);
    
    console.log('POST /api/analytics returning monthlyTrend:', analytics.monthlyTrend);
    res.json(analytics);
  } catch (error) {
    console.error('Error recalculating analytics:', error);
    res.status(500).json({ error: 'Failed to recalculate analytics data' });
  }
});

// Manual data refresh
app.post("/api/refresh", async (req, res) => {
  try {
    await updatePlatformData();
    await updateAnalyticsData();
    platformManager.clearCache();
    
    res.json({ 
      success: true, 
      message: 'Data refreshed successfully',
      cacheStats: platformManager.getCacheStats()
    });
  } catch (error) {
    console.error('Error refreshing data:', error);
    res.status(500).json({ error: 'Failed to refresh data' });
  }
});

// Platform-specific endpoints
app.get("/api/platforms/:name/stats", async (req, res) => {
  try {
    const { name } = req.params;
    const { identifier } = req.query;
    
    if (!identifier) {
      return res.status(400).json({ error: 'Platform identifier is required' });
    }

    const stats = await platformManager.getPlatformStats(name, identifier);
    res.json(stats);
  } catch (error) {
    console.error(`Error fetching ${req.params.name} stats:`, error);
    res.status(500).json({ error: `Failed to fetch ${req.params.name} data` });
  }
});



// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connectedPlatforms: connectedPlatforms.length,
    cacheStats: platformManager.getCacheStats(),
    lastUpdate: Date.now()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  // Check if headers have already been sent
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  // Check if headers have already been sent
  if (res.headersSent) {
    return;
  }
  
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  logger.startup(`Creator Dashboard Backend running on http://localhost:${PORT}`);
logger.startup(`Connected platforms: ${connectedPlatforms.length}`);
logger.startup(`Data refresh scheduled every 5 minutes`);
});

