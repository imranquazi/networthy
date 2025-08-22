import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigration() {
  const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING
  });

  try {
    console.log('🔄 Running database migrations...');
    
    // Run platform_history table migration
    console.log('📋 Creating platform_history table...');
    const platformHistoryPath = path.join(process.cwd(), 'migrations', 'create_platform_history_table.sql');
    const platformHistorySQL = fs.readFileSync(platformHistoryPath, 'utf8');
    await pool.query(platformHistorySQL);
    console.log('✅ Platform history table migration completed!');
    
    // Run user_tokens table migration
    console.log('🔐 Creating user_tokens table...');
    const userTokensPath = path.join(process.cwd(), 'migrations', 'create_user_tokens_table.sql');
    const userTokensSQL = fs.readFileSync(userTokensPath, 'utf8');
    await pool.query(userTokensSQL);
    console.log('✅ User tokens table migration completed!');
    
    // Verify tables were created
    const tables = ['platform_history', 'user_tokens'];
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
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log('🎉 All migrations completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export default runMigration;
