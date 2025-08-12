-- Create platform_history table for storing historical data
CREATE TABLE IF NOT EXISTS platform_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_name VARCHAR(50) NOT NULL,
    platform_identifier VARCHAR(255) NOT NULL,
    metric_name VARCHAR(50) NOT NULL, -- 'subscribers', 'followers', 'views', etc.
    metric_value INTEGER NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_platform_history_user_platform ON platform_history(user_id, platform_name);
CREATE INDEX IF NOT EXISTS idx_platform_history_metric ON platform_history(platform_name, metric_name);
CREATE INDEX IF NOT EXISTS idx_platform_history_recorded_at ON platform_history(recorded_at);

-- Note: No unique constraint needed since we want to store historical data over time
-- Multiple entries for the same metric are allowed for trend analysis

-- Add comment
COMMENT ON TABLE platform_history IS 'Stores historical platform metrics for growth rate calculations';
COMMENT ON COLUMN platform_history.metric_name IS 'The type of metric (subscribers, followers, views, etc.)';
COMMENT ON COLUMN platform_history.metric_value IS 'The numeric value of the metric at the time of recording';
