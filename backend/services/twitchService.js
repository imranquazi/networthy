import axios from 'axios';

class TwitchService {
  constructor() {
    this.clientId = process.env.TWITCH_CLIENT_ID;
    this.clientSecret = process.env.TWITCH_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    try {
      if (!this.clientId || !this.clientSecret) {
        throw new Error('Twitch API credentials not configured');
      }

      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
        params: {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'client_credentials'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);

      return this.accessToken;
    } catch (error) {
      console.error('Twitch Authentication Error:', error.message);
      throw new Error('Failed to authenticate with Twitch API');
    }
  }

  async getChannelStats(username) {
    try {
      const token = await this.authenticate();

      // Get user information
      const userResponse = await axios.get(`https://api.twitch.tv/helix/users?login=${username}`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`
        }
      });

      if (!userResponse.data.data || userResponse.data.data.length === 0) {
        throw new Error('Twitch user not found');
      }

      const user = userResponse.data.data[0];

      // Get follower count
      const followersResponse = await axios.get(`https://api.twitch.tv/helix/users/follows?to_id=${user.id}`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`
        }
      });

      const followers = followersResponse.data.total || 0;

      // Get stream information
      const streamResponse = await axios.get(`https://api.twitch.tv/helix/streams?user_id=${user.id}`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`
        }
      });

      const stream = streamResponse.data.data[0];
      const viewers = stream ? stream.viewer_count : 0;

      // Calculate estimated revenue (Twitch doesn't provide direct revenue API)
      // This is a rough estimation based on followers and viewers
      const estimatedRevenue = this.calculateEstimatedRevenue(followers, viewers);

      return {
        name: 'Twitch',
        followers: followers,
        viewers: viewers,
        revenue: estimatedRevenue,
        growth: this.calculateGrowthRate(followers),
        channelId: user.id,
        channelName: user.display_name,
        thumbnail: user.profile_image_url,
        isLive: !!stream
      };
    } catch (error) {
      console.error('Twitch API Error:', error.message);
      throw new Error(`Failed to fetch Twitch data: ${error.message}`);
    }
  }

  calculateEstimatedRevenue(followers, viewers) {
    // Rough estimation based on followers and concurrent viewers
    // Twitch revenue varies greatly based on subscriptions, donations, ads, etc.
    const followerRevenue = followers * 0.01; // $0.01 per follower per month
    const viewerRevenue = viewers * 0.05; // $0.05 per concurrent viewer per month
    return Math.round(followerRevenue + viewerRevenue);
  }

  calculateGrowthRate(followers) {
    // This would need historical data for accurate calculation
    // For now, return a placeholder growth rate
    return Math.random() * 15 + 3; // 3-18% growth
  }

  async getChannelIdFromUsername(username) {
    try {
      const token = await this.authenticate();
      
      const response = await axios.get(`https://api.twitch.tv/helix/users?login=${username}`, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0].id;
      }
      throw new Error('Channel not found');
    } catch (error) {
      throw new Error(`Failed to get channel ID: ${error.message}`);
    }
  }
}

export default TwitchService; 