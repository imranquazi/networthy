// Simple test to check for infinite loops
// Run this in the browser console on the dashboard page

console.log('🔍 Starting infinite loop detection test...');

let apiCallCount = 0;
let redirectCount = 0;
let lastApiCallTime = 0;
let lastRedirectTime = 0;

// Track API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  if (typeof url === 'string' && (url.includes('/api/auth/me') || url.includes('/api/platforms'))) {
    apiCallCount++;
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCallTime;
    lastApiCallTime = now;
    
    console.log(`📡 API Call #${apiCallCount}: ${url} (${timeSinceLastCall}ms since last)`);
    
    // Check for rapid successive calls (potential infinite loop)
    if (timeSinceLastCall < 1000 && apiCallCount > 5) {
      console.warn('⚠️  POTENTIAL INFINITE LOOP DETECTED: Rapid API calls detected!');
    }
  }
  return originalFetch.apply(this, args);
};

// Track page redirects
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function(...args) {
  redirectCount++;
  const now = Date.now();
  const timeSinceLastRedirect = now - lastRedirectTime;
  lastRedirectTime = now;
  
  console.log(`🔄 Redirect #${redirectCount}: pushState (${timeSinceLastRedirect}ms since last)`);
  
  if (timeSinceLastRedirect < 1000 && redirectCount > 3) {
    console.warn('⚠️  POTENTIAL INFINITE LOOP DETECTED: Rapid redirects detected!');
  }
  
  return originalPushState.apply(this, args);
};

history.replaceState = function(...args) {
  redirectCount++;
  const now = Date.now();
  const timeSinceLastRedirect = now - lastRedirectTime;
  lastRedirectTime = now;
  
  console.log(`🔄 Redirect #${redirectCount}: replaceState (${timeSinceLastRedirect}ms since last)`);
  
  if (timeSinceLastRedirect < 1000 && redirectCount > 3) {
    console.warn('⚠️  POTENTIAL INFINITE LOOP DETECTED: Rapid redirects detected!');
  }
  
  return originalReplaceState.apply(this, args);
};

// Monitor for 30 seconds
setTimeout(() => {
  console.log('📊 Test Results:');
  console.log(`Total API calls: ${apiCallCount}`);
  console.log(`Total redirects: ${redirectCount}`);
  
  if (apiCallCount > 20) {
    console.error('❌ HIGH API CALL COUNT - Potential infinite loop!');
  } else if (apiCallCount > 10) {
    console.warn('⚠️  MODERATE API CALL COUNT - Monitor closely');
  } else {
    console.log('✅ API call count looks normal');
  }
  
  if (redirectCount > 10) {
    console.error('❌ HIGH REDIRECT COUNT - Potential infinite loop!');
  } else if (redirectCount > 5) {
    console.warn('⚠️  MODERATE REDIRECT COUNT - Monitor closely');
  } else {
    console.log('✅ Redirect count looks normal');
  }
  
  console.log('🔍 Test completed. Check the logs above for any warnings or errors.');
}, 30000);

console.log('✅ Test monitoring started. Will run for 30 seconds...');
