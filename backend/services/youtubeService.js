import { google } from 'googleapis';
import axios from 'axios';
import HistoryService from './historyService.js';

class YouTubeService {
  constructor() {
    this.youtube = google.youtube('v3');
    this.apiKey = process.env.YOUTUBE_API_KEY;
    this.historyService = new HistoryService();
  }

  async getChannelStats(channelId, accessToken, userId = null) {
    try {
      // Use OAuth2 client if accessToken is provided
      let youtubeClient = this.youtube;
      let authClient = null;
      if (accessToken) {
        const { OAuth2 } = google.auth;
        authClient = new OAuth2();
        authClient.setCredentials({ access_token: accessToken });
        youtubeClient = google.youtube({ version: 'v3', auth: authClient });
      }

      // Get channel statistics
      const channelResponse = await youtubeClient.channels.list({
        ...(accessToken ? {} : { key: this.apiKey }),
        part: 'statistics,snippet',
        id: channelId
      });

      const channel = channelResponse.data.items[0];
      if (!channel) {
        throw new Error('Channel not found');
      }

      const stats = channel.statistics;
      const snippet = channel.snippet;

      // Get recent videos for views calculation
      const videosResponse = await youtubeClient.search.list({
        ...(accessToken ? {} : { key: this.apiKey }),
        part: 'id',
        channelId: channelId,
        order: 'date',
        maxResults: 50,
        type: 'video'
      });

      const videoIds = videosResponse.data.items.map(item => item.id.videoId);
      
      // Get video statistics
      let totalViews = 0;
      if (videoIds.length > 0) {
        const videosStatsResponse = await youtubeClient.videos.list({
          ...(accessToken ? {} : { key: this.apiKey }),
          part: 'statistics',
          id: videoIds.join(',')
        });

        totalViews = videosStatsResponse.data.items.reduce((sum, video) => {
          return sum + parseInt(video.statistics.viewCount || 0);
        }, 0);
      }

      const subscriberCount = parseInt(stats.subscriberCount || 0);
      const estimatedRevenue = this.calculateEstimatedRevenue(totalViews);

      // Store historical data if userId is provided
      if (userId) {
        try {
          await this.historyService.storePlatformMetrics(userId, 'YouTube', channelId, {
            subscribers: subscriberCount,
            views: totalViews
          });
        } catch (error) {
          console.error('Error storing YouTube historical data:', error);
        }
      }

      // Calculate growth rate using historical data
      const growthRate = userId ? 
        await this.historyService.calculateGrowthRate(userId, 'YouTube', channelId, 'subscribers', subscriberCount) :
        0;

      return {
        name: 'YouTube',
        subscribers: subscriberCount,
        views: totalViews,
        revenue: estimatedRevenue,
        growth: growthRate,
        channelId: channelId,
        channelName: snippet.title,
        thumbnail: snippet.thumbnails.default.url
      };
    } catch (error) {
      console.error('YouTube API Error:', error.message);
      throw new Error(`Failed to fetch YouTube data: ${error.message}`);
    }
  }

  calculateEstimatedRevenue(views) {
    // Rough estimation: $2-5 per 1000 views (CPM varies greatly)
    const cpm = 3.5; // $3.50 per 1000 views
    return Math.round((views / 1000) * cpm);
  }



  async getChannelIdFromUsername(username) {
    try {
      const response = await this.youtube.channels.list({
        key: this.apiKey,
        part: 'id',
        forUsername: username
      });

      if (response.data.items && response.data.items.length > 0) {
        return response.data.items[0].id;
      }
      throw new Error('Channel not found');
    } catch (error) {
      throw new Error(`Failed to get channel ID: ${error.message}`);
    }
  }
}

export default YouTubeService; 