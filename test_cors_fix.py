#!/usr/bin/env python3
"""
Test CORS Fix
Quick test to verify CORS headers are working
"""

import requests
import json

def test_cors_headers():
    """Test CORS headers from backend"""
    print("🧪 Testing CORS Headers After Fix")
    print("=" * 40)
    
    try:
        # Test OPTIONS request (preflight)
        response = requests.options(
            "http://localhost:8000/api/comments",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            },
            timeout=5
        )
        
        print(f"OPTIONS Request Status: {response.status_code}")
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('access-control-allow-origin'),
            'Access-Control-Allow-Methods': response.headers.get('access-control-allow-methods'),
            'Access-Control-Allow-Headers': response.headers.get('access-control-allow-headers'),
            'Access-Control-Allow-Credentials': response.headers.get('access-control-allow-credentials'),
        }
        
        print("\nCORS Headers:")
        for header, value in cors_headers.items():
            status = "✅" if value else "❌"
            print(f"  {status} {header}: {value or 'Not set'}")
            
        # Test actual API call
        print("\n🔗 Testing API Call from Frontend Origin")
        api_response = requests.get(
            "http://localhost:8000/api/health",
            headers={"Origin": "http://localhost:3000"},
            timeout=5
        )
        
        if api_response.status_code == 200:
            print("✅ API call successful")
            print(f"   Response: {api_response.json()}")
        else:
            print(f"❌ API call failed: {api_response.status_code}")
            
    except Exception as e:
        print(f"❌ CORS test failed: {e}")

def test_frontend_api_simulation():
    """Simulate frontend API calls"""
    print("\n🎭 Simulating Frontend API Calls")
    print("=" * 40)
    
    # Test comment submission like frontend would do
    test_comment = {
        "stakeholder_type": "citizen",
        "raw_text": "Testing CORS fix with a sample comment."
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/comments",
            json=test_comment,
            headers={
                "Content-Type": "application/json",
                "Origin": "http://localhost:3000"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Comment submission works")
            data = response.json()
            print(f"   Sentiment: {data.get('sentiment_label')} ({data.get('sentiment_score', 0)*100:.1f}%)")
        else:
            print(f"❌ Comment submission failed: {response.status_code}")
            print(f"   Error: {response.text[:200]}")
            
    except Exception as e:
        print(f"❌ Comment submission error: {e}")

def main():
    """Main test function"""
    print("🔧 eConsultation AI - CORS Fix Verification")
    print("=" * 50)
    
    test_cors_headers()
    test_frontend_api_simulation()
    
    print("\n" + "=" * 50)
    print("💡 If you see ✅ marks above, the CORS fix is working!")
    print("🌐 Try refreshing your browser at http://localhost:3000")

if __name__ == "__main__":
    main()