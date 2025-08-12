import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.PG_CONNECTION_STRING
});

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Users table exists');
      
      // Check existing users
      const users = await client.query('SELECT id, email, created_at FROM users LIMIT 5');
      console.log('📋 Existing users:', users.rows);
      
      // Try to create a test user
      const testUser = await client.query(`
        INSERT INTO users (email, password_hash, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
        ON CONFLICT (email) DO NOTHING
        RETURNING id, email
      `, ['iquazi1108@gmail.com', 'test_hash']);
      
      if (testUser.rows.length > 0) {
        console.log('✅ Test user created:', testUser.rows[0]);
      } else {
        console.log('ℹ️ User already exists or no rows returned');
      }
      
    } else {
      console.log('❌ Users table does not exist');
      
      // Create the users table
      console.log('Creating users table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          connected_platforms JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Users table created');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabase(); 