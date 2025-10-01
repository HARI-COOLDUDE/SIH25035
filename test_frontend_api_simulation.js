/**
 * Simulate the exact API calls that the frontend makes
 * This will help identify if there's a specific issue with the frontend's API service
 */

// Simulate the frontend's API service behavior
const API_BASE_URL = 'http://localhost:3000/api'; // This might be the issue!

async function simulateFrontendApiCall() {
    console.log('🔍 Simulating frontend API calls...\n');
    
    // Test 1: Try the frontend's expected URL
    console.log('1. Testing frontend expected URL (http://localhost:3000/api/comments)...');
    try {
        const response = await fetch('http://localhost:3000/api/comments');
        console.log('✅ Frontend URL works:', response.status);
    } catch (error) {
        console.log('❌ Frontend URL failed:', error.message);
    }
    
    // Test 2: Try the correct backend URL
    console.log('\n2. Testing correct backend URL (http://localhost:8000/api/comments)...');
    try {
        const response = await fetch('http://localhost:8000/api/comments');
        const data = await response.json();
        console.log(`✅ Backend URL works: ${data.length} comments`);
    } catch (error) {
        console.log('❌ Backend URL failed:', error.message);
    }
    
    // Test 3: Check if there's a proxy configuration issue
    console.log('\n3. Checking for proxy configuration...');
    try {
        // This simulates what Create React App might do with a proxy
        const response = await fetch('/api/comments');
        const data = await response.json();
        console.log(`✅ Proxy URL works: ${data.length} comments`);
    } catch (error) {
        console.log('❌ Proxy URL failed:', error.message);
    }
}

simulateFrontendApiCall().catch(console.error);