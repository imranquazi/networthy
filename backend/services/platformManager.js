import YouTubeService from './youtubeService.js';
import TwitchService from './twitchService.js';
import TikTokService from './tiktokService.js';
import HistoryService from './historyService.js';

class PlatformManager {
  constructor() {
    this.services = {
      youtube: new YouTubeService(),
      twitch: new TwitchService(),
      tiktok: new TikTokService()
    };
    
    this.historyService = new HistoryService();
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  async getPlatformStats(platform, identifier, userId = null) {
    try {
      const cacheKey = `${platform}_${identifier}_${userId || 'public'}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() < cached.expiry) {
        return cached.data;
      }

      let stats;
      switch (platform.toLowerCase()) {
        case 'youtube':
          stats = await this.services.youtube.getChannelStats(identifier, null, userId);
          break;
        case 'twitch':
          stats = await this.services.twitch.getChannelStats(identifier, null, userId);
          break;
        case 'tiktok':
          stats = await this.services.tiktok.getCreatorStats(identifier, userId);
          break;

        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }

      // Cache the result
      this.cache.set(cacheKey, {
        data: stats,
        expiry: Date.now() + this.cacheExpiry
      });

      return stats;
    } catch (error) {
      console.error(`Error fetching ${platform} stats:`, error.message);
      throw error;
    }
  }

  async getAllPlatformStats(platforms, userId = null) {
    try {
      const promises = platforms.map(async (platform) => {
        try {
          return await this.getPlatformStats(platform.name, platform.identifier, userId);
        } catch (error) {
          console.error(`Failed to fetch ${platform.name} data:`, error.message);
          // Return fallback data
          return this.getFallbackData(platform.name);
        }
      });

      const results = await Promise.allSettled(promises);
      return results.map(result => 
        result.status === 'fulfilled' ? result.value : result.reason
      ).filter(Boolean);
    } catch (error) {
      console.error('Error fetching all platform stats:', error.message);
      throw error;
    }
  }

  getFallbackData(platformName) {
    // Return mock data when API fails
    const fallbackData = {
      youtube: {
        name: 'YouTube',
        subscribers: 0,
        views: 0,
        revenue: 0,
        growth: 0,
        channelId: '',
        channelName: 'Unknown Channel'
      },
      twitch: {
        name: 'Twitch',
        followers: 0,
        viewers: 0,
        revenue: 0,
        growth: 0,
        channelId: '',
        channelName: 'Unknown Channel'
      },
      tiktok: {
        name: 'TikTok',
        followers: 0,
        views: 0,
        revenue: 0,
        growth: 0,
        channelId: '',
        channelName: 'Unknown Creator'
      },

    };

    return fallbackData[platformName.toLowerCase()] || fallbackData.youtube;
  }

  async calculateAnalytics(platformStats, userId = null) {
    try {
      const totalRevenue = platformStats.reduce((sum, platform) => sum + (platform.revenue || 0), 0);
      const totalFollowers = platformStats.reduce((sum, platform) => sum + (platform.followers || 0), 0);
      
      // Calculate growth rate (average of all platforms)
      const growthRates = platformStats.map(p => p.growth || 0).filter(rate => rate > 0);
      const averageGrowth = growthRates.length > 0 
        ? growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length 
        : 0;

      // Find top platform by revenue (or by followers if all revenue is zero)
      let topPlatform = platformStats.reduce((top, current) => 
        (current.revenue || 0) > (top.revenue || 0) ? current : top
      );
      
      // If all revenue is zero, find top platform by followers/subscribers
      if (totalRevenue === 0) {
        topPlatform = platformStats.reduce((top, current) => {
          const currentFollowers = (current.followers || 0) + (current.subscribers || 0);
          const topFollowers = (top.followers || 0) + (top.subscribers || 0);
          return currentFollowers > topFollowers ? current : top;
        });
      }

      // Calculate platform breakdown
      let breakdown;
      if (totalRevenue > 0) {
        // Normal revenue-based breakdown
        breakdown = platformStats.map(platform => ({
        platform: platform.name,
          percentage: +(((platform.revenue || 0) / totalRevenue) * 100).toFixed(1)
        }));
      } else {
        // When revenue is zero, show breakdown by followers/subscribers
        const totalFollowers = platformStats.reduce((sum, platform) => 
          sum + (platform.followers || 0) + (platform.subscribers || 0), 0
        );
        
        breakdown = platformStats.map(platform => {
          const platformFollowers = (platform.followers || 0) + (platform.subscribers || 0);
          return {
            platform: platform.name,
            percentage: totalFollowers > 0 ? +((platformFollowers / totalFollowers) * 100).toFixed(1) : 0
          };
        });
      }

      // Store total revenue in history if userId is provided
      if (userId && totalRevenue > 0) {
        try {
          await this.historyService.storeTotalRevenue(userId, totalRevenue);
        } catch (error) {
          console.error('Error storing total revenue:', error);
        }
      }

      // Generate monthly trend based on historical data
      let monthlyTrend;
      if (userId) {
        monthlyTrend = await this.historyService.calculateRevenueTrend(userId, totalRevenue);
      } else {
        monthlyTrend = this.generateMonthlyTrend(totalRevenue);
      }

      return {
        totalRevenue,
        totalGrowth: +averageGrowth.toFixed(1),
        topPlatform: topPlatform.name,
        monthlyTrend,
        platformBreakdown: breakdown
      };
    } catch (error) {
      console.error('Error calculating analytics:', error.message);
      throw error;
    }
  }

  generateMonthlyTrend(currentRevenue) {
    // For zero revenue, show a flat line at zero
    if (currentRevenue === 0) {
      return [0, 0, 0, 0, 0, 0];
    }
    
    // Generate more realistic monthly trend data that stays close to current revenue
    const trend = [];
    let baseRevenue = currentRevenue * 0.85; // Start at 85% of current revenue
    
    for (let i = 0; i < 6; i++) {
      // Use smaller, more realistic growth (95-105% per month)
      const growth = (Math.random() * 0.1) + 0.95; // 95-105% growth per month
      baseRevenue *= growth;
      
      // Ensure the trend doesn't deviate too far from current revenue
      if (baseRevenue > currentRevenue * 1.2) {
        baseRevenue = currentRevenue * 1.2;
      } else if (baseRevenue < currentRevenue * 0.6) {
        baseRevenue = currentRevenue * 0.6;
      }
      
      trend.push(Math.round(baseRevenue));
    }
    
    // Ensure the last value is close to current revenue
    trend[trend.length - 1] = Math.round(currentRevenue);
    
    return trend;
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

export default PlatformManager; 