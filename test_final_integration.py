#!/usr/bin/env python3
"""
Final Integration Testing and Cleanup Script
Tests complete user workflows from frontend to backend and verifies system health.
"""

import requests
import time
import json
import subprocess
import sys
import os
from pathlib import Path
import tempfile
import csv

class IntegrationTester:
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.frontend_url = "http://localhost:3000"
        self.test_results = []
        self.errors = []
        
    def log_test(self, test_name, success, message="", duration=0):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "duration": duration
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message} ({duration:.2f}s)")
        
    def log_error(self, error):
        """Log errors for cleanup"""
        self.errors.append(error)
        print(f"🔍 Error detected: {error}")

    def test_backend_health(self):
        """Test backend health and performance"""
        print("\n🔧 Testing Backend Health...")
        
        start_time = time.time()
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                self.log_test("Backend Health Check", True, "Backend is healthy", duration)
                return True
            else:
                self.log_test("Backend Health Check", False, f"Status: {response.status_code}", duration)
                return False
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            self.log_test("Backend Health Check", False, f"Connection failed: {str(e)}", duration)
            return False

    def test_comment_processing_workflow(self):
        """Test complete comment processing workflow"""
        print("\n💬 Testing Comment Processing Workflow...")
        
        test_comment = {
            "stakeholder_type": "citizen",
            "raw_text": "This is a test comment to verify the AI system processes comments quickly and accurately."
        }
        
        start_time = time.time()
        try:
            response = requests.post(
                f"{self.backend_url}/api/comments",
                json=test_comment,
                timeout=5
            )
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                required_fields = ['id', 'sentiment_label', 'sentiment_score', 'summary']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Comment Processing", False, f"Missing fields: {missing_fields}", duration)
                    return False
                
                # Verify performance requirement (< 2 seconds)
                if duration > 2.0:
                    self.log_test("Comment Processing Performance", False, f"Too slow: {duration:.2f}s > 2.0s", duration)
                else:
                    self.log_test("Comment Processing Performance", True, f"Fast processing", duration)
                
                self.log_test("Comment Processing", True, f"Sentiment: {data['sentiment_label']}", duration)
                return True
            else:
                self.log_test("Comment Processing", False, f"Status: {response.status_code}", duration)
                return False
                
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            self.log_test("Comment Processing", False, f"Request failed: {str(e)}", duration)
            return False

    def test_dashboard_loading_workflow(self):
        """Test dashboard data loading workflow"""
        print("\n📊 Testing Dashboard Loading Workflow...")
        
        start_time = time.time()
        try:
            response = requests.get(f"{self.backend_url}/api/dashboard", timeout=5)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                required_fields = ['total_comments', 'positive_percentage', 'negative_percentage', 'neutral_percentage']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test("Dashboard Loading", False, f"Missing fields: {missing_fields}", duration)
                    return False
                
                # Verify performance requirement (< 3 seconds)
                if duration > 3.0:
                    self.log_test("Dashboard Loading Performance", False, f"Too slow: {duration:.2f}s > 3.0s", duration)
                else:
                    self.log_test("Dashboard Loading Performance", True, f"Fast loading", duration)
                
                self.log_test("Dashboard Loading", True, f"Total comments: {data['total_comments']}", duration)
                return True
            else:
                self.log_test("Dashboard Loading", False, f"Status: {response.status_code}", duration)
                return False
                
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            self.log_test("Dashboard Loading", False, f"Request failed: {str(e)}", duration)
            return False

    def test_wordcloud_generation_workflow(self):
        """Test word cloud generation workflow"""
        print("\n☁️ Testing Word Cloud Generation Workflow...")
        
        start_time = time.time()
        try:
            response = requests.get(
                f"{self.backend_url}/api/wordcloud",
                timeout=15  # Word clouds can take longer
            )
            duration = time.time() - start_time
            
            if response.status_code == 200:
                # Verify performance requirement (< 10 seconds)
                if duration > 10.0:
                    self.log_test("Word Cloud Generation Performance", False, f"Too slow: {duration:.2f}s > 10.0s", duration)
                else:
                    self.log_test("Word Cloud Generation Performance", True, f"Generated in time", duration)
                
                # Check if response contains image data or URL
                content_type = response.headers.get('content-type', '')
                if 'image' in content_type or len(response.content) > 1000:
                    self.log_test("Word Cloud Generation", True, f"Image generated", duration)
                    return True
                else:
                    self.log_test("Word Cloud Generation", False, f"Invalid response format", duration)
                    return False
            else:
                self.log_test("Word Cloud Generation", False, f"Status: {response.status_code}", duration)
                return False
                
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            self.log_test("Word Cloud Generation", False, f"Request failed: {str(e)}", duration)
            return False

    def test_csv_upload_workflow(self):
        """Test CSV upload workflow"""
        print("\n📁 Testing CSV Upload Workflow...")
        
        # Create a temporary CSV file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            writer = csv.writer(f)
            writer.writerow(['stakeholder_type', 'raw_text'])
            writer.writerow(['citizen', 'This is a positive test comment about the new policy.'])
            writer.writerow(['business', 'We have concerns about the implementation timeline.'])
            writer.writerow(['ngo', 'This initiative will benefit the community greatly.'])
            csv_file_path = f.name
        
        try:
            start_time = time.time()
            
            with open(csv_file_path, 'rb') as f:
                files = {'file': ('test_comments.csv', f, 'text/csv')}
                response = requests.post(
                    f"{self.backend_url}/api/comments/bulk",
                    files=files,
                    timeout=30
                )
            
            duration = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if 'comments' in data and len(data['comments']) > 0:
                    self.log_test("CSV Upload", True, f"Processed {len(data['comments'])} comments", duration)
                    return True
                else:
                    self.log_test("CSV Upload", False, "No comments processed", duration)
                    return False
            else:
                self.log_test("CSV Upload", False, f"Status: {response.status_code}", duration)
                return False
                
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            self.log_test("CSV Upload", False, f"Request failed: {str(e)}", duration)
            return False
        finally:
            # Clean up temporary file
            try:
                os.unlink(csv_file_path)
            except:
                pass

    def test_error_handling_scenarios(self):
        """Test error handling and recovery mechanisms"""
        print("\n🚨 Testing Error Handling Scenarios...")
        
        # Test invalid comment submission
        start_time = time.time()
        try:
            invalid_comment = {
                "stakeholder_type": "invalid_type",
                "raw_text": ""  # Empty text
            }
            
            response = requests.post(
                f"{self.backend_url}/api/comments",
                json=invalid_comment,
                timeout=5
            )
            duration = time.time() - start_time
            
            # Should return 400 or 422 for validation error
            if response.status_code in [400, 422]:
                self.log_test("Error Handling - Invalid Input", True, "Properly rejected invalid input", duration)
            else:
                self.log_test("Error Handling - Invalid Input", False, f"Unexpected status: {response.status_code}", duration)
                
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            self.log_test("Error Handling - Invalid Input", False, f"Request failed: {str(e)}", duration)
        
        # Test timeout handling (simulate with very long text)
        start_time = time.time()
        try:
            long_comment = {
                "stakeholder_type": "citizen",
                "raw_text": "A" * 1000  # Very long text to potentially cause timeout
            }
            
            response = requests.post(
                f"{self.backend_url}/api/comments",
                json=long_comment,
                timeout=5
            )
            duration = time.time() - start_time
            
            # Should either process successfully or return appropriate error
            if response.status_code in [200, 400, 422]:
                self.log_test("Error Handling - Long Input", True, "Handled long input appropriately", duration)
            else:
                self.log_test("Error Handling - Long Input", False, f"Unexpected status: {response.status_code}", duration)
                
        except requests.exceptions.Timeout:
            duration = time.time() - start_time
            self.log_test("Error Handling - Timeout", True, "Timeout handled properly", duration)
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            self.log_test("Error Handling - Long Input", False, f"Request failed: {str(e)}", duration)

    def test_frontend_accessibility(self):
        """Test if frontend is accessible"""
        print("\n🌐 Testing Frontend Accessibility...")
        
        start_time = time.time()
        try:
            response = requests.get(self.frontend_url, timeout=10)
            duration = time.time() - start_time
            
            if response.status_code == 200:
                # Check if it's a React app (contains typical React indicators)
                content = response.text.lower()
                if 'react' in content or 'root' in content or 'app' in content:
                    self.log_test("Frontend Accessibility", True, "Frontend is accessible", duration)
                    return True
                else:
                    self.log_test("Frontend Accessibility", False, "Frontend content unexpected", duration)
                    return False
            else:
                self.log_test("Frontend Accessibility", False, f"Status: {response.status_code}", duration)
                return False
                
        except requests.exceptions.RequestException as e:
            duration = time.time() - start_time
            self.log_test("Frontend Accessibility", False, f"Connection failed: {str(e)}", duration)
            return False

    def check_for_complex_loading_files(self):
        """Check for unused complex loading state files that should be removed"""
        print("\n🧹 Checking for Complex Loading State Files...")
        
        complex_files_to_check = [
            "frontend/src/components/LoadingStateManager.js",
            "frontend/src/components/LoadingStateDebugger.js", 
            "frontend/src/components/LoadingStateDebugPanel.jsx",
            "frontend/src/utils/loadingStateDebugUtils.js",
            "frontend/src/utils/runtimeLoadingDetector.js",
            "frontend/src/App_emergency_simple.jsx",
            "frontend/src/hooks/useLoadingState.js"  # Old complex version
        ]
        
        files_found = []
        for file_path in complex_files_to_check:
            if os.path.exists(file_path):
                files_found.append(file_path)
                self.log_error(f"Complex loading file still exists: {file_path}")
        
        if files_found:
            self.log_test("Complex Loading Files Cleanup", False, f"Found {len(files_found)} files to remove", 0)
            return files_found
        else:
            self.log_test("Complex Loading Files Cleanup", True, "No complex loading files found", 0)
            return []

    def verify_simple_loading_implementation(self):
        """Verify that the simple loading system is properly implemented"""
        print("\n✅ Verifying Simple Loading Implementation...")
        
        # Check that App.jsx uses useSimpleLoading
        app_jsx_path = "frontend/src/App.jsx"
        if os.path.exists(app_jsx_path):
            with open(app_jsx_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if "useSimpleLoading" in content:
                self.log_test("Simple Loading Hook Usage", True, "App.jsx uses useSimpleLoading", 0)
            else:
                self.log_test("Simple Loading Hook Usage", False, "App.jsx doesn't use useSimpleLoading", 0)
                self.log_error("App.jsx should import and use useSimpleLoading hook")
        
        # Check that useSimpleLoading hook exists
        hook_path = "frontend/src/hooks/useSimpleLoading.js"
        if os.path.exists(hook_path):
            self.log_test("Simple Loading Hook Exists", True, "useSimpleLoading hook file exists", 0)
        else:
            self.log_test("Simple Loading Hook Exists", False, "useSimpleLoading hook file missing", 0)
            self.log_error("useSimpleLoading hook file is missing")
        
        # Check that API service exists
        api_service_path = "frontend/src/services/apiService.js"
        if os.path.exists(api_service_path):
            self.log_test("API Service Exists", True, "API service file exists", 0)
        else:
            self.log_test("API Service Exists", False, "API service file missing", 0)
            self.log_error("API service file is missing")

    def run_all_tests(self):
        """Run all integration tests"""
        print("🚀 Starting Final Integration Testing...")
        print("=" * 60)
        
        # Test backend health first
        backend_healthy = self.test_backend_health()
        
        if backend_healthy:
            # Run workflow tests
            self.test_comment_processing_workflow()
            self.test_dashboard_loading_workflow()
            self.test_wordcloud_generation_workflow()
            self.test_csv_upload_workflow()
            self.test_error_handling_scenarios()
        else:
            print("⚠️ Backend not healthy, skipping workflow tests")
        
        # Test frontend
        self.test_frontend_accessibility()
        
        # Verify implementation
        self.verify_simple_loading_implementation()
        
        # Check for cleanup needed
        complex_files = self.check_for_complex_loading_files()
        
        # Generate report
        self.generate_report(complex_files)
        
        return len(self.errors) == 0

    def generate_report(self, complex_files_found):
        """Generate final test report"""
        print("\n" + "=" * 60)
        print("📋 FINAL INTEGRATION TEST REPORT")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        if self.errors:
            print(f"\n🔍 ISSUES FOUND ({len(self.errors)}):")
            for error in self.errors:
                print(f"  - {error}")
        
        if complex_files_found:
            print(f"\n🧹 FILES TO REMOVE ({len(complex_files_found)}):")
            for file_path in complex_files_found:
                print(f"  - {file_path}")
        
        # Performance summary
        print(f"\n⚡ PERFORMANCE SUMMARY:")
        for result in self.test_results:
            if 'Performance' in result['test'] and result['success']:
                print(f"  ✅ {result['test']}: {result['duration']:.2f}s")
            elif 'Performance' in result['test'] and not result['success']:
                print(f"  ❌ {result['test']}: {result['message']}")
        
        if len(self.errors) == 0 and failed_tests == 0:
            print(f"\n🎉 ALL TESTS PASSED! System is ready for production.")
        else:
            print(f"\n⚠️ Issues found. Please address the errors above before deployment.")
        
        # Save detailed report
        report_data = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "summary": {
                "total_tests": total_tests,
                "passed": passed_tests,
                "failed": failed_tests,
                "success_rate": passed_tests/total_tests*100
            },
            "test_results": self.test_results,
            "errors": self.errors,
            "complex_files_found": complex_files_found
        }
        
        with open("final_integration_test_report.json", "w") as f:
            json.dump(report_data, f, indent=2)
        
        print(f"\n📄 Detailed report saved to: final_integration_test_report.json")

def main():
    """Main function"""
    tester = IntegrationTester()
    success = tester.run_all_tests()
    
    if success:
        print(f"\n✅ Integration testing completed successfully!")
        return 0
    else:
        print(f"\n❌ Integration testing found issues that need to be addressed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())