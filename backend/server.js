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
import { googleClient, setupTwitchPassport, getTikTokToken, storeToken } from "./services/authService.js";

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

app.use(session({ secret: process.env.SESSION_SECRET || 'networthy', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
setupTwitchPassport();

app.use(cors());
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
let platformDataCache = [];
let analyticsDataCache = null;
let lastUpdate = null;
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
    await storeToken(email, 'youtube', tokens);
    
    // Set session data
    req.session.user = { email, platform: 'youtube' };
    req.session.authenticated = true;
    
    // Redirect to frontend dashboard
    res.redirect('http://localhost:3000/dashboard?platform=youtube&email=' + encodeURIComponent(email));
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect('http://localhost:3000/login?error=google_oauth_failed');
  }
});

// Twitch OAuth
app.get("/api/auth/twitch", passport.authenticate("twitch", { scope: ["user:read:email", "analytics:read:games", "channel:read:subscriptions"] }));

app.get("/api/auth/twitch/callback", passport.authenticate("twitch", { failureRedirect: "http://localhost:3000/login?error=twitch_oauth_failed" }), async (req, res) => {
  try {
    const { accessToken, refreshToken, profile } = req.user;
    const email = profile.email;
    await storeToken(email, 'twitch', { accessToken, refreshToken });
    
    // Set session data
    req.session.user = { email, platform: 'twitch' };
    req.session.authenticated = true;
    
    // Redirect to frontend dashboard
    res.redirect('http://localhost:3000/dashboard?platform=twitch&email=' + encodeURIComponent(email));
  } catch (err) {
    console.error('Twitch OAuth error:', err);
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
    // Get user email (TikTok API may not provide email directly; use open_id or ask user to provide email in UI)
    const email = tokenData.email || `tiktok_${tokenData.open_id}`;
    await storeToken(email, 'tiktok', tokenData);
    
    // Set session data
    req.session.user = { email, platform: 'tiktok' };
    req.session.authenticated = true;
    
    // Redirect to frontend dashboard
    res.redirect('http://localhost:3000/dashboard?platform=tiktok&email=' + encodeURIComponent(email));
  } catch (err) {
    console.error('TikTok OAuth error:', err);
    res.redirect('http://localhost:3000/login?error=tiktok_oauth_failed');
  }
});

// Platform Management
app.get("/api/platforms", async (req, res) => {
  try {
    // Check if cache is stale
    if (!lastUpdate || Date.now() - lastUpdate > CACHE_DURATION) {
      await updatePlatformData();
    }
    // Inject manual revenue overrides
    const data = platformDataCache.map(platform => {
      if (manualRevenueOverrides[platform.name]) {
        return { ...platform, revenue: manualRevenueOverrides[platform.name] };
      }
      return platform;
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({ error: 'Failed to fetch platform data' });
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
    // Check if cache is stale
    if (!lastUpdate || Date.now() - lastUpdate > CACHE_DURATION) {
      await updatePlatformData();
      await updateAnalyticsData();
    }
    
    res.json(analyticsDataCache);
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
