# Production Deployment Guide

## Automatic Token Management

### 1. Token Cleanup Cron Job

Set up automatic token cleanup to run daily:

```bash
# Add to crontab (run daily at 2 AM)
0 2 * * * cd /path/to/your/app/backend && node scripts/tokenCleanup.js >> /var/log/token-cleanup.log 2>&1
```

### 2. Environment Variables for Production

Add these to your production `.env`:

```env
# Token Management
TOKEN_CLEANUP_ENABLED=true
TOKEN_CLEANUP_INTERVAL=86400000  # 24 hours in milliseconds
TOKEN_EXPIRY_BUFFER=300000       # 5 minutes buffer before expiry

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback

TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret
TWITCH_REDIRECT_URI=https://yourdomain.com/api/auth/twitch/callback

TIKTOK_CLIENT_ID=your_tiktok_client_id
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
TIKTOK_REDIRECT_URI=https://yourdomain.com/api/auth/tiktok/callback
```

### 3. Database Schema Updates

Ensure your `user_tokens` table has the correct structure:

```sql
-- Update user_tokens table for better token management
ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS refresh_token TEXT;
ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS token_type VARCHAR(50);
ALTER TABLE user_tokens ADD COLUMN IF NOT EXISTS scope TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_tokens_expires_at ON user_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_platform ON user_tokens(user_id, platform);
```

### 4. Monitoring and Logging

Set up monitoring for token cleanup:

```bash
# Create log directory
mkdir -p /var/log/networthy

# Set up log rotation
cat > /etc/logrotate.d/networthy << EOF
/var/log/networthy/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
}
EOF
```

### 5. Health Check Endpoint

The system includes a health check endpoint:

```bash
curl https://yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-11T16:33:48.037Z",
  "connectedPlatforms": 0,
  "cacheStats": {"size": 0, "entries": []},
  "lastUpdate": 1754930028037
}
```

### 6. Docker Deployment (Optional)

Create a `docker-compose.yml` for easy deployment:

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - PG_CONNECTION_STRING=${PG_CONNECTION_STRING}
    volumes:
      - ./logs:/var/log/networthy
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://yourdomain.com
    restart: unless-stopped

  cron:
    build: ./backend
    command: node scripts/tokenCleanup.js
    environment:
      - NODE_ENV=production
      - PG_CONNECTION_STRING=${PG_CONNECTION_STRING}
    volumes:
      - ./logs:/var/log/networthy
    restart: "no"
```

### 7. Automated Token Refresh

The system automatically:
- ✅ **Refreshes tokens** before they expire
- ✅ **Removes invalid tokens** that can't be refreshed
- ✅ **Updates connected platforms** based on valid tokens
- ✅ **Logs all operations** for monitoring

### 8. Manual Token Management

For manual token management:

```bash
# Check token status
curl -H "Authorization: Bearer YOUR_TOKEN" https://yourdomain.com/api/auth/status-token

# Force token cleanup
node scripts/tokenCleanup.js

# View cleanup logs
tail -f /var/log/token-cleanup.log
```

### 9. Production Checklist

Before going live:

- [ ] Set up cron job for token cleanup
- [ ] Configure all OAuth redirect URIs for production domain
- [ ] Set up monitoring and alerting
- [ ] Test token refresh functionality
- [ ] Configure log rotation
- [ ] Set up database backups
- [ ] Test health check endpoint
- [ ] Configure rate limiting for production
- [ ] Set up SSL certificates
- [ ] Test OAuth flows in production environment

### 10. Troubleshooting

Common issues and solutions:

**Tokens not refreshing:**
- Check OAuth app configuration
- Verify refresh tokens are being stored
- Check logs for specific error messages

**Cron job not running:**
- Verify crontab syntax
- Check file permissions
- Ensure Node.js path is correct

**Database connection issues:**
- Verify connection string
- Check database permissions
- Ensure network connectivity
