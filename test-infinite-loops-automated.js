// Automated test for infinite loops and SSE issues
const puppeteer = require('puppeteer');

async function testInfiniteLoops() {
  console.log('🧪 Starting automated infinite loop test...');
  
  const browser = await puppeteer.launch({ 
    headless: false, 
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  
  // Track API calls and redirects
  let apiCallCount = 0;
  let redirectCount = 0;
  let sseDisconnectCount = 0;
  let lastApiCallTime = 0;
  let rapidApiCalls = 0;
  
  // Monitor network requests
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/auth/me') || url.includes('/api/platforms')) {
      apiCallCount++;
      const now = Date.now();
      const timeSinceLastCall = now - lastApiCallTime;
      lastApiCallTime = now;
      
      console.log(`📡 API Call #${apiCallCount}: ${url} (${timeSinceLastCall}ms since last)`);
      
      if (timeSinceLastCall < 1000 && apiCallCount > 5) {
        rapidApiCalls++;
        console.warn(`⚠️  RAPID API CALL DETECTED: ${timeSinceLastCall}ms since last`);
      }
    }
  });
  
  // Monitor console logs for SSE disconnects
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('SSE client disconnected')) {
      sseDisconnectCount++;
      console.log(`🔌 SSE Disconnect #${sseDisconnectCount}: ${text}`);
    }
  });
  
  // Monitor page navigation
  page.on('framenavigated', frame => {
    if (frame === page.mainFrame()) {
      redirectCount++;
      console.log(`🔄 Redirect #${redirectCount}: ${frame.url()}`);
    }
  });
  
  try {
    // Navigate to dashboard
    console.log('🌐 Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
    
    // Wait for initial load
    await page.waitForTimeout(3000);
    
    // Monitor for 30 seconds
    console.log('⏱️  Monitoring for 30 seconds...');
    await page.waitForTimeout(30000);
    
    // Check results
    console.log('\n📊 Test Results:');
    console.log(`Total API calls: ${apiCallCount}`);
    console.log(`Total redirects: ${redirectCount}`);
    console.log(`SSE disconnects: ${sseDisconnectCount}`);
    console.log(`Rapid API calls: ${rapidApiCalls}`);
    
    // Determine if there are issues
    let hasIssues = false;
    
    if (apiCallCount > 20) {
      console.error('❌ HIGH API CALL COUNT - Potential infinite loop!');
      hasIssues = true;
    } else if (apiCallCount > 10) {
      console.warn('⚠️  MODERATE API CALL COUNT - Monitor closely');
    } else {
      console.log('✅ API call count looks normal');
    }
    
    if (redirectCount > 10) {
      console.error('❌ HIGH REDIRECT COUNT - Potential infinite loop!');
      hasIssues = true;
    } else if (redirectCount > 5) {
      console.warn('⚠️  MODERATE REDIRECT COUNT - Monitor closely');
    } else {
      console.log('✅ Redirect count looks normal');
    }
    
    if (sseDisconnectCount > 5) {
      console.error('❌ HIGH SSE DISCONNECT COUNT - Connection issues!');
      hasIssues = true;
    } else if (sseDisconnectCount > 2) {
      console.warn('⚠️  MODERATE SSE DISCONNECT COUNT - Monitor closely');
    } else {
      console.log('✅ SSE disconnect count looks normal');
    }
    
    if (rapidApiCalls > 0) {
      console.error('❌ RAPID API CALLS DETECTED - Potential infinite loop!');
      hasIssues = true;
    } else {
      console.log('✅ No rapid API calls detected');
    }
    
    if (hasIssues) {
      console.log('\n❌ TEST FAILED: Issues detected');
      process.exit(1);
    } else {
      console.log('\n✅ TEST PASSED: No infinite loops or SSE issues detected');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

// Run the test
testInfiniteLoops().catch(console.error);
