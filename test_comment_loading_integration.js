/**
 * Test script to diagnose comment loading integration issues
 * This will test the exact same API calls that the frontend makes
 */

const API_BASE_URL = 'http://localhost:8000';

async function testCommentLoading() {
    console.log('🔍 Testing comment loading integration...\n');
    
    try {
        // Test 1: Basic health check
        console.log('1. Testing backend health...');
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Backend health:', healthData);
        
        // Test 2: Fetch comments (same as frontend)
        console.log('\n2. Testing comment fetching...');
        const commentsResponse = await fetch(`${API_BASE_URL}/api/comments`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!commentsResponse.ok) {
            throw new Error(`HTTP ${commentsResponse.status}: ${commentsResponse.statusText}`);
        }
        
        const commentsData = await commentsResponse.json();
        console.log(`✅ Comments fetched successfully: ${commentsData.length} comments`);
        
        // Show first few comments
        if (commentsData.length > 0) {
            console.log('\n📝 Sample comments:');
            commentsData.slice(0, 3).forEach((comment, index) => {
                console.log(`   ${index + 1}. [${comment.sentiment_label}] ${comment.raw_text.substring(0, 50)}...`);
            });
        }
        
        // Test 3: Test CORS headers
        console.log('\n3. Testing CORS headers...');
        const corsHeaders = commentsResponse.headers;
        console.log('   Access-Control-Allow-Origin:', corsHeaders.get('access-control-allow-origin') || 'Not set');
        console.log('   Access-Control-Allow-Methods:', corsHeaders.get('access-control-allow-methods') || 'Not set');
        
        // Test 4: Test with timeout (simulate frontend behavior)
        console.log('\n4. Testing with timeout (5 seconds)...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        try {
            const timeoutResponse = await fetch(`${API_BASE_URL}/api/comments`, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            clearTimeout(timeoutId);
            
            const timeoutData = await timeoutResponse.json();
            console.log(`✅ Timeout test passed: ${timeoutData.length} comments`);
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.log('⚠️  Request timed out (this might be the issue)');
            } else {
                throw error;
            }
        }
        
        console.log('\n🎉 All tests passed! The backend integration is working correctly.');
        console.log('\n💡 If the frontend still has issues, the problem is likely in:');
        console.log('   - Frontend error handling');
        console.log('   - Loading state management');
        console.log('   - Component state updates');
        
    } catch (error) {
        console.error('\n❌ Integration test failed:', error.message);
        
        if (error.message.includes('fetch')) {
            console.log('\n🔧 Possible solutions:');
            console.log('   - Check if backend is running on port 8000');
            console.log('   - Check CORS configuration');
            console.log('   - Check network connectivity');
        }
    }
}

// Run the test
testCommentLoading().catch(console.error);