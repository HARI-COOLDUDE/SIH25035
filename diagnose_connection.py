#!/usr/bin/env python3
"""
Comprehensive Connection Diagnostic Script
Tests all API endpoints and connection issues
"""

import requests
import json
import time

def test_backend_endpoints():
    """Test all backend API endpoints"""
    base_url = "http://localhost:8000"
    
    endpoints = [
        {"path": "/", "method": "GET", "description": "Root endpoint"},
        {"path": "/api/health", "method": "GET", "description": "Health check"},
        {"path": "/api/comments", "method": "GET", "description": "Get comments"},
        {"path": "/api/dashboard", "method": "GET", "description": "Dashboard stats"},
        {"path": "/api/wordcloud", "method": "GET", "description": "Word cloud"},
        {"path": "/docs", "method": "GET", "description": "API documentation"},
    ]
    
    print("🔍 Testing Backend API Endpoints")
    print("=" * 50)
    
    for endpoint in endpoints:
        url = f"{base_url}{endpoint['path']}"
        try:
            response = requests.get(url, timeout=5)
            status = "✅" if response.status_code == 200 else "⚠️" if response.status_code < 500 else "❌"
            print(f"{status} {endpoint['method']} {endpoint['path']} - {response.status_code} - {endpoint['description']}")
            
            if endpoint['path'] == '/api/comments' and response.status_code == 200:
                try:
                    data = response.json()
                    print(f"   📊 Comments found: {len(data) if isinstance(data, list) else 'N/A'}")
                except:
                    print("   ⚠️ Invalid JSON response")
                    
        except requests.exceptions.ConnectionError:
            print(f"❌ {endpoint['method']} {endpoint['path']} - Connection refused - {endpoint['description']}")
        except requests.exceptions.Timeout:
            print(f"⏱️ {endpoint['method']} {endpoint['path']} - Timeout - {endpoint['description']}")
        except Exception as e:
            print(f"❌ {endpoint['method']} {endpoint['path']} - Error: {e} - {endpoint['description']}")

def test_cors_and_proxy():
    """Test CORS and proxy configuration"""
    print("\n🌐 Testing CORS and Proxy Configuration")
    print("=" * 50)
    
    # Test CORS headers
    try:
        response = requests.options("http://localhost:8000/api/comments", timeout=5)
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
        }
        
        print("CORS Headers:")
        for header, value in cors_headers.items():
            status = "✅" if value else "❌"
            print(f"  {status} {header}: {value or 'Not set'}")
            
    except Exception as e:
        print(f"❌ CORS test failed: {e}")

def test_sample_api_call():
    """Test a sample API call like the frontend would make"""
    print("\n🧪 Testing Sample API Calls")
    print("=" * 50)
    
    # Test comment submission
    test_comment = {
        "stakeholder_type": "citizen",
        "raw_text": "This is a test comment for diagnostic purposes."
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/comments",
            json=test_comment,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Comment submission test - SUCCESS")
            try:
                data = response.json()
                print(f"   📝 Response: {json.dumps(data, indent=2)}")
            except:
                print("   ⚠️ Response is not valid JSON")
        else:
            print(f"❌ Comment submission test - FAILED ({response.status_code})")
            print(f"   📝 Response: {response.text[:200]}...")
            
    except Exception as e:
        print(f"❌ Comment submission test - ERROR: {e}")

def check_frontend_backend_communication():
    """Check if frontend can communicate with backend"""
    print("\n🔗 Testing Frontend-Backend Communication")
    print("=" * 50)
    
    # Check if frontend is making requests to the right URL
    frontend_api_url = "http://localhost:3000"
    backend_api_url = "http://localhost:8000"
    
    try:
        # Test if frontend is accessible
        frontend_response = requests.get(frontend_api_url, timeout=5)
        if frontend_response.status_code == 200:
            print("✅ Frontend is accessible")
        else:
            print(f"⚠️ Frontend returned status: {frontend_response.status_code}")
    except:
        print("❌ Frontend is not accessible")
    
    try:
        # Test if backend is accessible
        backend_response = requests.get(f"{backend_api_url}/api/health", timeout=5)
        if backend_response.status_code == 200:
            print("✅ Backend is accessible")
        else:
            print(f"⚠️ Backend returned status: {backend_response.status_code}")
    except:
        print("❌ Backend is not accessible")

def main():
    """Main diagnostic function"""
    print("🏥 eConsultation AI - Connection Diagnostic")
    print("=" * 60)
    print(f"⏰ Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    test_backend_endpoints()
    test_cors_and_proxy()
    test_sample_api_call()
    check_frontend_backend_communication()
    
    print("\n" + "=" * 60)
    print("🎯 Diagnostic Summary:")
    print("1. Check the ✅ and ❌ marks above")
    print("2. If backend endpoints are failing, restart the backend")
    print("3. If CORS headers are missing, check backend CORS configuration")
    print("4. If API calls fail, check the backend logs")
    print("\n💡 Next steps:")
    print("- Backend: python backend/app.py")
    print("- Frontend: cd frontend && npm start")
    print("- Check browser console for JavaScript errors")

if __name__ == "__main__":
    main()