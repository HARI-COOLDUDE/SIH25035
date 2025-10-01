#!/usr/bin/env python3
"""
Test script to check what the frontend is actually serving
"""

import requests
import json

def test_frontend():
    """Test frontend response"""
    try:
        print("Testing frontend at http://localhost:3000...")
        response = requests.get("http://localhost:3000", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'Not specified')}")
        print(f"Content Length: {len(response.text)} characters")
        
        if response.status_code == 200:
            print("\n✅ Frontend is serving content successfully")
            
            # Check if it's the expected HTML
            if "eConsultation AI" in response.text and "root" in response.text:
                print("✅ HTML contains expected content")
            else:
                print("❌ HTML doesn't contain expected content")
                print("First 500 characters:")
                print(response.text[:500])
        else:
            print(f"❌ Frontend returned status code: {response.status_code}")
            print("Response content:")
            print(response.text[:500])
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to frontend at http://localhost:3000")
        print("Make sure the frontend development server is running")
    except Exception as e:
        print(f"❌ Error testing frontend: {e}")

def test_backend():
    """Test backend response"""
    try:
        print("\nTesting backend at http://localhost:8000...")
        response = requests.get("http://localhost:8000/health", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Content-Type: {response.headers.get('content-type', 'Not specified')}")
        
        if response.status_code == 200:
            print("✅ Backend is healthy")
            data = response.json()
            print(f"Database status: {data.get('database', 'unknown')}")
            print(f"Comment count: {data.get('comment_count', 'unknown')}")
        else:
            print(f"❌ Backend returned status code: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend at http://localhost:8000")
        print("Make sure the backend server is running")
    except Exception as e:
        print(f"❌ Error testing backend: {e}")

def test_api_endpoint():
    """Test a specific API endpoint"""
    try:
        print("\nTesting API endpoint /api/comments...")
        response = requests.get("http://localhost:8000/api/comments", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API returned {len(data)} comments")
        else:
            print(f"❌ API returned status code: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error testing API: {e}")

if __name__ == "__main__":
    test_frontend()
    test_backend()
    test_api_endpoint()