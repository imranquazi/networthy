import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function listTokens() {
  const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING
  });

  try {
    console.log('🔍 Listing all tokens in database...');
    
    // Get all tokens
    const result = await pool.query(`
      SELECT user_id, platform, LENGTH(token) as token_length
      FROM user_tokens
      ORDER BY user_id, platform
    `);
    
    console.log('Tokens in database:');
    result.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. User ID: ${row.user_id}, Platform: ${row.platform}, Token Length: ${row.token_length}`);
    });
    
    // Check if any tokens match the user's email
    const userResult = await pool.query(`
      SELECT id, email FROM users WHERE email = 'iquazi1108@gmail.com'
    `);
    
    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      console.log(`\nUser found: ID = ${user.id}, Email = ${user.email}`);
      
      // Check if there are tokens for this user
      const userTokens = result.rows.filter(row => row.user_id === user.id);
      if (userTokens.length > 0) {
        console.log(`\nTokens for this user:`);
        userTokens.forEach((row, index) => {
          console.log(`  ${index + 1}. Platform: ${row.platform}, Token Length: ${row.token_length}`);
        });
      } else {
        console.log(`\nNo tokens found for user ID: ${user.id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error listing tokens:', error);
  } finally {
    await pool.end();
  }
}

listTokens();
