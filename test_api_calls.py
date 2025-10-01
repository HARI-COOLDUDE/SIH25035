#!/usr/bin/env python3
"""
Test script to simulate the API calls that the frontend makes
"""

import requests
import json

def test_api_calls():
    """Test all the API endpoints that the frontend uses"""
    base_url = "http://localhost:8000"
    
    tests = [
        ("GET", "/health", None, "Backend health check"),
        ("GET", "/api/health", None, "API health check"),
        ("GET", "/api/comments", None, "Get all comments"),
        ("GET", "/api/dashboard", None, "Get dashboard stats"),
        ("POST", "/api/comments", {
            "stakeholder_type": "citizen",
            "raw_text": "This is a test comment to check if the API is working properly."
        }, "Submit test comment"),
    ]
    
    print("🧪 Testing API endpoints that frontend uses...\n")
    
    for method, endpoint, data, description in tests:
        url = f"{base_url}{endpoint}"
        print(f"Testing: {description}")
        print(f"  {method} {url}")
        
        try:
            if method == "GET":
                response = requests.get(url, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, timeout=10)
            
            print(f"  Status: {response.status_code}")
            
            if response.status_code == 200:
                print("  ✅ Success")
                if endpoint == "/api/comments" and method == "GET":
                    data = response.json()
                    print(f"  📊 Found {len(data)} comments")
                elif endpoint == "/api/dashboard":
                    try:
                        data = response.json()
                        print(f"  📊 Total comments: {data.get('total_comments', 'N/A')}")
                    except:
                        print("  ❌ Dashboard endpoint exists but returns invalid JSON")
                elif endpoint == "/api/comments" and method == "POST":
                    data = response.json()
                    print(f"  📝 Comment processed with sentiment: {data.get('sentiment_label', 'N/A')}")
            else:
                print(f"  ❌ Failed with status {response.status_code}")
                if response.text:
                    print(f"  Error: {response.text[:200]}")
                    
        except requests.exceptions.ConnectionError:
            print(f"  ❌ Connection failed - server not running?")
        except requests.exceptions.Timeout:
            print(f"  ❌ Request timed out")
        except Exception as e:
            print(f"  ❌ Error: {e}")
        
        print()

def test_cors():
    """Test CORS headers"""
    print("🌐 Testing CORS configuration...\n")
    
    try:
        response = requests.options("http://localhost:8000/api/comments", 
                                  headers={
                                      "Origin": "http://localhost:3000",
                                      "Access-Control-Request-Method": "POST",
                                      "Access-Control-Request-Headers": "Content-Type"
                                  })
        
        print(f"CORS preflight status: {response.status_code}")
        
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
            "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
        }
        
        print("CORS Headers:")
        for header, value in cors_headers.items():
            if value:
                print(f"  ✅ {header}: {value}")
            else:
                print(f"  ❌ {header}: Not set")
                
    except Exception as e:
        print(f"❌ CORS test failed: {e}")

if __name__ == "__main__":
    test_api_calls()
    test_cors()