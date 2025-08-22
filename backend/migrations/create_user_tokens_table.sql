-- Create user_tokens table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS user_tokens (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    token_data TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token TEXT,
    token_type VARCHAR(50),
    scope TEXT
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_platform ON user_tokens(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_user_tokens_expires_at ON user_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_tokens_platform ON user_tokens(platform);

-- Add unique constraint to prevent duplicate tokens for same user/platform
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tokens_unique_user_platform ON user_tokens(user_id, platform);

-- Add comments
COMMENT ON TABLE user_tokens IS 'Stores OAuth tokens for user platform connections';
COMMENT ON COLUMN user_tokens.token_data IS 'Encrypted OAuth token data';
COMMENT ON COLUMN user_tokens.platform IS 'Platform name (youtube, twitch, tiktok)';
COMMENT ON COLUMN user_tokens.expires_at IS 'Token expiration timestamp';
COMMENT ON COLUMN user_tokens.refresh_token IS 'OAuth refresh token for token renewal';
