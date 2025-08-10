import crypto from 'crypto';
import pkg from 'pg';
import 'dotenv/config';

const { Pool } = pkg;
const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

// Webhook verification and processing
export class WebhookService {
  constructor() {
    this.subscribers = new Map(); // Store active WebSocket connections
    this.webhookSecrets = {
      youtube: process.env.YOUTUBE_WEBHOOK_SECRET || 'youtube_secret',
      twitch: process.env.TWITCH_WEBHOOK_SECRET || 'twitch_secret',
      tiktok: process.env.TIKTOK_WEBHOOK_SECRET || 'tiktok_secret'
    };
  }

  // Verify webhook signature
  verifySignature(platform, payload, signature, timestamp) {
    const secret = this.webhookSecrets[platform];
    if (!secret) return false;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Process YouTube webhook
  async processYouTubeWebhook(payload) {
    try {
      const { channelId, subscriberCount, viewCount, videoCount } = payload;
      
      // Find users with this YouTube channel connected
      const result = await pool.query(
        `SELECT id, email FROM users 
         WHERE connected_platforms @> $1::jsonb`,
        [JSON.stringify([{"name": "youtube", "identifier": channelId}])]
      );

      if (result.rows.length > 0) {
        const updates = result.rows.map(user => ({
          userId: user.id,
          email: user.email,
          platform: 'youtube',
          data: {
            subscribers: subscriberCount,
            views: viewCount,
            videos: videoCount,
            lastUpdated: new Date().toISOString()
          }
        }));

        // Broadcast updates to connected clients
        this.broadcastUpdates(updates);
        
        // Update cache
        this.updatePlatformCache(updates);
        
        console.log(`✅ YouTube webhook processed for ${updates.length} users`);
        return { success: true, usersUpdated: updates.length };
      }
      
      return { success: true, usersUpdated: 0 };
    } catch (error) {
      console.error('❌ YouTube webhook processing error:', error);
      return { success: false, error: error.message };
    }
  }

  // Process Twitch webhook
  async processTwitchWebhook(payload) {
    try {
      const { broadcasterUserId, followerCount, viewerCount, isLive } = payload;
      
      // Find users with this Twitch channel connected
      const result = await pool.query(
        `SELECT id, email FROM users 
         WHERE connected_platforms @> $1::jsonb`,
        [JSON.stringify([{"name": "twitch", "identifier": broadcasterUserId}])]
      );

      if (result.rows.length > 0) {
        const updates = result.rows.map(user => ({
          userId: user.id,
          email: user.email,
          platform: 'twitch',
          data: {
            followers: followerCount,
            viewers: viewerCount,
            isLive: isLive,
            lastUpdated: new Date().toISOString()
          }
        }));

        // Broadcast updates to connected clients
        this.broadcastUpdates(updates);
        
        // Update cache
        this.updatePlatformCache(updates);
        
        console.log(`✅ Twitch webhook processed for ${updates.length} users`);
        return { success: true, usersUpdated: updates.length };
      }
      
      return { success: true, usersUpdated: 0 };
    } catch (error) {
      console.error('❌ Twitch webhook processing error:', error);
      return { success: false, error: error.message };
    }
  }

  // Process TikTok webhook
  async processTikTokWebhook(payload) {
    try {
      const { openId, followerCount, videoCount, likeCount } = payload;
      
      // Find users with this TikTok account connected
      const result = await pool.query(
        `SELECT id, email FROM users 
         WHERE connected_platforms @> $1::jsonb`,
        [JSON.stringify([{"name": "tiktok", "identifier": openId}])]
      );

      if (result.rows.length > 0) {
        const updates = result.rows.map(user => ({
          userId: user.id,
          email: user.email,
          platform: 'tiktok',
          data: {
            followers: followerCount,
            videos: videoCount,
            likes: likeCount,
            lastUpdated: new Date().toISOString()
          }
        }));

        // Broadcast updates to connected clients
        this.broadcastUpdates(updates);
        
        // Update cache
        this.updatePlatformCache(updates);
        
        console.log(`✅ TikTok webhook processed for ${updates.length} users`);
        return { success: true, usersUpdated: updates.length };
      }
      
      return { success: true, usersUpdated: 0 };
    } catch (error) {
      console.error('❌ TikTok webhook processing error:', error);
      return { success: false, error: error.message };
    }
  }

  // Broadcast updates to connected WebSocket clients
  broadcastUpdates(updates) {
    updates.forEach(update => {
      const message = {
        type: 'platform_update',
        userId: update.userId,
        platform: update.platform,
        data: update.data,
        timestamp: new Date().toISOString()
      };

      // Send to all subscribers for this user
      const userSubscribers = this.subscribers.get(update.userId);
      if (userSubscribers) {
        userSubscribers.forEach(ws => {
          if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(JSON.stringify(message));
          }
        });
      }
    });
  }

  // Update platform cache with new data
  updatePlatformCache(updates) {
    // This would update the in-memory cache with new data
    // Implementation depends on your caching strategy
    console.log('🔄 Updating platform cache with webhook data');
  }

  // Add WebSocket subscriber
  addSubscriber(userId, ws) {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId).add(ws);
    
    // Send initial data
    this.sendInitialData(userId, ws);
  }

  // Remove WebSocket subscriber
  removeSubscriber(userId, ws) {
    const userSubscribers = this.subscribers.get(userId);
    if (userSubscribers) {
      userSubscribers.delete(ws);
      if (userSubscribers.size === 0) {
        this.subscribers.delete(userId);
      }
    }
  }

  // Send initial data to new subscriber
  async sendInitialData(userId, ws) {
    try {
      // Fetch current platform data for the user
      const result = await pool.query(
        'SELECT connected_platforms FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows[0]?.connected_platforms) {
        const message = {
          type: 'initial_data',
          platforms: result.rows[0].connected_platforms,
          timestamp: new Date().toISOString()
        };

        if (ws.readyState === 1) {
          ws.send(JSON.stringify(message));
        }
      }
    } catch (error) {
      console.error('❌ Error sending initial data:', error);
    }
  }

  // Get webhook endpoints for platforms
  getWebhookEndpoints() {
    return {
      youtube: '/api/webhooks/youtube',
      twitch: '/api/webhooks/twitch',
      tiktok: '/api/webhooks/tiktok'
    };
  }

  // Generate webhook URLs for platform setup
  generateWebhookUrls(baseUrl) {
    const endpoints = this.getWebhookEndpoints();
    return {
      youtube: `${baseUrl}${endpoints.youtube}`,
      twitch: `${baseUrl}${endpoints.twitch}`,
      tiktok: `${baseUrl}${endpoints.tiktok}`
    };
  }
}

export const webhookService = new WebhookService(); 