// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// -------------------- In-Memory Data Store --------------------

let revenueData = [
  { platform: "YouTube", revenue: 1200, currency: "USD", period: "monthly" },
  { platform: "Twitch", revenue: 850, currency: "USD", period: "monthly" },
  { platform: "TikTok", revenue: 430, currency: "USD", period: "monthly" },
  { platform: "Instagram", revenue: 320, currency: "USD", period: "monthly" },
  { platform: "Kick", revenue: 180, currency: "USD", period: "monthly" },
];

let platformStats = [
  { name: "YouTube", subscribers: 125000, views: 2500000, revenue: 1200, growth: 12.5 },
  { name: "Twitch", followers: 45000, viewers: 180000, revenue: 850, growth: 8.2 },
  { name: "TikTok", followers: 89000, views: 1200000, revenue: 430, growth: 15.7 },
  { name: "Instagram", followers: 67000, engagement: 4.2, revenue: 320, growth: 6.8 },
  { name: "Kick", followers: 12000, viewers: 45000, revenue: 180, growth: 22.1 }
];

let analyticsData = {
  totalRevenue: 2980,
  totalGrowth: 13.1,
  topPlatform: "YouTube",
  monthlyTrend: [2100, 2250, 2400, 2600, 2800, 2980],
  platformBreakdown: [
    { platform: "YouTube", percentage: 40.3 },
    { platform: "Twitch", percentage: 28.5 },
    { platform: "TikTok", percentage: 14.4 },
    { platform: "Instagram", percentage: 10.7 },
    { platform: "Kick", percentage: 6.0 },
  ]
};

// -------------------- API Endpoints --------------------

app.get("/api/auth/status", (req, res) => {
  res.json({ authenticated: true });
});

// Revenue
app.get("/api/revenue", (req, res) => {
  res.json(revenueData);
});

app.post("/api/revenue", (req, res) => {
  const newEntry = req.body;
  const index = revenueData.findIndex(r => r.platform === newEntry.platform);
  if (index >= 0) {
    revenueData[index] = newEntry; // update
  } else {
    revenueData.push(newEntry); // add
  }
  res.json({ success: true, data: revenueData });
});

// Platforms
app.get("/api/platforms", (req, res) => {
  res.json(platformStats);
});

app.post("/api/platforms", (req, res) => {
  const updatedPlatform = req.body;
  const index = platformStats.findIndex(p => p.name === updatedPlatform.name);
  if (index >= 0) {
    platformStats[index] = { ...platformStats[index], ...updatedPlatform };
  } else {
    platformStats.push(updatedPlatform);
  }
  
  // Also update revenue data to keep them in sync
  const revenueIndex = revenueData.findIndex(r => r.platform === updatedPlatform.name);
  if (revenueIndex >= 0 && updatedPlatform.revenue !== undefined) {
    revenueData[revenueIndex].revenue = updatedPlatform.revenue;
  }
  
  res.json({ success: true, data: platformStats });
});

// Analytics
app.get("/api/analytics", (req, res) => {
  // Update analytics dynamically based on current data
  const totalRevenue = revenueData.reduce((sum, r) => sum + r.revenue, 0);
  const breakdown = revenueData.map(entry => ({
    platform: entry.platform,
    percentage: +((entry.revenue / totalRevenue) * 100).toFixed(1),
  }));

  analyticsData.totalRevenue = totalRevenue;
  analyticsData.platformBreakdown = breakdown;
  analyticsData.topPlatform = breakdown.sort((a, b) => b.percentage - a.percentage)[0].platform;

  res.json(analyticsData);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Creator Dashboard Backend running on http://localhost:${PORT}`);
});
