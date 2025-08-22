-- Create sessions table for connect-pg-simple session store
CREATE TABLE IF NOT EXISTS "sessions" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)
WITH (OIDS=FALSE);

-- Add primary key
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;

-- Create index on expire column for automatic cleanup
CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON "sessions" ("expire");

-- Add comments
COMMENT ON TABLE "sessions" IS 'Session storage for connect-pg-simple';
COMMENT ON COLUMN "sessions"."sid" IS 'Session ID';
COMMENT ON COLUMN "sessions"."sess" IS 'Session data as JSON';
COMMENT ON COLUMN "sessions"."expire" IS 'Session expiration timestamp';
