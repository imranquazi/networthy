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

import PlatformManager from "./services/platformManager.js";
import { googleClient, setupTwitchPassport, getTikTokToken, storeToken, getToken } from "./services/authService.js";
import { createUser, findUserByEmail, findUserById, verifyUser, updateUserPlatforms, getUserPlatforms } from "./services/userService.js";
import { google } from 'googleapis';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MANUAL_REVENUE_PATH = path.join(__dirname, "manualRevenue.json");

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(session({ 
  secret: process.env.SESSION_SECRET || 'networthy', 
  resave: false, 
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

setupTwitchPassport();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
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

// Cache for platform data
let platformDataCache = [
  { name: "YouTube", subscribers: 125000, views: 2500000, revenue: 1200, growth: 12.5 },
  { name: "Twitch", followers: 45000, viewers: 180000, revenue: 850, growth: 8.2 },
  { name: "TikTok", followers: 89000, views: 1200000, revenue: 430, growth: 15.7 },
  { name: "Instagram", followers: 67000, engagement: 4.2, revenue: 320, growth: 6.8 }
];
let analyticsDataCache = null;
let lastUpdate = Date.now();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// -------------------- Helper Functions --------------------

async function updatePlatformData() {
  try {
    if (connectedPlatforms.length === 0) {
      // Return mock data if no platforms are connected
      platformDataCache = [
        { name: "YouTube", subscribers: 125000, views: 2500000, revenue: 1200, growth: 12.5 },
        { name: "Twitch", followers: 45000, viewers: 180000, revenue: 850, growth: 8.2 },
        { name: "TikTok", followers: 89000, views: 1200000, revenue: 430, growth: 15.7 },
        { name: "Instagram", followers: 67000, engagement: 4.2, revenue: 320, growth: 6.8 }
      ];
      lastUpdate = Date.now();
      return;
    }

    console.log('🔄 Updating platform data from APIs...');
    const platformStats = await platformManager.getAllPlatformStats(connectedPlatforms);
    platformDataCache = platformStats;
    lastUpdate = Date.now();
    console.log('✅ Platform data updated successfully');
  } catch (error) {
    console.error('❌ Error updating platform data:', error.message);
    // Keep existing cache if update fails
  }
}

async function updateAnalyticsData() {
  try {
    if (platformDataCache.length === 0) {
      analyticsDataCache = {
        totalRevenue: 0,
        totalGrowth: 0,
        topPlatform: "None",
        monthlyTrend: [0, 0, 0, 0, 0, 0],
        platformBreakdown: []
      };
      return;
    }

    analyticsDataCache = await platformManager.calculateAnalytics(platformDataCache);
  } catch (error) {
    console.error('❌ Error updating analytics:', error.message);
  }
}

// Schedule data updates
cron.schedule('*/5 * * * *', async () => {
  await updatePlatformData();
  await updateAnalyticsData();
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
    
    res.json({ 
      success: true, 
      user: { email: user.email, id: user.id },
      message: 'Login successful' 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get("/api/auth/me", async (req, res) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    const user = await findUserById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
  
    console.log('User data for /api/auth/me:', {
      email: user.email,
      connectedPlatforms: user.connected_platforms
    });
  
    res.json({
      user: {
        id: user.id,
        email: user.email,
        connectedPlatforms: user.connected_platforms || []
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user data' });
  }
});

// -------------------- API Endpoints --------------------

app.get("/api/auth/status", (req, res) => {
  res.json({ 
    authenticated: req.session.authenticated || false,
    user: req.session.user || null,
    connectedPlatforms: connectedPlatforms.length,
    lastUpdate: lastUpdate
  });
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
      res.json({ success: true });
    }
  });
});

// Google OAuth (YouTube)
app.get("/api/auth/google", (req, res) => {
  const url = googleClient.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/youtube.readonly", "email", "profile"],
    prompt: "consent"
  });
  res.redirect(url);
});

app.get("/api/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);
    // Get user email
    const oauth2 = googleClient;
    const userinfo = await oauth2.request({ url: 'https://www.googleapis.com/oauth2/v2/userinfo' });
    const email = userinfo.data.email;
    
    // Check if user is logged in
    if (!req.session.authenticated) {
      return res.redirect('http://localhost:3000/login?error=not_logged_in');
    }
    
    // Store token for the logged-in user
    await storeToken(req.session.user.email, 'youtube', tokens);
    
    // Get user's YouTube channel info
    const youtubeClient = google.youtube({ version: 'v3', auth: googleClient });
    const channelsResponse = await youtubeClient.channels.list({
      part: 'snippet,statistics',
      mine: true
    });
    
    const channelId = channelsResponse.data.items?.[0]?.id;
    const channelTitle = channelsResponse.data.items?.[0]?.snippet?.title;
    
    // Add platform to user's connected platforms
    const user = await findUserByEmail(req.session.user.email);
    if (user) {
      const connectedPlatforms = user.connected_platforms || [];
      if (!connectedPlatforms.find(p => p.name === 'youtube')) {
        connectedPlatforms.push({ 
          name: 'youtube', 
          identifier: channelId || 'authenticated_user',
          title: channelTitle || 'YouTube Channel'
        });
        await updateUserPlatforms(user.id, connectedPlatforms);
        console.log('Added YouTube platform to user:', user.email, 'Platforms:', connectedPlatforms);
      }
    }
    
    // Update platform data immediately
    await updatePlatformData();
    
    // Redirect to frontend dashboard
    res.redirect('http://localhost:3000/dashboard?platform=youtube&email=' + encodeURIComponent(email));
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect('http://localhost:3000/login?error=google_oauth_failed');
  }
});

// Twitch OAuth
app.get("/api/auth/twitch", (req, res, next) => {
  // Check if user is logged in before starting OAuth
  if (!req.session.authenticated) {
    return res.redirect('http://localhost:3000/login?error=not_logged_in');
  }
  
  // Store the user's session info in a state parameter
  const state = Buffer.from(JSON.stringify({
    userId: req.session.user.id,
    email: req.session.user.email,
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
    console.log('Twitch callback - req.user:', req.user);
    console.log('Twitch callback - state:', req.query.state);
    
    if (!req.user) {
      console.error('No user data in Twitch callback');
      return res.redirect('http://localhost:3000/login?error=twitch_oauth_failed');
    }
    
    const { accessToken, refreshToken, profile } = req.user;
    console.log('Twitch tokens received:', { accessToken: !!accessToken, refreshToken: !!refreshToken, profile: !!profile });
    
    if (!profile || !profile.email) {
      console.error('No email in Twitch profile:', profile);
      return res.redirect('http://localhost:3000/login?error=twitch_oauth_failed');
    }
    
    // Get user info from state parameter instead of session
    let userInfo;
    try {
      if (req.query.state) {
        userInfo = JSON.parse(Buffer.from(req.query.state, 'base64').toString());
        console.log('✅ Retrieved user info from state:', userInfo.email);
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
    
    console.log('Storing Twitch token for user from state:', userInfo.email);
    
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
        console.log('Added Twitch platform to user:', user.email, 'Platforms:', connectedPlatforms);
      }
    }
    
    console.log('User connected platforms after Twitch:', user && user.connected_platforms);
    
    // Update platform data immediately
    await updatePlatformData();
    
    console.log('Redirecting to dashboard with Twitch data');
    // Redirect to frontend dashboard
    res.redirect('http://localhost:3000/dashboard?platform=twitch&email=' + encodeURIComponent(userInfo.email));
  } catch (err) {
    console.error('Twitch OAuth error:', err);
    console.error('Error stack:', err.stack);
    res.redirect('http://localhost:3000/login?error=twitch_oauth_failed');
  }
});

// TikTok OAuth
app.get("/api/auth/tiktok", (req, res) => {
  const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${process.env.TIKTOK_CLIENT_KEY}&response_type=code&scope=user.info.basic,video.list,video.stats&redirect_uri=${encodeURIComponent(process.env.TIKTOK_REDIRECT_URI)}&state=networthy`;
  res.redirect(url);
});

app.get("/api/auth/tiktok/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const tokenData = await getTikTokToken(code);
    
    // Check if user is logged in
    if (!req.session.authenticated) {
      return res.redirect('http://localhost:3000/login?error=not_logged_in');
    }
    
    // Store token for the logged-in user
    await storeToken(req.session.user.email, 'tiktok', tokenData);
    
    // Get user's TikTok info (if available in token data)
    const tiktokUser = tokenData.open_id || 'authenticated_user';
    
    // Add platform to user's connected platforms
    const user = await findUserByEmail(req.session.user.email);
    if (user) {
      const connectedPlatforms = user.connected_platforms || [];
      if (!connectedPlatforms.find(p => p.name === 'tiktok')) {
        connectedPlatforms.push({ 
          name: 'tiktok', 
          identifier: tiktokUser,
          title: 'TikTok Account'
        });
        await updateUserPlatforms(user.id, connectedPlatforms);
        console.log('Added TikTok platform to user:', user.email, 'Platforms:', connectedPlatforms);
      }
    }
    
    // Update platform data immediately
    await updatePlatformData();
    
    // Redirect to frontend dashboard
    res.redirect('http://localhost:3000/dashboard?platform=tiktok&email=' + encodeURIComponent(req.session.user.email));
  } catch (err) {
    console.error('TikTok OAuth error:', err);
    res.redirect('http://localhost:3000/login?error=tiktok_oauth_failed');
  }
});

// Platform Management
app.get("/api/platforms", async (req, res) => {
  let userConnectedPlatforms = [];
  try {
    // If user is authenticated, fetch their tokens
    let userTokens = {};
    
    if (req.session && req.session.user && req.session.user.email) {
      console.log('Session user:', req.session.user);
      const user = await findUserByEmail(req.session.user.email);
      console.log('Found user:', user ? user.email : 'not found');
      if (user) {
        userConnectedPlatforms = user.connected_platforms || [];
        console.log('User connected platforms:', userConnectedPlatforms);
      }
      
      const [youtubeToken, twitchToken, tiktokToken] = await Promise.all([
        getToken(req.session.user.email, 'youtube').catch(() => null),
        getToken(req.session.user.email, 'twitch').catch(() => null),
        getToken(req.session.user.email, 'tiktok').catch(() => null)
      ]);
      
      if (youtubeToken) userTokens.youtube = youtubeToken;
      if (twitchToken) userTokens.twitch = twitchToken;
      if (tiktokToken) userTokens.tiktok = tiktokToken;
      
      console.log('User tokens found:', Object.keys(userTokens));
    }

    // Check if cache is stale or if user has connected platforms (force refresh)
    const forceRefresh = req.query.refresh === 'true';
    const shouldRefresh = !lastUpdate || 
                         Date.now() - lastUpdate > CACHE_DURATION ||
                         userConnectedPlatforms.length > 0 ||
                         forceRefresh;
    
    console.log('Should refresh:', shouldRefresh);
    console.log('User connected platforms length:', userConnectedPlatforms.length);
    
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
        // Get stats for platforms with user tokens
        const authenticatedStats = await Promise.all(
          platformsWithTokens.map(async (platform) => {
            const platformName = platform.name.toLowerCase();
            if (platformName === 'youtube') {
              return await platformManager.services.youtube.getChannelStats(platform.identifier, platform.token.access_token);
            } else if (platformName === 'twitch') {
              return await platformManager.services.twitch.getChannelStats(platform.identifier, platform.token.accessToken);
            } else if (platformName === 'tiktok') {
              return await platformManager.services.tiktok.getCreatorStats(platform.identifier, platform.token.access_token);
            }
          })
        );
        
        // Get stats for platforms without tokens
        const otherStats = platformsWithoutTokens.length > 0 
          ? await platformManager.getAllPlatformStats(platformsWithoutTokens)
          : [];
        
        platformDataCache = [...authenticatedStats, ...otherStats];
        lastUpdate = Date.now();
      } else if (userConnectedPlatforms.length > 0) {
        // User has connected platforms but no tokens yet - return empty data for those platforms
        platformDataCache = userConnectedPlatforms.map(platform => ({
          name: platform.name,
          subscribers: 0,
          followers: 0,
          views: 0,
          viewers: 0,
          revenue: 0,
          growth: 0
        }));
        lastUpdate = Date.now();
        console.log('Returning empty data for connected platforms without tokens:', platformDataCache);
      } else {
        // No user platforms connected - use mock data
        await updatePlatformData();
      }
    }
    // Inject manual revenue overrides
    const data = platformDataCache.map(platform => {
      if (manualRevenueOverrides[platform.name]) {
        return { ...platform, revenue: manualRevenueOverrides[platform.name] };
      }
      return platform;
    });
    console.log('Returning platform data:', data);
    res.json(data);
      } catch (error) {
      console.error('Error fetching platforms:', error);
      console.log('User connected platforms in catch:', userConnectedPlatforms);
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
        console.log('Returning empty data due to error:', emptyData);
        res.json(emptyData);
      } else {
        res.json([]);
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
      data: platformDataCache 
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
    manualRevenueOverrides[name] = revenue;
    saveManualRevenueOverrides();
    // Update cache immediately
    platformDataCache = platformDataCache.map(platform =>
      platform.name === name ? { ...platform, revenue } : platform
    );
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
    // Get the same data that the /api/platforms endpoint would return
    let platformData = [];
    let userConnectedPlatforms = [];
    
    // Get user's connected platforms if authenticated
    if (req.session && req.session.user && req.session.user.email) {
      const user = await findUserByEmail(req.session.user.email);
      if (user) {
        userConnectedPlatforms = user.connected_platforms || [];
      }
    }
    
    // If user has connected platforms but API calls are failing, use empty data
    if (userConnectedPlatforms.length > 0) {
      // Check if we have real data or if APIs are failing
      try {
        // Try to get fresh data
        const [youtubeToken, twitchToken, tiktokToken] = await Promise.all([
          getToken(req.session.user.email, 'youtube').catch(() => null),
          getToken(req.session.user.email, 'twitch').catch(() => null),
          getToken(req.session.user.email, 'tiktok').catch(() => null)
        ]);
        
        let hasRealData = false;
        const platformsWithTokens = [];
        
        for (const platform of userConnectedPlatforms) {
          const platformName = platform.name.toLowerCase();
          if ((platformName === 'youtube' && youtubeToken) || 
              (platformName === 'twitch' && twitchToken) || 
              (platformName === 'tiktok' && tiktokToken)) {
            platformsWithTokens.push(platform);
            hasRealData = true;
          }
        }
        
        if (hasRealData) {
          // Use the actual platform data cache if we have real data
          platformData = platformDataCache;
        } else {
          // No tokens - return empty data for connected platforms
          platformData = userConnectedPlatforms.map(platform => ({
            name: platform.name,
            subscribers: 0,
            followers: 0,
            views: 0,
            viewers: 0,
            revenue: 0,
            growth: 0
          }));
        }
      } catch (error) {
        // API calls failed - return empty data for connected platforms
        platformData = userConnectedPlatforms.map(platform => ({
          name: platform.name,
          subscribers: 0,
          followers: 0,
          views: 0,
          viewers: 0,
          revenue: 0,
          growth: 0
        }));
      }
    } else {
      // No connected platforms - use mock data
      platformData = platformDataCache;
    }
    
    // Calculate analytics based on the actual data being shown
    const analytics = await platformManager.calculateAnalytics(platformData);
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
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
    lastUpdate: lastUpdate
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Creator Dashboard Backend running on http://localhost:${PORT}`);
  console.log(`📊 Connected platforms: ${connectedPlatforms.length}`);
  console.log(`⏰ Data refresh scheduled every 5 minutes`);
});
