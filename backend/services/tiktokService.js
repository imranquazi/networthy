import axios from 'axios';
import HistoryService from './historyService.js';

class TikTokService {
  constructor() {
    this.clientKey = process.env.TIKTOK_CLIENT_KEY;
    this.clientSecret = process.env.TIKTOK_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.historyService = new HistoryService();
  }

  async authenticate() {
    try {
      if (!this.clientKey || !this.clientSecret) {
        throw new Error('TikTok API credentials not configured');
      }

      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('TikTok Authentication Error:', error.message);
      throw new Error('Failed to authenticate with TikTok API');
    }
  }

  async getCreatorStats(username, userId = null) {
    try {
      const token = await this.authenticate();

      // Get user information
      const userResponse = await axios.get(`https://open.tiktokapis.com/v2/user/info/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          fields: ['display_name', 'bio_description', 'profile_deep_link', 'is_verified', 'follower_count', 'following_count', 'likes_count']
        }
      });

      const user = userResponse.data.data.user;

      // Get video statistics
      const videosResponse = await axios.get(`https://open.tiktokapis.com/v2/video/list/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          fields: ['id', 'title', 'cover_image_url', 'video_description', 'duration', 'height', 'width', 'share_url', 'comment_count', 'like_count', 'view_count', 'share_count']
        }
      });

      const videos = videosResponse.data.data.videos || [];
      const totalViews = videos.reduce((sum, video) => sum + (parseInt(video.stats.view_count) || 0), 0);
      const totalLikes = videos.reduce((sum, video) => sum + (parseInt(video.stats.like_count) || 0), 0);

      const followerCount = parseInt(user.follower_count || 0);
      const estimatedRevenue = this.calculateEstimatedRevenue(followerCount, totalViews);

      // Store historical data if userId is provided
      if (userId) {
        try {
          await this.historyService.storePlatformMetrics(userId, 'TikTok', user.open_id, {
            followers: followerCount,
            views: totalViews
          });
        } catch (error) {
          console.error('Error storing TikTok historical data:', error);
        }
      }

      // Calculate growth rate using historical data
      const growthRate = userId ? 
        await this.historyService.calculateGrowthRate(userId, 'TikTok', user.open_id, 'followers', followerCount) :
        0;

      return {
        name: 'TikTok',
        followers: followerCount,
        views: totalViews,
        likes: totalLikes,
        revenue: estimatedRevenue,
        growth: growthRate,
        channelId: user.open_id,
        channelName: user.display_name,
        thumbnail: user.avatar_url,
        videoCount: videos.length
      };
    } catch (error) {
      console.error('TikTok API Error:', error.message);
      throw new Error(`Failed to fetch TikTok data: ${error.message}`);
    }
  }

  calculateEstimatedRevenue(followers, views) {
    // Rough estimation based on followers and views
    // TikTok revenue varies based on Creator Fund, brand deals, etc.
    const followerRevenue = followers * 0.005; // $0.005 per follower per month
    const viewRevenue = (views / 1000) * 0.5; // $0.50 per 1000 views
    return Math.round(followerRevenue + viewRevenue);
  }



  async getCreatorIdFromUsername(username) {
    try {
      const token = await this.authenticate();
      
      const response = await axios.get(`https://open.tiktokapis.com/v2/user/info/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          fields: ['open_id', 'display_name']
        }
      });

      if (response.data.data && response.data.data.user) {
        return response.data.data.user.open_id;
      }
      throw new Error('Creator not found');
    } catch (error) {
      throw new Error(`Failed to get creator ID: ${error.message}`);
    }
  }
}

export default TikTokService; 