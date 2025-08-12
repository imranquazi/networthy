import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

async function checkYouTubeTokens() {
  const pool = new Pool({
    connectionString: process.env.PG_CONNECTION_STRING
  });

  try {
    console.log('🔍 Checking YouTube tokens in database...\n');

    // Check for YouTube tokens
    const result = await pool.query(`
      SELECT user_id, platform, token 
      FROM user_tokens 
      WHERE platform = 'youtube'
    `);

    if (result.rows.length === 0) {
      console.log('❌ No YouTube tokens found in database');
    } else {
      console.log(`✅ Found ${result.rows.length} YouTube token(s):`);
      result.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. User: ${row.user_id}`);
        console.log(`     Platform: ${row.platform}`);
        console.log(`     Token: ${row.token.substring(0, 50)}...`);
      });
    }

    // Check user's connected platforms
    console.log('\n🔍 Checking user connected platforms...\n');
    
    const userResult = await pool.query(`
      SELECT email, connected_platforms 
      FROM users 
      WHERE email = 'iquazi1108@gmail.com'
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ User not found in database');
    } else {
      const user = userResult.rows[0];
      console.log(`✅ User: ${user.email}`);
      console.log(`   Connected platforms: ${JSON.stringify(user.connected_platforms)}`);
      
      if (!user.connected_platforms || user.connected_platforms.length === 0) {
        console.log('❌ No connected platforms found');
      } else {
        console.log(`✅ Found ${user.connected_platforms.length} connected platform(s)`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking tokens:', error);
  } finally {
    await pool.end();
  }
}

checkYouTubeTokens();
