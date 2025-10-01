#!/usr/bin/env python3
"""
Comprehensive test to verify that the 404 issue has been fixed
"""

import requests
import time
import json

def test_frontend_health():
    """Test if frontend is serving correctly"""
    print("🔍 Testing Frontend Health...")
    
    try:
        response = requests.get("http://localhost:3000", timeout=10)
        
        if response.status_code == 200:
            print("✅ Frontend is responding with status 200")
            
            # Check if HTML contains expected content
            html = response.text
            if "eConsultation AI" in html and "root" in html:
                print("✅ HTML contains expected content")
                return True
            else:
                print("❌ HTML doesn't contain expected content")
                return False
        else:
            print(f"❌ Frontend returned status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to frontend - is it running?")
        return False
    except Exception as e:
        print(f"❌ Frontend test error: {e}")
        return False

def test_backend_health():
    """Test if backend is working correctly"""
    print("\n🔍 Testing Backend Health...")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend is healthy")
            print(f"   Database: {data.get('database', 'unknown')}")
            print(f"   Comments: {data.get('comment_count', 'unknown')}")
            print(f"   Models: {data.get('models', {})}")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend - is it running?")
        return False
    except Exception as e:
        print(f"❌ Backend test error: {e}")
        return False

def test_api_endpoints():
    """Test critical API endpoints"""
    print("\n🔍 Testing API Endpoints...")
    
    endpoints = [
        ("/api/health", "API Health"),
        ("/api/comments", "Comments List"),
        ("/api/dashboard", "Dashboard Stats")
    ]
    
    all_passed = True
    
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"http://localhost:8000{endpoint}", timeout=10)
            if response.status_code == 200:
                print(f"✅ {name}: OK")
            else:
                print(f"❌ {name}: Status {response.status_code}")
                all_passed = False
        except Exception as e:
            print(f"❌ {name}: Error - {e}")
            all_passed = False
    
    return all_passed

def test_frontend_api_integration():
    """Test if frontend can communicate with backend"""
    print("\n🔍 Testing Frontend-Backend Integration...")
    
    # Test CORS
    try:
        response = requests.options(
            "http://localhost:8000/api/comments",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            origin = response.headers.get("Access-Control-Allow-Origin")
            if origin == "http://localhost:3000" or origin == "*":
                print("✅ CORS is properly configured")
                return True
            else:
                print(f"❌ CORS issue: Origin header is '{origin}'")
                return False
        else:
            print(f"❌ CORS preflight failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ CORS test error: {e}")
        return False

def test_javascript_compilation():
    """Test if the React app compiled successfully"""
    print("\n🔍 Testing JavaScript Compilation...")
    
    # Check if build directory exists and has the main JS file
    import os
    
    build_dir = "frontend/build"
    if os.path.exists(build_dir):
        print("✅ Build directory exists")
        
        # Look for main JS file
        static_js_dir = os.path.join(build_dir, "static", "js")
        if os.path.exists(static_js_dir):
            js_files = [f for f in os.listdir(static_js_dir) if f.startswith("main.") and f.endswith(".js")]
            if js_files:
                print(f"✅ Main JavaScript file found: {js_files[0]}")
                return True
            else:
                print("❌ Main JavaScript file not found")
                return False
        else:
            print("❌ Static JS directory not found")
            return False
    else:
        print("❌ Build directory not found")
        return False

def main():
    """Run all tests"""
    print("🚀 Comprehensive System Health Check")
    print("=" * 50)
    
    tests = [
        ("Frontend Health", test_frontend_health),
        ("Backend Health", test_backend_health),
        ("API Endpoints", test_api_endpoints),
        ("Frontend-Backend Integration", test_frontend_api_integration),
        ("JavaScript Compilation", test_javascript_compilation)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        results[test_name] = test_func()
    
    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    
    all_passed = True
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {test_name}: {status}")
        if not passed:
            all_passed = False
    
    print("\n" + "=" * 50)
    if all_passed:
        print("🎉 All tests passed! The system should be working correctly.")
        print("\n💡 If you're still seeing 404 errors:")
        print("   1. Try refreshing your browser (Ctrl+F5)")
        print("   2. Clear browser cache")
        print("   3. Check browser console for any remaining errors")
        print("   4. Make sure you're accessing http://localhost:3000")
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
        print("\n🔧 Troubleshooting steps:")
        print("   1. Make sure both frontend and backend servers are running")
        print("   2. Check for any error messages in the terminal")
        print("   3. Try restarting both servers")

if __name__ == "__main__":
    main()