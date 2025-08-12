import { Pool } from 'pg';
import { google } from 'googleapis';
import axios from 'axios';

class TokenManager {
  constructor() {
    this.pool = new Pool({ connectionString: process.env.PG_CONNECTION_STRING });
  }

  // Check if token is expired
  isTokenExpired(tokenData) {
    if (!tokenData || !tokenData.expires_at) return true;
    return new Date() > new Date(tokenData.expires_at);
  }

  // Validate and refresh YouTube tokens
  async validateAndRefreshYouTubeToken(userId, tokenData) {
    try {
      if (!this.isTokenExpired(tokenData)) {
        return tokenData; // Token is still valid
      }

      console.log(`🔄 Refreshing expired YouTube token for user: ${userId}`);

      // Create OAuth2 client for refresh
      const { OAuth2 } = google.auth;
      const oauth2Client = new OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      // Set refresh token
      oauth2Client.setCredentials({
        refresh_token: tokenData.refresh_token
      });

      // Refresh the token
      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update token in database
      const updatedToken = {
        access_token: credentials.access_token,
        refresh_token: credentials.refresh_token || tokenData.refresh_token,
        expires_at: new Date(Date.now() + (credentials.expires_in * 1000)),
        scope: credentials.scope,
        token_type: credentials.token_type
      };

      await this.updateToken(userId, 'youtube', updatedToken);
      console.log(`✅ YouTube token refreshed successfully for user: ${userId}`);
      
      return updatedToken;
    } catch (error) {
      console.error(`❌ Failed to refresh YouTube token for user ${userId}:`, error.message);
      // Remove invalid token
      await this.removeToken(userId, 'youtube');
      throw new Error('Token refresh failed - re-authentication required');
    }
  }

  // Validate and refresh Twitch tokens
  async validateAndRefreshTwitchToken(userId, tokenData) {
    try {
      if (!this.isTokenExpired(tokenData)) {
        return tokenData; // Token is still valid
      }

      console.log(`🔄 Refreshing expired Twitch token for user: ${userId}`);

      // Twitch token refresh
      const response = await axios.post('https://id.twitch.tv/oauth2/token', {
        grant_type: 'refresh_token',
        refresh_token: tokenData.refresh_token,
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET
      });

      const { access_token, refresh_token, expires_in } = response.data;
      
      // Update token in database
      const updatedToken = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + (expires_in * 1000))
      };

      await this.updateToken(userId, 'twitch', updatedToken);
      console.log(`✅ Twitch token refreshed successfully for user: ${userId}`);
      
      return updatedToken;
    } catch (error) {
      console.error(`❌ Failed to refresh Twitch token for user ${userId}:`, error.message);
      // Remove invalid token
      await this.removeToken(userId, 'twitch');
      throw new Error('Token refresh failed - re-authentication required');
    }
  }

  // Get valid token for a platform
  async getValidToken(userId, platform) {
    try {
      // Get token from database
      const tokenData = await this.getToken(userId, platform);
      if (!tokenData) {
        return null; // No token found
      }

      // Check if token is expired and refresh if needed
      if (this.isTokenExpired(tokenData)) {
        if (platform === 'youtube') {
          return await this.validateAndRefreshYouTubeToken(userId, tokenData);
        } else if (platform === 'twitch') {
          return await this.validateAndRefreshTwitchToken(userId, tokenData);
        }
      }

      return tokenData;
    } catch (error) {
      console.error(`❌ Error getting valid token for ${platform}:`, error.message);
      return null;
    }
  }

  // Get token from database
  async getToken(userId, platform) {
    try {
      const result = await this.pool.query(
        'SELECT * FROM user_tokens WHERE user_id = $1 AND platform = $2',
        [userId, platform]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Update token in database
  async updateToken(userId, platform, tokenData) {
    try {
      await this.pool.query(
        `INSERT INTO user_tokens (user_id, platform, token_data, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (user_id, platform)
         DO UPDATE SET token_data = $3, updated_at = NOW()`,
        [userId, platform, JSON.stringify(tokenData)]
      );
    } catch (error) {
      console.error('Error updating token:', error);
      throw error;
    }
  }

  // Remove token from database
  async removeToken(userId, platform) {
    try {
      await this.pool.query(
        'DELETE FROM user_tokens WHERE user_id = $1 AND platform = $2',
        [userId, platform]
      );
      console.log(`🗑️ Removed ${platform} token for user: ${userId}`);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // Clean up all expired tokens (run periodically)
  async cleanupExpiredTokens() {
    try {
      console.log('🧹 Starting expired token cleanup...');
      
      // Get all tokens
      const result = await this.pool.query('SELECT * FROM user_tokens');
      let removedCount = 0;

      for (const token of result.rows) {
        try {
          const tokenData = JSON.parse(token.token_data);
          
          if (this.isTokenExpired(tokenData)) {
            // Try to refresh the token
            try {
              if (token.platform === 'youtube') {
                await this.validateAndRefreshYouTubeToken(token.user_id, tokenData);
              } else if (token.platform === 'twitch') {
                await this.validateAndRefreshTwitchToken(token.user_id, tokenData);
              }
            } catch (refreshError) {
              // If refresh fails, remove the token
              await this.removeToken(token.user_id, token.platform);
              removedCount++;
            }
          }
        } catch (parseError) {
          // If token data is corrupted, remove it
          await this.removeToken(token.user_id, token.platform);
          removedCount++;
        }
      }

      console.log(`✅ Token cleanup completed. Removed ${removedCount} expired tokens.`);
      return removedCount;
    } catch (error) {
      console.error('❌ Error during token cleanup:', error);
      throw error;
    }
  }

  // Update user's connected platforms based on valid tokens
  async updateConnectedPlatforms(userId) {
    try {
      const platforms = [];
      
      // Check each platform for valid tokens
      const platformsToCheck = ['youtube', 'twitch', 'tiktok'];
      
      for (const platform of platformsToCheck) {
        const token = await this.getValidToken(userId, platform);
        if (token) {
          platforms.push(platform);
        }
      }

      // Update user's connected platforms
      await this.pool.query(
        'UPDATE users SET connected_platforms = $1 WHERE id = $2',
        [JSON.stringify(platforms), userId]
      );

      console.log(`✅ Updated connected platforms for user ${userId}:`, platforms);
      return platforms;
    } catch (error) {
      console.error('Error updating connected platforms:', error);
      throw error;
    }
  }

  // Close database connection
  async close() {
    await this.pool.end();
  }
}

export default TokenManager;
