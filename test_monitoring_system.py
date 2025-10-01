#!/usr/bin/env python3
"""
Test script for the monitoring and logging system
Verifies that all monitoring features work correctly
"""

import requests
import time
import json
import sys
import os

# Add backend directory to path
sys.path.append('backend')

def test_backend_monitoring():
    """Test backend monitoring endpoints"""
    base_url = "http://localhost:8000"
    
    print("🔍 Testing Backend Monitoring System...")
    
    # Test basic health check
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Basic health check: PASSED")
            health_data = response.json()
            print(f"   Status: {health_data.get('status')}")
        else:
            print(f"❌ Basic health check: FAILED (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Basic health check: FAILED (Error: {e})")
    
    # Test detailed health check
    try:
        response = requests.get(f"{base_url}/health/detailed", timeout=10)
        if response.status_code == 200:
            print("✅ Detailed health check: PASSED")
            health_data = response.json()
            print(f"   Overall status: {health_data.get('status')}")
            
            # Check components
            checks = health_data.get('checks', {})
            for component, status in checks.items():
                component_status = status.get('status', 'unknown')
                print(f"   {component}: {component_status}")
        else:
            print(f"❌ Detailed health check: FAILED (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Detailed health check: FAILED (Error: {e})")
    
    # Test comprehensive health check
    try:
        response = requests.get(f"{base_url}/health/comprehensive", timeout=10)
        if response.status_code == 200:
            print("✅ Comprehensive health check: PASSED")
            health_data = response.json()
            print(f"   Overall status: {health_data.get('overall_status')}")
        else:
            print(f"❌ Comprehensive health check: FAILED (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Comprehensive health check: FAILED (Error: {e})")
    
    # Test performance metrics
    try:
        response = requests.get(f"{base_url}/monitoring/performance", timeout=10)
        if response.status_code == 200:
            print("✅ Performance metrics: PASSED")
            perf_data = response.json()
            overall = perf_data.get('overall', {})
            print(f"   Total requests: {overall.get('total_requests', 0)}")
            print(f"   Error rate: {overall.get('overall_error_rate', 0):.1f}%")
        else:
            print(f"❌ Performance metrics: FAILED (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Performance metrics: FAILED (Error: {e})")
    
    # Test log retrieval
    try:
        response = requests.get(f"{base_url}/monitoring/logs?lines=5", timeout=10)
        if response.status_code == 200:
            print("✅ Log retrieval: PASSED")
            log_data = response.json()
            print(f"   Log entries: {log_data.get('total_entries', 0)}")
        else:
            print(f"❌ Log retrieval: FAILED (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Log retrieval: FAILED (Error: {e})")

def test_performance_monitoring():
    """Test performance monitoring by making API calls"""
    base_url = "http://localhost:8000"
    
    print("\n⏱️  Testing Performance Monitoring...")
    
    # Test comment submission performance
    try:
        comment_data = {
            "stakeholder_type": "citizen",
            "raw_text": "This is a test comment for monitoring system validation."
        }
        
        start_time = time.time()
        response = requests.post(
            f"{base_url}/api/comments", 
            json=comment_data, 
            timeout=10
        )
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000  # Convert to milliseconds
        
        if response.status_code == 200:
            print(f"✅ Comment submission: PASSED ({response_time:.1f}ms)")
            if response_time > 2000:
                print("   ⚠️  Response time exceeds 2000ms target")
        else:
            print(f"❌ Comment submission: FAILED (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Comment submission: FAILED (Error: {e})")
    
    # Test dashboard loading performance
    try:
        start_time = time.time()
        response = requests.get(f"{base_url}/api/dashboard", timeout=10)
        end_time = time.time()
        
        response_time = (end_time - start_time) * 1000
        
        if response.status_code == 200:
            print(f"✅ Dashboard loading: PASSED ({response_time:.1f}ms)")
            if response_time > 3000:
                print("   ⚠️  Response time exceeds 3000ms target")
        else:
            print(f"❌ Dashboard loading: FAILED (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Dashboard loading: FAILED (Error: {e})")

def test_error_logging():
    """Test error logging by triggering errors"""
    base_url = "http://localhost:8000"
    
    print("\n📝 Testing Error Logging...")
    
    # Test invalid comment submission
    try:
        invalid_comment = {
            "stakeholder_type": "invalid_type",
            "raw_text": "x" * 500  # Exceeds 300 character limit
        }
        
        response = requests.post(
            f"{base_url}/api/comments", 
            json=invalid_comment, 
            timeout=10
        )
        
        if response.status_code == 422:  # Validation error expected
            print("✅ Error logging (validation): PASSED")
        else:
            print(f"❌ Error logging (validation): Unexpected status {response.status_code}")
    except Exception as e:
        print(f"❌ Error logging (validation): FAILED (Error: {e})")
    
    # Test non-existent endpoint
    try:
        response = requests.get(f"{base_url}/api/nonexistent", timeout=5)
        if response.status_code == 404:
            print("✅ Error logging (404): PASSED")
        else:
            print(f"❌ Error logging (404): Unexpected status {response.status_code}")
    except Exception as e:
        print(f"❌ Error logging (404): FAILED (Error: {e})")

def test_log_files():
    """Test that log files are created and contain appropriate content"""
    print("\n📁 Testing Log Files...")
    
    log_files = ['backend/logs/app.log', 'backend/logs/error.log']
    
    for log_file in log_files:
        if os.path.exists(log_file):
            print(f"✅ Log file exists: {log_file}")
            
            # Check file size
            size = os.path.getsize(log_file)
            print(f"   Size: {size} bytes")
            
            # Check recent content (last 5 lines)
            try:
                with open(log_file, 'r') as f:
                    lines = f.readlines()
                    if lines:
                        print(f"   Recent entries: {len(lines)} total lines")
                        # Check for sensitive information (should be redacted)
                        recent_content = ''.join(lines[-5:])
                        if any(word in recent_content.lower() for word in ['password', 'secret', 'token']):
                            print("   ⚠️  Potential sensitive information found in logs")
                        else:
                            print("   ✅ No sensitive information detected")
                    else:
                        print("   📝 Log file is empty")
            except Exception as e:
                print(f"   ❌ Error reading log file: {e}")
        else:
            print(f"❌ Log file missing: {log_file}")

def test_monitoring_targets():
    """Test that performance targets are being monitored"""
    base_url = "http://localhost:8000"
    
    print("\n🎯 Testing Performance Targets...")
    
    try:
        response = requests.get(f"{base_url}/monitoring/performance", timeout=10)
        if response.status_code == 200:
            perf_data = response.json()
            targets = perf_data.get('performance_targets', {})
            
            expected_targets = {
                'comment_processing_ms': 2000,
                'dashboard_loading_ms': 3000,
                'wordcloud_generation_ms': 10000,
                'api_response_ms': 1000
            }
            
            all_targets_present = True
            for target_name, expected_value in expected_targets.items():
                if target_name in targets and targets[target_name] == expected_value:
                    print(f"✅ Target {target_name}: {expected_value}ms")
                else:
                    print(f"❌ Target {target_name}: Missing or incorrect")
                    all_targets_present = False
            
            if all_targets_present:
                print("✅ All performance targets configured correctly")
            else:
                print("❌ Some performance targets are missing or incorrect")
        else:
            print(f"❌ Could not retrieve performance targets (Status: {response.status_code})")
    except Exception as e:
        print(f"❌ Error testing performance targets: {e}")

def main():
    """Run all monitoring system tests"""
    print("🚀 Starting Monitoring System Tests")
    print("=" * 50)
    
    # Check if backend is running
    try:
        response = requests.get("http://localhost:8000/", timeout=5)
        if response.status_code != 200:
            print("❌ Backend is not running or not responding")
            print("   Please start the backend with: python backend/app_optimized.py")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        print("   Please start the backend with: python backend/app_optimized.py")
        return False
    
    print("✅ Backend is running")
    print()
    
    # Run all tests
    test_backend_monitoring()
    test_performance_monitoring()
    test_error_logging()
    test_log_files()
    test_monitoring_targets()
    
    print("\n" + "=" * 50)
    print("🏁 Monitoring System Tests Complete")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)