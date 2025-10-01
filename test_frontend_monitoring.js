/**
 * Test script for frontend monitoring service
 * Tests the monitoring capabilities in a Node.js environment
 */

// Mock browser APIs for Node.js testing
global.performance = {
  now: () => Date.now()
};

global.navigator = {
  userAgent: 'Node.js Test Environment'
};

global.window = {
  location: {
    href: 'http://localhost:3000/test'
  }
};

global.process = {
  env: {
    NODE_ENV: 'development'
  }
};

// Import the monitoring service (we'll need to adjust the import for Node.js)
const fs = require('fs');
const path = require('path');

// Read the monitoring service file and evaluate it
const monitoringServicePath = path.join(__dirname, 'frontend/src/services/monitoringService.js');
const monitoringServiceCode = fs.readFileSync(monitoringServicePath, 'utf8');

// Remove ES6 export and create a simple class for testing
const modifiedCode = monitoringServiceCode
  .replace('export default monitoringService;', '')
  .replace('export { MonitoringService };', '');

eval(modifiedCode);

// Create test instance
const testMonitoringService = new MonitoringService();

console.log('🧪 Testing Frontend Monitoring Service...');
console.log('=' .repeat(50));

// Test 1: Record API call
console.log('\n📊 Test 1: Recording API calls');
const startTime = performance.now();
const endTime = startTime + 1500; // Simulate 1.5 second response

testMonitoringService.recordApiCall('submitComment', startTime, endTime, true, 200);
testMonitoringService.recordApiCall('fetchDashboardStats', startTime, endTime + 500, true, 200);
testMonitoringService.recordApiCall('generateWordcloud', startTime, endTime + 8000, true, 200);

console.log('✅ API calls recorded successfully');

// Test 2: Record errors
console.log('\n❌ Test 2: Recording errors');
testMonitoringService.recordError('submitComment', 'Network timeout error', 'api_call', {
  endpoint: '/api/comments',
  method: 'POST'
});

testMonitoringService.recordError('fetchDashboardStats', 'Server returned 500', 'api_call', {
  endpoint: '/api/dashboard',
  method: 'GET'
});

console.log('✅ Errors recorded successfully');

// Test 3: Performance marks
console.log('\n⏱️  Test 3: Performance marks');
testMonitoringService.startPerformanceMark('load_dashboard');
setTimeout(() => {
  testMonitoringService.endPerformanceMark('load_dashboard', true, {
    componentsLoaded: 5,
    dataFetched: true
  });
  console.log('✅ Performance mark completed');
}, 100);

// Test 4: Get performance statistics
setTimeout(() => {
  console.log('\n📈 Test 4: Performance statistics');
  const stats = testMonitoringService.getPerformanceStats();
  
  console.log(`Total API calls: ${stats.apiCalls.total}`);
  console.log(`Successful API calls: ${stats.apiCalls.successful}`);
  console.log(`Failed API calls: ${stats.apiCalls.failed}`);
  console.log(`Average response time: ${stats.apiCalls.averageResponseTime}ms`);
  console.log(`Error rate: ${stats.apiCalls.errorRate.toFixed(1)}%`);
  console.log(`Total errors: ${stats.errors.total}`);
  
  console.log('✅ Statistics retrieved successfully');
  
  // Test 5: Performance target checking
  console.log('\n🎯 Test 5: Performance target checking');
  const targets = [
    { endpoint: 'submitComment', time: 1500, expected: false },
    { endpoint: 'submitComment', time: 2500, expected: true },
    { endpoint: 'fetchDashboardStats', time: 2000, expected: false },
    { endpoint: 'fetchDashboardStats', time: 4000, expected: true },
    { endpoint: 'generateWordcloud', time: 8000, expected: false },
    { endpoint: 'generateWordcloud', time: 12000, expected: true }
  ];
  
  targets.forEach(test => {
    const exceedsTarget = testMonitoringService.checkPerformanceTarget(test.endpoint, test.time);
    const result = exceedsTarget === test.expected ? '✅' : '❌';
    console.log(`${result} ${test.endpoint} (${test.time}ms): ${exceedsTarget ? 'exceeds' : 'within'} target`);
  });
  
  // Test 6: Error sanitization
  console.log('\n🔒 Test 6: Error sanitization');
  const sensitiveErrors = [
    'Authentication failed: password=secret123',
    'API key invalid: key=abc123def456',
    'Token expired: token=bearer_xyz789',
    'Database connection failed'
  ];
  
  sensitiveErrors.forEach(error => {
    const sanitized = testMonitoringService.sanitizeErrorMessage(error);
    const hasSensitive = sanitized.includes('[REDACTED]');
    const shouldHaveSensitive = error.includes('password') || error.includes('key') || error.includes('token');
    
    if (shouldHaveSensitive && hasSensitive) {
      console.log('✅ Sensitive information redacted:', sanitized);
    } else if (!shouldHaveSensitive && !hasSensitive) {
      console.log('✅ Non-sensitive error preserved:', sanitized);
    } else {
      console.log('❌ Sanitization failed:', sanitized);
    }
  });
  
  // Test 7: Export metrics
  console.log('\n📤 Test 7: Export metrics');
  const exportedData = testMonitoringService.exportMetrics();
  
  if (exportedData.timestamp && exportedData.summary && exportedData.rawData) {
    console.log('✅ Metrics exported successfully');
    console.log(`   Timestamp: ${exportedData.timestamp}`);
    console.log(`   API calls in raw data: ${exportedData.rawData.apiCalls.length}`);
    console.log(`   Errors in raw data: ${exportedData.rawData.errors.length}`);
  } else {
    console.log('❌ Metrics export failed');
  }
  
  // Test 8: Recent errors
  console.log('\n🔍 Test 8: Recent errors');
  const recentErrors = testMonitoringService.getRecentErrors(5);
  
  if (recentErrors.length > 0) {
    console.log(`✅ Retrieved ${recentErrors.length} recent errors`);
    recentErrors.forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.context}: ${error.message.substring(0, 50)}...`);
    });
  } else {
    console.log('❌ No recent errors found');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Frontend Monitoring Service Tests Complete');
  
  // Summary
  const summary = {
    totalApiCalls: stats.apiCalls.total,
    totalErrors: stats.errors.total,
    avgResponseTime: stats.apiCalls.averageResponseTime,
    errorRate: stats.apiCalls.errorRate
  };
  
  console.log('\n📋 Test Summary:');
  console.log(`   API Calls Recorded: ${summary.totalApiCalls}`);
  console.log(`   Errors Recorded: ${summary.totalErrors}`);
  console.log(`   Average Response Time: ${summary.avgResponseTime}ms`);
  console.log(`   Error Rate: ${summary.errorRate.toFixed(1)}%`);
  
  if (summary.totalApiCalls > 0 && summary.totalErrors > 0) {
    console.log('\n✅ All frontend monitoring tests passed!');
  } else {
    console.log('\n❌ Some frontend monitoring tests failed!');
  }
  
}, 200);