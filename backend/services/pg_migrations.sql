-- backend/services/pg_migrations.sql
CREATE TABLE IF NOT EXISTS user_tokens (
  user_id VARCHAR(255) NOT NULL,
  platform VARCHAR(32) NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (user_id, platform)
); 