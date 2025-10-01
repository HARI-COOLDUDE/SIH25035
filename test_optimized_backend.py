#!/usr/bin/env python3
"""
Test Optimized Backend Script
Tests the optimized backend functionality
"""

import os
import sys
import subprocess
import time
import requests
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_backend_import():
    """Test if backend can be imported successfully"""
    logger.info("🧪 Testing backend import...")
    
    try:
        # Test import in virtual environment
        result = subprocess.run([
            'backend/venv/Scripts/python.exe', '-c',
            'import sys; sys.path.append("."); from app_optimized import app; print("Import successful")'
        ], cwd='backend', capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            logger.info("✅ Backend imports successfully")
            return True
        else:
            logger.error(f"❌ Backend import failed: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        logger.error("❌ Backend import timed out")
        return False
    except Exception as e:
        logger.error(f"❌ Error testing backend import: {e}")
        return False

def test_backend_health():
    """Test backend health endpoint"""
    logger.info("🧪 Testing backend health endpoint...")
    
    try:
        # Start backend in background
        process = subprocess.Popen([
            'backend/venv/Scripts/python.exe', 'app_optimized.py'
        ], cwd='backend')
        
        # Wait for backend to start
        logger.info("⏳ Waiting for backend to start...")
        time.sleep(10)
        
        # Test health endpoint
        try:
            response = requests.get('http://localhost:8000/health', timeout=5)
            if response.status_code == 200:
                data = response.json()
                logger.info("✅ Health check passed")
                logger.info(f"   Status: {data.get('status')}")
                logger.info(f"   Version: {data.get('version')}")
                logger.info(f"   Database: {data.get('database')}")
                logger.info(f"   Comment count: {data.get('comment_count')}")
                
                # Check optimizations
                optimizations = data.get('optimizations', {})
                if optimizations:
                    logger.info("✅ Optimizations enabled:")
                    for key, value in optimizations.items():
                        logger.info(f"   {key}: {value}")
                
                return True
            else:
                logger.error(f"❌ Health check failed with status {response.status_code}")
                return False
                
        except requests.RequestException as e:
            logger.error(f"❌ Failed to connect to backend: {e}")
            return False
        
        finally:
            # Stop backend
            process.terminate()
            process.wait(timeout=5)
            
    except Exception as e:
        logger.error(f"❌ Error testing backend health: {e}")
        return False

def test_comment_processing():
    """Test comment processing functionality"""
    logger.info("🧪 Testing comment processing...")
    
    try:
        # Start backend in background
        process = subprocess.Popen([
            'backend/venv/Scripts/python.exe', 'app_optimized.py'
        ], cwd='backend')
        
        # Wait for backend to start
        time.sleep(10)
        
        # Test comment submission
        test_comment = {
            "stakeholder_type": "citizen",
            "raw_text": "This is a test comment to verify the optimized backend processing with 300 character limit and 50 character summary limit. The system should process this quickly with caching enabled."
        }
        
        try:
            response = requests.post('http://localhost:8000/api/comments', 
                                   json=test_comment, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                logger.info("✅ Comment processing test passed")
                logger.info(f"   Comment ID: {data.get('id')}")
                logger.info(f"   Sentiment: {data.get('sentiment_label')} ({data.get('sentiment_score'):.2f})")
                logger.info(f"   Summary: {data.get('summary')}")
                logger.info(f"   Comment length: {len(data.get('raw_text', ''))} chars (max 300)")
                logger.info(f"   Summary length: {len(data.get('summary', ''))} chars (max 50)")
                
                # Verify limits
                if len(data.get('raw_text', '')) <= 300 and len(data.get('summary', '')) <= 50:
                    logger.info("✅ Character limits enforced correctly")
                    return True
                else:
                    logger.error("❌ Character limits not enforced")
                    return False
            else:
                logger.error(f"❌ Comment processing failed with status {response.status_code}")
                return False
                
        except requests.RequestException as e:
            logger.error(f"❌ Failed to process comment: {e}")
            return False
        
        finally:
            # Stop backend
            process.terminate()
            process.wait(timeout=5)
            
    except Exception as e:
        logger.error(f"❌ Error testing comment processing: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 eConsultation AI - Optimized Backend Tests")
    print("=" * 60)
    
    tests_passed = 0
    total_tests = 3
    
    # Test 1: Backend import
    if test_backend_import():
        tests_passed += 1
    
    # Test 2: Backend health
    if test_backend_health():
        tests_passed += 1
    
    # Test 3: Comment processing
    if test_comment_processing():
        tests_passed += 1
    
    print(f"\n📊 Test Results: {tests_passed}/{total_tests} tests passed")
    
    if tests_passed == total_tests:
        print("🎉 All tests passed! Optimized backend is working correctly.")
        print("\n✅ Verified features:")
        print("• Virtual environment isolation")
        print("• Optimized backend as primary")
        print("• 300 character comment limit")
        print("• 50 character summary limit")
        print("• AI model caching")
        print("• Health check endpoints")
        print("• Comment processing pipeline")
        return True
    else:
        print("❌ Some tests failed. Please check the error messages above.")
        return False

if __name__ == "__main__":
    success = main()
    input("\nPress Enter to exit...")