import { OAuth2Client } from 'google-auth-library';
import passport from 'passport';
import { Strategy as TwitchStrategy } from 'passport-twitch-new';import axios from 'axios';
import crypto from 'crypto';
import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.PG_CONNECTION_STRING });
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export async function storeToken(userId, platform, tokenObj) {
  const encrypted = encrypt(JSON.stringify(tokenObj));
  await pool.query(
    `INSERT INTO user_tokens (user_id, platform, token) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, platform) DO UPDATE SET token = EXCLUDED.token`,
    [userId, platform, encrypted]
  );
}

export async function getToken(userId, platform) {
  const res = await pool.query(
    'SELECT token FROM user_tokens WHERE user_id = $1 AND platform = $2',
    [userId, platform]
  );
  if (res.rows.length === 0) return null;
  return JSON.parse(decrypt(res.rows[0].token));
}

// Google OAuth2 (YouTube)
export const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Twitch OAuth (passport strategy)
export function setupTwitchPassport() {
  passport.use(new TwitchStrategy({
    clientID: process.env.TWITCH_CLIENT_ID,
    clientSecret: process.env.TWITCH_CLIENT_SECRET,
    callbackURL: process.env.TWITCH_REDIRECT_URI,
    scope: [
      'user:read:email',
      'analytics:read:games',
      'channel:read:subscriptions'
    ]
  }, async (accessToken, refreshToken, profile, done) => {
    // You can store tokens here if needed
    done(null, { accessToken, refreshToken, profile });
  }));
}

// TikTok OAuth (manual)
export async function getTikTokToken(code) {
  const res = await axios.post('https://open-api.tiktok.com/oauth/access_token/', {
    client_key: process.env.TIKTOK_CLIENT_KEY,
    client_secret: process.env.TIKTOK_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: process.env.TIKTOK_REDIRECT_URI
  });
  return res.data.data;
} 