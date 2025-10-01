#!/usr/bin/env python3
"""
Test Website Functionality
Comprehensive test of all website features
"""

import requests
import json
import time

def test_all_features():
    """Test all website features that the frontend uses"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing All Website Features")
    print("=" * 50)
    
    # Test 1: Dashboard data
    print("1. Testing Dashboard Data...")
    try:
        response = requests.get(f"{base_url}/api/dashboard")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Dashboard: {data.get('total_comments', 0)} comments")
            print(f"   📊 Positive: {data.get('positive_percentage', 0):.1f}%")
            print(f"   📊 Negative: {data.get('negative_percentage', 0):.1f}%")
            print(f"   📊 Neutral: {data.get('neutral_percentage', 0):.1f}%")
        else:
            print(f"   ❌ Dashboard failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Dashboard error: {e}")
    
    # Test 2: Comments list
    print("\n2. Testing Comments List...")
    try:
        response = requests.get(f"{base_url}/api/comments?limit=5")
        if response.status_code == 200:
            comments = response.json()
            print(f"   ✅ Comments: {len(comments)} loaded")
            if comments:
                print(f"   📝 Sample: '{comments[0].get('raw_text', '')[:50]}...'")
        else:
            print(f"   ❌ Comments failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Comments error: {e}")
    
    # Test 3: Comment submission
    print("\n3. Testing Comment Submission...")
    test_comment = {
        "stakeholder_type": "citizen",
        "raw_text": "This is a comprehensive test of the website functionality. The system should analyze this comment and provide sentiment analysis."
    }
    
    try:
        response = requests.post(
            f"{base_url}/api/comments",
            json=test_comment,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Submission successful")
            print(f"   🎯 Sentiment: {data.get('sentiment_label')} ({data.get('sentiment_score', 0)*100:.1f}%)")
            print(f"   📄 Summary: {data.get('summary', '')[:50]}...")
        else:
            print(f"   ❌ Submission failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Submission error: {e}")
    
    # Test 4: Word cloud generation
    print("\n4. Testing Word Cloud Generation...")
    try:
        response = requests.get(f"{base_url}/api/wordcloud")
        if response.status_code == 200:
            print(f"   ✅ Word cloud generated ({len(response.content)} bytes)")
        else:
            print(f"   ❌ Word cloud failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Word cloud error: {e}")
    
    # Test 5: CSV bulk upload simulation
    print("\n5. Testing CSV Upload Capability...")
    csv_data = """stakeholder_type,raw_text
citizen,"I support this policy initiative."
business,"This will impact our operations significantly."
ngo,"We need more environmental considerations."
academic,"The research shows mixed results."
"""
    
    try:
        files = {'file': ('test.csv', csv_data, 'text/csv')}
        response = requests.post(f"{base_url}/api/comments/bulk", files=files)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ CSV upload successful: {len(data.get('comments', []))} comments processed")
        else:
            print(f"   ❌ CSV upload failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ CSV upload error: {e}")

def check_frontend_status():
    """Check if frontend is accessible"""
    print("\n🌐 Checking Frontend Status")
    print("=" * 30)
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is accessible at http://localhost:3000")
            
            # Check if it contains React content
            if "react" in response.text.lower() or "root" in response.text:
                print("✅ Frontend appears to be a React application")
            else:
                print("⚠️ Frontend content may not be loading properly")
        else:
            print(f"⚠️ Frontend returned status: {response.status_code}")
    except Exception as e:
        print(f"❌ Frontend not accessible: {e}")

def main():
    """Main test function"""
    print("🔍 eConsultation AI - Complete Functionality Test")
    print("=" * 60)
    print(f"⏰ Test time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    check_frontend_status()
    test_all_features()
    
    print("\n" + "=" * 60)
    print("🎯 Test Summary:")
    print("✅ = Feature working correctly")
    print("❌ = Feature has issues")
    print("⚠️ = Feature partially working")
    
    print("\n💡 If most features show ✅, your website should work properly!")
    print("🌐 Visit: http://localhost:3000")
    print("📚 API Docs: http://localhost:8000/docs")

if __name__ == "__main__":
    main()