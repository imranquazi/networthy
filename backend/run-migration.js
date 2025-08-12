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
    console.log('🔄 Running platform_history table migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'migrations', 'create_platform_history_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    console.log('✅ Platform history table migration completed successfully!');
    
    // Verify the table was created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'platform_history'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ platform_history table exists and is ready for use');
    } else {
      console.log('❌ platform_history table was not created');
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
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export default runMigration;
