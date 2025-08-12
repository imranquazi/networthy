import crypto from 'crypto';
import https from 'https';
import http from 'http';

// Test real-time webhook flow
async function testRealTimeFlow() {
  console.log('🧪 Testing real-time webhook flow...\n');
  
  // 1. Test webhook endpoint
  console.log('1️⃣ Testing YouTube webhook...');
  const youtubePayload = {
    channelId: 'UCLfbUmGPCycFAXUQlh51ONw',
    subscriberCount: 1500, // Updated count
    viewCount: 150000,     // Updated count
    videoCount: 18         // Updated count
  };
  
  const secret = process.env.YOUTUBE_WEBHOOK_SECRET || 'youtube_secret';
  const timestamp = Date.now().toString();
  const payloadString = JSON.stringify(youtubePayload);
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payloadString}`)
    .digest('hex');
  
  // Make webhook request
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'signature': signature,
      'timestamp': timestamp
    },
    body: payloadString
  };
  
  try {
    const result = await makeRequest('http://localhost:4000/api/webhooks/youtube', options);
    console.log('✅ Webhook processed:', result.data);
    
    if (result.data.success && result.data.usersUpdated > 0) {
      console.log('✅ Real-time update broadcasted to users');
    } else {
      console.log('⚠️ No users found for this update');
    }
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
  }
  
  // 2. Test SSE endpoint
  console.log('\n2️⃣ Testing SSE endpoint...');
  try {
    const sseResult = await makeRequest('http://localhost:4000/api/websocket', {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });
    console.log('✅ SSE endpoint responding:', sseResult.status);
  } catch (error) {
    console.error('❌ SSE test failed:', error.message);
  }
  
  // 3. Test health endpoint with webhook info
  console.log('\n3️⃣ Testing health endpoint...');
  try {
    const healthResult = await makeRequest('http://localhost:4000/api/health', {
      method: 'GET'
    });
    console.log('✅ Health check:', healthResult.data);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
  
  console.log('\n🎉 Real-time flow test completed!');
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

// Run test
testRealTimeFlow(); 