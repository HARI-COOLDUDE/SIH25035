"""
Connection Test Script
Tests if the backend server is working properly
"""
import requests
import json
import time

def test_backend_connection():
    """Test backend API endpoints"""
    print("🔍 Testing Backend Connection...")
    
    base_url = "http://localhost:8000"
    
    tests = [
        ("Health Check", f"{base_url}/", "GET"),
        ("Comments List", f"{base_url}/api/comments", "GET"),
        ("Dashboard Stats", f"{base_url}/api/dashboard", "GET"),
    ]
    
    all_passed = True
    
    for test_name, url, method in tests:
        try:
            print(f"\n📡 Testing {test_name}: {url}")
            
            if method == "GET":
                response = requests.get(url, timeout=5)
            else:
                response = requests.post(url, timeout=5)
            
            if response.status_code == 200:
                print(f"✅ {test_name}: SUCCESS (Status: {response.status_code})")
                try:
                    data = response.json()
                    print(f"   📄 Response: {json.dumps(data, indent=2)[:100]}...")
                except:
                    print(f"   📄 Response: {response.text[:100]}...")
            else:
                print(f"⚠️  {test_name}: WARNING (Status: {response.status_code})")
                print(f"   📄 Response: {response.text[:100]}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ {test_name}: CONNECTION FAILED")
            print(f"   💡 Backend server not running or not accessible")
            all_passed = False
            
        except requests.exceptions.Timeout:
            print(f"⏱️  {test_name}: TIMEOUT")
            print(f"   💡 Server is running but responding slowly")
            all_passed = False
            
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {str(e)}")
            all_passed = False
    
    print("\n" + "="*50)
    if all_passed:
        print("🎉 ALL TESTS PASSED!")
        print("✅ Backend is working correctly")
        print("✅ Frontend should connect successfully")
    else:
        print("⚠️  SOME TESTS FAILED")
        print("💡 Check the issues above before starting frontend")
    
    print("\n🔧 TROUBLESHOOTING STEPS:")
    print("1. Make sure backend is running:")
    print("   uvicorn app:app --reload --host 0.0.0.0 --port 8000")
    print("2. Check if port 8000 is available")
    print("3. Verify no firewall is blocking connections")
    print("4. Try visiting http://localhost:8000 in your browser")

def test_sample_api_call():
    """Test submitting a sample comment"""
    print("\n🧪 Testing Sample Comment Submission...")
    
    try:
        url = "http://localhost:8000/api/comments"
        test_comment = {
            "stakeholder_type": "citizen",
            "raw_text": "This is a test comment to verify the API is working properly."
        }
        
        response = requests.post(url, json=test_comment, timeout=10)
        
        if response.status_code == 200:
            print("✅ Comment submission: SUCCESS")
            data = response.json()
            print(f"   📊 Sentiment: {data.get('sentiment_label')} ({data.get('sentiment_score', 0)*100:.1f}%)")
            print(f"   📝 Summary: {data.get('summary', 'N/A')[:50]}...")
        else:
            print(f"❌ Comment submission: FAILED (Status: {response.status_code})")
            print(f"   📄 Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Comment submission: ERROR - {str(e)}")

if __name__ == "__main__":
    test_backend_connection()
    test_sample_api_call()
    
    print("\n🚀 If all tests pass, your frontend should work!")
    print("   Start frontend with: npm start")