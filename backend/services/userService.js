import { Pool } from 'pg';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ 
  connectionString: process.env.PG_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

// Hash password using bcrypt-like approach
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Verify password
function verifyPassword(password, hashedPassword) {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Create a new user
export async function createUser(email, password) {
  try {
    const hashedPassword = hashPassword(password);
    const userId = Date.now().toString();
    
    const result = await pool.query(
      'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email, created_at',
      [userId, email, hashedPassword]
    );
    
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('User already exists');
    }
    throw error;
  }
}

// Find user by email
export async function findUserByEmail(email) {
  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, created_at, connected_platforms FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user:', error.message);
    return null;
  }
}

// Find user by ID
export async function findUserById(id) {
  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, created_at, connected_platforms FROM users WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user by ID:', error.message);
    return null;
  }
}

// Verify user credentials
export async function verifyUser(email, password) {
  try {
    const user = await findUserByEmail(email);
    if (!user) return null;
    
    if (verifyPassword(password, user.password_hash)) {
      return user;
    }
    return null;
  } catch (error) {
    console.error('Error verifying user:', error.message);
    return null;
  }
}

// Update user's connected platforms
export async function updateUserPlatforms(userId, connectedPlatforms) {
  try {
    await pool.query(
      'UPDATE users SET connected_platforms = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(connectedPlatforms), userId]
    );
    return true;
  } catch (error) {
    console.error('Error updating user platforms:', error.message);
    return false;
  }
}

// Get user's connected platforms
export async function getUserPlatforms(userId) {
  try {
    const result = await pool.query(
      'SELECT connected_platforms FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) return [];
    
    const platforms = result.rows[0].connected_platforms;
    return Array.isArray(platforms) ? platforms : [];
  } catch (error) {
    console.error('Error getting user platforms:', error.message);
    return [];
  }
}

// Delete user and all associated data
export async function deleteUser(userId, userEmail) {
  try {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete from user_tokens table (uses email as user_id)
      try {
        await client.query('DELETE FROM user_tokens WHERE user_id = $1', [userEmail]);
        console.log(`Deleted user tokens for email: ${userEmail}`);
      } catch (error) {
        console.log(`Error deleting from user_tokens: ${error.message}`);
      }
      
      // Delete from platform_history table (uses numeric user_id)
      try {
        await client.query('DELETE FROM platform_history WHERE user_id = $1', [userId]);
        console.log(`Deleted platform history for user: ${userId}`);
      } catch (error) {
        console.log(`Error deleting from platform_history: ${error.message}`);
      }
      

      
      // Finally, delete the user from users table
      const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
      await client.query('COMMIT');
      
      return result.rows.length > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting user:', error.message);
    return false;
  }
} 