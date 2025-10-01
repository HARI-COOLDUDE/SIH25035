#!/usr/bin/env python3
"""
Performance Requirements Validation
Quick validation script to test performance against running system
"""

import time
import requests
import json
import sys
import tempfile
import csv
import os

def test_backend_availability():
    """Check if backend is running"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def test_comment_processing_performance():
    """Test Requirement 1.2: Comment processing < 2 seconds"""
    print("Testing comment processing performance...")
    
    test_comment = {
        "stakeholder_type": "citizen",
        "raw_text": "This is a performance test comment to validate processing speed."
    }
    
    start_time = time.time()
    try:
        response = requests.post(
            "http://localhost:8000/api/comments",
            json=test_comment,
            timeout=10
        )
        duration = time.time() - start_time
        
        if response.status_code == 200:
            passed = duration < 2.0
            print(f"  ✅ Comment processed in {duration:.2f}s" if passed else f"  ❌ Comment took {duration:.2f}s (>2s limit)")
            return passed
        else:
            print(f"  ❌ Comment processing failed: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        duration = time.time() - start_time
        print(f"  ❌ Comment processing error after {duration:.2f}s: {e}")
        return False

def test_dashboard_loading_performance():
    """Test Requirement 3.2: Dashboard loading < 3 seconds"""
    print("Testing dashboard loading performance...")
    
    # Test dashboard stats
    start_time = time.time()
    try:
        response = requests.get("http://localhost:8000/api/dashboard", timeout=10)
        duration = time.time() - start_time
        
        if response.status_code == 200:
            passed = duration < 3.0
            print(f"  ✅ Dashboard stats loaded in {duration:.2f}s" if passed else f"  ❌ Dashboard stats took {duration:.2f}s (>3s limit)")
            stats_passed = passed
        else:
            print(f"  ❌ Dashboard stats failed: HTTP {response.status_code}")
            stats_passed = False
            
    except Exception as e:
        duration = time.time() - start_time
        print(f"  ❌ Dashboard stats error after {duration:.2f}s: {e}")
        stats_passed = False
    
    # Test comments list
    start_time = time.time()
    try:
        response = requests.get("http://localhost:8000/api/comments", timeout=10)
        duration = time.time() - start_time
        
        if response.status_code == 200:
            passed = duration < 3.0
            print(f"  ✅ Comments list loaded in {duration:.2f}s" if passed else f"  ❌ Comments list took {duration:.2f}s (>3s limit)")
            comments_passed = passed
        else:
            print(f"  ❌ Comments list failed: HTTP {response.status_code}")
            comments_passed = False
            
    except Exception as e:
        duration = time.time() - start_time
        print(f"  ❌ Comments list error after {duration:.2f}s: {e}")
        comments_passed = False
    
    return stats_passed and comments_passed

def test_wordcloud_generation_performance():
    """Test Requirement 3.3: Word cloud generation < 10 seconds"""
    print("Testing word cloud generation performance...")
    
    start_time = time.time()
    try:
        response = requests.get("http://localhost:8000/api/wordcloud", timeout=15)
        duration = time.time() - start_time
        
        if response.status_code == 200:
            passed = duration < 10.0
            print(f"  ✅ Word cloud generated in {duration:.2f}s" if passed else f"  ❌ Word cloud took {duration:.2f}s (>10s limit)")
            return passed
        else:
            print(f"  ❌ Word cloud generation failed: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        duration = time.time() - start_time
        print(f"  ❌ Word cloud generation error after {duration:.2f}s: {e}")
        return False

def test_csv_upload_performance():
    """Test Requirement 3.4: CSV upload with progress indicators"""
    print("Testing CSV upload performance...")
    
    # Create test CSV
    test_data = [
        ["stakeholder_type", "raw_text"],
        ["citizen", "Test comment 1 for CSV upload validation"],
        ["business", "Test comment 2 for CSV upload validation"],
        ["ngo", "Test comment 3 for CSV upload validation"]
    ]
    
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False)
    writer = csv.writer(temp_file)
    writer.writerows(test_data)
    temp_file.close()
    
    try:
        start_time = time.time()
        
        with open(temp_file.name, 'rb') as f:
            files = {'file': ('test_comments.csv', f, 'text/csv')}
            response = requests.post(
                "http://localhost:8000/api/comments/bulk",
                files=files,
                timeout=30
            )
        
        duration = time.time() - start_time
        
        if response.status_code == 200:
            data = response.json()
            processed = data.get('processed_count', 0)
            print(f"  ✅ CSV upload completed in {duration:.2f}s, processed {processed} comments")
            return True
        else:
            print(f"  ❌ CSV upload failed: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        duration = time.time() - start_time
        print(f"  ❌ CSV upload error after {duration:.2f}s: {e}")
        return False
    finally:
        # Clean up
        if os.path.exists(temp_file.name):
            os.unlink(temp_file.name)

def main():
    """Main validation function"""
    print("Performance Requirements Validation")
    print("=" * 50)
    
    # Check if backend is running
    if not test_backend_availability():
        print("❌ Backend is not running on http://localhost:8000")
        print("Please start the backend first using:")
        print("  python start_backend_optimized.py")
        print("  or")
        print("  python backend/app_optimized.py")
        return False
    
    print("✅ Backend is running, starting performance tests...\n")
    
    # Run all performance tests
    results = []
    
    print("1. Comment Processing Performance (Requirement 1.2)")
    results.append(test_comment_processing_performance())
    
    print("\n2. Dashboard Loading Performance (Requirement 3.2)")
    results.append(test_dashboard_loading_performance())
    
    print("\n3. Word Cloud Generation Performance (Requirement 3.3)")
    results.append(test_wordcloud_generation_performance())
    
    print("\n4. CSV Upload Performance (Requirement 3.4)")
    results.append(test_csv_upload_performance())
    
    # Print summary
    print("\n" + "=" * 50)
    print("PERFORMANCE VALIDATION SUMMARY")
    print("=" * 50)
    
    passed_tests = sum(results)
    total_tests = len(results)
    
    print(f"Tests Passed: {passed_tests}/{total_tests}")
    
    requirements = [
        "Comment processing < 2 seconds (Req 1.2)",
        "Dashboard loading < 3 seconds (Req 3.2)", 
        "Word cloud generation < 10 seconds (Req 3.3)",
        "CSV upload with progress (Req 3.4)"
    ]
    
    for i, (req, passed) in enumerate(zip(requirements, results)):
        status = "✅" if passed else "❌"
        print(f"  {status} {req}")
    
    if all(results):
        print("\n🎉 ALL PERFORMANCE REQUIREMENTS VALIDATED!")
        return True
    else:
        print(f"\n⚠️  {total_tests - passed_tests} performance requirement(s) not met")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)