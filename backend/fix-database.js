import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING
});

async function fixDatabase() {
  try {
    console.log('🔧 Fixing database tables...');
    
    // Create sessions table
    console.log('📋 Creating sessions table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" varchar NOT NULL COLLATE "default",
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      )
      WITH (OIDS=FALSE);
    `);
    
    // Add primary key if it doesn't exist
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sessions_pkey') THEN
          ALTER TABLE "sessions" ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
        END IF;
      END $$;
    `);
    
    // Create index if it doesn't exist
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sessions_expire" ON "sessions" ("expire");
    `);
    
    console.log('✅ Sessions table created/fixed');
    
    // Fix user_tokens table structure
    console.log('🔐 Fixing user_tokens table...');
    
    // Add missing columns if they don't exist
    const columnsToAdd = [
      { name: 'id', type: 'SERIAL PRIMARY KEY' },
      { name: 'token_data', type: 'TEXT' },
      { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()' },
      { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()' },
      { name: 'expires_at', type: 'TIMESTAMP WITH TIME ZONE' },
      { name: 'refresh_token', type: 'TEXT' },
      { name: 'token_type', type: 'VARCHAR(50)' },
      { name: 'scope', type: 'TEXT' }
    ];
    
    for (const column of columnsToAdd) {
      try {
        await pool.query(`
          ALTER TABLE user_tokens 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type}
        `);
        console.log(`  ✅ Added column: ${column.name}`);
      } catch (error) {
        console.log(`  ⚠️ Column ${column.name} already exists or error: ${error.message}`);
      }
    }
    
    // Create indexes if they don't exist
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_user_tokens_user_platform ON user_tokens(user_id, platform)',
      'CREATE INDEX IF NOT EXISTS idx_user_tokens_expires_at ON user_tokens(expires_at)',
      'CREATE INDEX IF NOT EXISTS idx_user_tokens_platform ON user_tokens(platform)',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_user_tokens_unique_user_platform ON user_tokens(user_id, platform)'
    ];
    
    for (const index of indexes) {
      try {
        await pool.query(index);
        console.log(`  ✅ Created index`);
      } catch (error) {
        console.log(`  ⚠️ Index already exists or error: ${error.message}`);
      }
    }
    
    console.log('✅ User tokens table fixed');
    
    // Verify tables
    console.log('🔍 Verifying tables...');
    const tables = ['platform_history', 'user_tokens', 'sessions'];
    for (const table of tables) {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      `, [table]);
      
      if (result.rows.length > 0) {
        console.log(`✅ ${table} table exists and is ready for use`);
      } else {
        console.log(`❌ ${table} table was not created`);
      }
    }
    
  } catch (error) {
    console.error('❌ Database fix failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

fixDatabase()
  .then(() => {
    console.log('🎉 Database fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Database fix failed:', error);
    process.exit(1);
  });
