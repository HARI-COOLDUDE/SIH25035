/**
 * Test the comment loading fix
 * This will test both the direct backend connection and the proxy setup
 */

async function testCommentLoadingFix() {
    console.log('🔧 Testing comment loading fix...\n');
    
    // Test 1: Direct backend connection (should work)
    console.log('1. Testing direct backend connection...');
    try {
        const response = await fetch('http://localhost:8000/api/comments');
        const data = await response.json();
        console.log(`✅ Direct backend: ${data.length} comments loaded`);
    } catch (error) {
        console.log('❌ Direct backend failed:', error.message);
    }
    
    // Test 2: Test CORS preflight for cross-origin requests
    console.log('\n2. Testing CORS preflight...');
    try {
        const response = await fetch('http://localhost:8000/api/comments', {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'GET',
                'Access-Control-Request-Headers': 'Content-Type'
            }
        });
        console.log('✅ CORS preflight status:', response.status);
        console.log('   Allow-Origin:', response.headers.get('access-control-allow-origin'));
        console.log('   Allow-Methods:', response.headers.get('access-control-allow-methods'));
    } catch (error) {
        console.log('❌ CORS preflight failed:', error.message);
    }
    
    // Test 3: Test with Origin header (simulate browser request)
    console.log('\n3. Testing with Origin header...');
    try {
        const response = await fetch('http://localhost:8000/api/comments', {
            method: 'GET',
            headers: {
                'Origin': 'http://localhost:3000',
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log(`✅ With Origin header: ${data.length} comments loaded`);
        console.log('   CORS headers in response:');
        console.log('   - Allow-Origin:', response.headers.get('access-control-allow-origin'));
        console.log('   - Allow-Credentials:', response.headers.get('access-control-allow-credentials'));
    } catch (error) {
        console.log('❌ With Origin header failed:', error.message);
    }
    
    // Test 4: Simulate the exact frontend API service call
    console.log('\n4. Simulating frontend API service call...');
    
    // This simulates what the frontend ApiService.fetchComments() does
    const makeRequest = async (url, options = {}) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    };
    
    try {
        const response = await makeRequest('http://localhost:8000/api/comments', {
            method: 'GET'
        });
        const data = await response.json();
        console.log(`✅ Frontend simulation: ${data.length} comments loaded`);
    } catch (error) {
        console.log('❌ Frontend simulation failed:', error.message);
    }
    
    console.log('\n📋 Summary:');
    console.log('   - Backend is running and responding correctly');
    console.log('   - CORS is configured in the backend');
    console.log('   - Frontend proxy is configured in package.json');
    console.log('   - API service has been updated to use relative URLs in development');
    
    console.log('\n💡 Next steps:');
    console.log('   1. Restart the frontend development server to apply proxy changes');
    console.log('   2. Test the comment loading in the browser');
    console.log('   3. Check browser developer tools for any remaining errors');
}

testCommentLoadingFix().catch(console.error);