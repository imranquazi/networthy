import dotenv from 'dotenv';
import TokenManager from '../services/tokenManager.js';

dotenv.config();

async function runTokenCleanup() {
  const tokenManager = new TokenManager();
  
  try {
    console.log('🚀 Starting automated token cleanup...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    // Run the cleanup
    const removedCount = await tokenManager.cleanupExpiredTokens();
    
    console.log('✅ Token cleanup completed successfully');
    console.log(`📊 Summary: Removed ${removedCount} expired tokens`);
    
    // Exit with success code
    process.exit(0);
  } catch (error) {
    console.error('❌ Token cleanup failed:', error);
    process.exit(1);
  } finally {
    await tokenManager.close();
  }
}

// Run the cleanup
runTokenCleanup();
