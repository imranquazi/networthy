import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING
});

async function checkDatabase() {
  try {
    console.log('🔍 Checking database tables...');
    
    // Check if user_tokens table exists
    const tableResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'user_tokens'
    `);
    
    if (tableResult.rows.length > 0) {
      console.log('✅ user_tokens table exists');
      
      // Check columns
      const columnResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_tokens'
        ORDER BY ordinal_position
      `);
      
      console.log('Columns in user_tokens table:');
      columnResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('❌ user_tokens table does not exist');
    }
    
    // Check if sessions table exists
    const sessionsResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'sessions'
    `);
    
    if (sessionsResult.rows.length > 0) {
      console.log('✅ sessions table exists');
    } else {
      console.log('❌ sessions table does not exist');
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
