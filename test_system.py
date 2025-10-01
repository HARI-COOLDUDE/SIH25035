#!/usr/bin/env python3
"""
System Test Script
Tests all components of the eConsultation AI system
"""

import requests
import time
import logging
import sys
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_backend_health():
    """Test backend health endpoint"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            logger.info("✅ Backend health check passed")
            logger.info(f"   Status: {data.get('status')}")
            logger.info(f"   Database: {data.get('database')}")
            logger.info(f"   Comment count: {data.get('comment_count')}")
            return True
        else:
            logger.error(f"❌ Backend health check failed: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Backend health check failed: {e}")
        return False

def test_frontend_health():
    """Test frontend health endpoint"""
    try:
        response = requests.get("http://localhost:3000/health", timeout=10)
        if response.status_code == 200:
            logger.info("✅ Frontend health check passed")
            return True
        else:
            logger.error(f"❌ Frontend health check failed: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Frontend health check failed: {e}")
        return False

def test_comment_submission():
    """Test comment submission API"""
    try:
        test_comment = {
            "stakeholder_type": "citizen",
            "raw_text": "This is a test comment to verify the AI system is working properly."
        }
        
        response = requests.post(
            "http://localhost:8000/api/comments",
            json=test_comment,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            logger.info("✅ Comment submission test passed")
            logger.info(f"   Comment ID: {data.get('id')}")
            logger.info(f"   Sentiment: {data.get('sentiment_label')} ({data.get('sentiment_score'):.3f})")
            logger.info(f"   Summary: {data.get('summary')[:50]}...")
            return True
        else:
            logger.error(f"❌ Comment submission test failed: {response.status_code}")
            logger.error(f"   Response: {response.text}")
            return False
    except Exception as e:
        logger.error(f"❌ Comment submission test failed: {e}")
        return False

def test_dashboard_api():
    """Test dashboard API"""
    try:
        response = requests.get("http://localhost:8000/api/dashboard", timeout=10)
        if response.status_code == 200:
            data = response.json()
            logger.info("✅ Dashboard API test passed")
            logger.info(f"   Total comments: {data.get('total_comments')}")
            logger.info(f"   Positive: {data.get('positive_percentage'):.1f}%")
            logger.info(f"   Neutral: {data.get('neutral_percentage'):.1f}%")
            logger.info(f"   Negative: {data.get('negative_percentage'):.1f}%")
            return True
        else:
            logger.error(f"❌ Dashboard API test failed: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Dashboard API test failed: {e}")
        return False

def test_comments_list():
    """Test comments list API"""
    try:
        response = requests.get("http://localhost:8000/api/comments?limit=5", timeout=10)
        if response.status_code == 200:
            data = response.json()
            logger.info("✅ Comments list test passed")
            logger.info(f"   Retrieved {len(data)} comments")
            return True
        else:
            logger.error(f"❌ Comments list test failed: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Comments list test failed: {e}")
        return False

def test_csv_upload():
    """Test CSV bulk upload"""
    try:
        csv_content = """stakeholder_type,raw_text
citizen,This test policy will create jobs and boost the economy.
business,The new regulations may increase compliance costs.
ngo,We support environmental protection measures in this policy."""
        
        files = {'file': ('test.csv', csv_content, 'text/csv')}
        response = requests.post(
            "http://localhost:8000/api/comments/bulk",
            files=files,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            logger.info("✅ CSV upload test passed")
            logger.info(f"   Processed {len(data.get('comments', []))} comments")
            return True
        else:
            logger.error(f"❌ CSV upload test failed: {response.status_code}")
            logger.error(f"   Response: {response.text}")
            return False
    except Exception as e:
        logger.error(f"❌ CSV upload test failed: {e}")
        return False

def wait_for_services():
    """Wait for services to be ready"""
    logger.info("⏳ Waiting for services to start...")
    
    max_attempts = 30
    backend_ready = False
    
    for attempt in range(max_attempts):
        try:
            response = requests.get("http://localhost:8000/", timeout=5)
            if response.status_code == 200:
                backend_ready = True
                break
        except:
            pass
        
        time.sleep(2)
        logger.info(f"   Attempt {attempt + 1}/{max_attempts}")
    
    if not backend_ready:
        logger.error("❌ Backend service did not start within timeout")
        return False
    
    logger.info("✅ Services are ready")
    return True

def test_wordcloud_api():
    """Test word cloud API endpoints"""
    try:
        # Test basic word cloud
        response = requests.get("http://localhost:8000/api/wordcloud", timeout=30)
        if response.status_code == 200:
            logger.info("✅ Basic word cloud API test passed")
            return True
        else:
            logger.error(f"❌ Basic word cloud API test failed: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Word cloud API test failed: {e}")
        return False

def test_sentiment_wordcloud():
    """Test sentiment-specific word cloud"""
    try:
        response = requests.get("http://localhost:8000/api/wordcloud?sentiment=positive", timeout=30)
        if response.status_code in [200, 404]:  # 404 is OK if no positive comments
            logger.info("✅ Sentiment word cloud API test passed")
            return True
        else:
            logger.error(f"❌ Sentiment word cloud API test failed: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Sentiment word cloud API test failed: {e}")
        return False

def main():
    """Run all tests"""
    logger.info("🧪 Starting eConsultation AI System Tests")
    logger.info("=" * 50)
    
    # Wait for services
    if not wait_for_services():
        logger.error("❌ Services not ready, aborting tests")
        return False
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Comment Submission", test_comment_submission),
        ("Dashboard API", test_dashboard_api),
        ("Comments List", test_comments_list),
        ("CSV Upload", test_csv_upload),
        ("Word Cloud API", test_wordcloud_api),
        ("Sentiment Word Cloud", test_sentiment_wordcloud),
        ("Frontend Health", test_frontend_health),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        logger.info(f"\n🔍 Running {test_name} test...")
        if test_func():
            passed += 1
        else:
            logger.error(f"❌ {test_name} test failed")
    
    logger.info("\n" + "=" * 50)
    logger.info(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        logger.info("🎉 All tests passed! System is working correctly.")
        return True
    else:
        logger.error(f"❌ {total - passed} tests failed. Please check the logs above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)