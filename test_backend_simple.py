#!/usr/bin/env python3
"""
Simple Backend Test Script
Tests if the backend is working properly
"""

import subprocess
import time
import requests
import logging
import sys
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_backend():
    """Test backend functionality"""
    logger.info("🧪 Testing Backend Functionality")
    
    # Test health endpoint
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

def test_comment_submission():
    """Test comment submission"""
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

def test_dashboard():
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

def main():
    """Main test function"""
    logger.info("🚀 Starting Backend Tests")
    logger.info("=" * 50)
    
    # Wait for backend to be ready
    logger.info("⏳ Waiting for backend to be ready...")
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
        logger.error("❌ Backend not ready, please start it first")
        logger.info("To start backend: cd backend && python start_simple.py")
        return False
    
    logger.info("✅ Backend is ready")
    
    # Run tests
    tests = [
        ("Backend Health", test_backend),
        ("Comment Submission", test_comment_submission),
        ("Dashboard API", test_dashboard),
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
        logger.info("🎉 All tests passed! Backend is working correctly.")
        return True
    else:
        logger.error(f"❌ {total - passed} tests failed.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)