import { google } from 'googleapis';
import axios from 'axios';

class YouTubeService {
  constructor() {
    this.youtube = google.youtube('v3');
    this.apiKey = process.env.YOUTUBE_API_KEY;
  }

  async getChannelStats(channelId, accessToken) {
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

      // Calculate estimated revenue (YouTube doesn't provide direct revenue API)
      // This is a rough estimation based on CPM and views
      const estimatedRevenue = this.calculateEstimatedRevenue(totalViews);

      return {
        name: 'YouTube',
        subscribers: parseInt(stats.subscriberCount || 0),
        views: totalViews,
        revenue: estimatedRevenue,
        growth: this.calculateGrowthRate(stats.subscriberCount),
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

  calculateGrowthRate(subscriberCount) {
    // This would need historical data for accurate calculation
    // For now, return a placeholder growth rate
    return Math.random() * 20 + 5; // 5-25% growth
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