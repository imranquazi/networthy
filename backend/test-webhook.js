import crypto from 'crypto';
import https from 'https';
import http from 'http';

// Test webhook payloads
const testPayloads = {
  youtube: {
    channelId: 'UCLfbUmGPCycFAXUQlh51ONw',
    subscriberCount: 1250,
    viewCount: 125000,
    videoCount: 15
  },
  twitch: {
    broadcasterUserId: 'beatsbyquazi',
    followerCount: 450,
    viewerCount: 25,
    isLive: true
  },
  tiktok: {
    openId: 'tiktok_user_123',
    followerCount: 890,
    videoCount: 12,
    likeCount: 15000
  }
};

// Generate webhook signature
function generateSignature(platform, payload, secret) {
  const timestamp = Date.now().toString();
  const payloadString = JSON.stringify(payload);
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payloadString}`)
    .digest('hex');
    
  return { signature, timestamp };
}

// Make HTTP request
function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const req = client.request(urlObj, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Test webhook endpoints
async function testWebhook(platform, payload) {
  const secret = process.env[`${platform.toUpperCase()}_WEBHOOK_SECRET`] || `${platform}_secret`;
  const { signature, timestamp } = generateSignature(platform, payload, secret);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'signature': signature,
      'timestamp': timestamp
    },
    body: JSON.stringify(payload)
  };
  
  try {
    const result = await makeRequest(`http://localhost:4000/api/webhooks/${platform}`, options);
    console.log(`✅ ${platform.toUpperCase()} webhook test:`, result);
    return result;
  } catch (error) {
    console.error(`❌ ${platform.toUpperCase()} webhook test failed:`, error.message);
    return null;
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Testing webhook endpoints...\n');
  
  try {
    // Test YouTube webhook
    await testWebhook('youtube', testPayloads.youtube);
    
    // Test Twitch webhook
    await testWebhook('twitch', testPayloads.twitch);
    
    // Test TikTok webhook
    await testWebhook('tiktok', testPayloads.tiktok);
    
    console.log('\n🎉 All webhook tests completed!');
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
} 